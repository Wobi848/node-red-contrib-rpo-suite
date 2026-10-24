#!/usr/bin/env python3
"""Runs every example flow in a running Node-RED and reports what happened.

Use a separate test instance, not a production one: each example is deployed
as a full deploy and replaces all flows. Per example: deploy, trigger every
inject node, then collect the output of the debug nodes (replaced by
recorders with the same id) and new warnings/errors from the Node-RED log.

    python3 scripts/test-examples.py --url http://127.0.0.1:1890 \
        --log /path/to/node-red.log "node_modules/node-red-contrib-*/examples/*.json"

The instance must run without adminAuth. Prints one line per example and
exits with 1 if an example logged warnings/errors or a debug node got nothing.
Debug nodes that only fire on alarms or after long delays show up as "silent".
"""
import glob
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:1890"
LOG = None
TAB = "ex-tab"
RECORDER = """var r = global.get('rec') || {};
(r[node.id] = r[node.id] || []).push(RED.util.cloneMessage(msg).payload);
global.set('rec', r);
return null;"""
BENIGN = ("Projects disabled",)


def http(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={
        "Content-Type": "application/json", "Node-RED-Deployment-Type": "full", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()
    try:
        return json.loads(raw) if raw else None
    except ValueError:
        return None


def prepare(example):
    """All flow nodes on one tab; debug nodes become recorders with the same id (same wiring)."""
    flow = [{"id": TAB, "type": "tab", "label": "example"}]
    debugs, injects = [], []
    for n in example:
        if n.get("type") in ("tab", "subflow"):
            continue
        n = dict(n)
        if "wires" in n or n.get("type") in ("group", "comment", "junction"):
            n["z"] = TAB
        if n.get("type") == "debug":
            debugs.append(n["id"])
            n = {"id": n["id"], "type": "function", "z": TAB, "name": n.get("name", ""), "func": RECORDER,
                 "outputs": 1, "wires": [[]], "x": n.get("x", 0), "y": n.get("y", 0)}
        elif n.get("type") == "inject":
            injects.append(n["id"])
        flow.append(n)
    return flow, debugs, injects


def try_http(method, path):
    """Like http(), but a missing context key (404) is not an error."""
    try:
        return http(method, path)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def recorded():
    data = try_http("GET", "/context/global/rec") or {}
    # Node-RED returns either {msg, format} or {store: {msg, format}}
    if "msg" not in data and data:
        data = next(iter(data.values()))
    try:
        return json.loads(data.get("msg", "{}"))
    except (ValueError, TypeError, AttributeError):
        return {}


def main(pattern):
    results = []
    for path in sorted(glob.glob(pattern)):
        name = path.split("/")[-3] + "/" + os.path.basename(path)
        flow, debugs, injects = prepare(json.load(open(path)))
        log_start = os.path.getsize(LOG)
        entry = {"example": name, "injects": len(injects), "debugs": len(debugs)}
        try:
            http("POST", "/flows", flow)
            time.sleep(1.5)                       # once-injects with a short delay
            try_http("DELETE", "/context/global/rec")
            for i in injects:
                http("POST", "/inject/" + i)
                time.sleep(0.4)
            time.sleep(2.5)                       # let timers/delays finish
            rec = recorded()
            entry["outputs"] = {d: len(rec.get(d, [])) for d in debugs}
            entry["sample"] = {d: rec.get(d, [])[:3] for d in debugs if rec.get(d)}
        except Exception as e:  # noqa: BLE001 - report every failure per example
            entry["error"] = str(e)
        with open(LOG) as f:
            f.seek(log_start)
            entry["problems"] = [l.split("] ", 1)[-1][:220] for l in f.read().splitlines()
                                 if ("[error]" in l or "[warn]" in l) and not any(b in l for b in BENIGN)]
        results.append(entry)
    return results


def report(results):
    bad = 0
    for e in results:
        got = sum(1 for v in e.get("outputs", {}).values() if v > 0)
        issues = e.get("problems", []) + ([e["error"]] if "error" in e else [])
        state = "ok" if not issues and got == e["debugs"] else ("PROBLEM" if issues else "silent")
        bad += state != "ok"
        print("%-8s %-60s debug %d/%d %s" % (state, e["example"], got, e["debugs"], " | ".join(issues[:2])))
    print("%d of %d examples ok" % (len(results) - bad, len(results)))
    return bad


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("pattern", help="glob of example files")
    ap.add_argument("--url", default=BASE)
    ap.add_argument("--log", required=True, help="Node-RED log file of that instance")
    ap.add_argument("--json", action="store_true", help="print raw results as JSON")
    args = ap.parse_args()
    BASE, LOG = args.url.rstrip("/"), args.log
    res = main(args.pattern)
    if args.json:
        print(json.dumps(res))
        sys.exit(0)
    sys.exit(1 if report(res) else 0)
