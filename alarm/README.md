# node-red-contrib-rpo-alarm

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (64 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-rpo-alarm`.
<!-- rpo-suite-note:end -->

A Node-RED node: **Alarm with acknowledgement**

The alarm stays active until the fault is gone **and** the alarm has been acknowledged, like an alarm in a building management system. Optional on/off delay, inhibit (suppression) and an alarm object for notifications, dashboards and logging.

## Install

```bash
npm install node-red-contrib-rpo-alarm
```

Or via the Node-RED Palette Manager: search for `rpo-alarm`.

## How it works

| Situation | Output 1 | State |
|---|---|---|
| Fault comes | `true` | `active_unacked` |
| Fault gone, not acknowledged | stays `true` | `cleared_unacked` |
| Acknowledged, fault still present | stays `true` | `active_acked` |
| Acknowledged **and** fault gone | `false` | `normal` |
| Inhibited | `false` | `inhibited` |

## Inputs

One input, the topic decides what a message means (topic names can be changed):

| topic | payload | Meaning |
|---|---|---|
| `alarm` | `true`/`false`, `1`/`0`, `"on"`/`"off"` | Fault present / gone |
| `ack` | – | Acknowledge; optional `msg.user` is stored as `ackedBy` |
| `inhibit` | `true`/`false` | Suppress the alarm (e.g. plant off, maintenance) |

`msg.reset = true` forces the normal state.

## Outputs

1. **Active** – `payload` `true`/`false`, sent when it changes. Use it to lock equipment until someone has acknowledged (e.g. keep a burner off after overtemperature).
2. **Alarm object** – sent on every state change:

```json
{
  "name": "Boiler overtemperature",
  "state": "cleared_unacked",
  "active": true,
  "acked": false,
  "condition": false,
  "inhibited": false,
  "since": "2026-10-24T18:12:00.000Z",
  "clearedAt": "2026-10-24T18:20:00.000Z",
  "ackedAt": null,
  "ackedBy": null,
  "count": 3
}
```

## Settings

| Setting | Default | Description |
|---|---|---|
| Fault / Acknowledge / Inhibit topic | `alarm` / `ack` / `inhibit` | Topic names of the three inputs |
| Delay on (s) | 0 | Fault must be present this long before the alarm comes |
| Delay off (s) | 0 | Fault must be gone this long before the alarm counts as gone |
| Acknowledge required | on | Off: alarm comes and goes with the fault |
| Keep state on restart | on | Stores the alarm in the node context; needs a persistent `contextStorage` in settings.js to survive a Node-RED restart |

## Status

- 🟢 green dot – normal
- 🔴 red dot – active, not acknowledged
- 🔴 red ring – active, acknowledged
- 🟡 yellow dot – fault gone, not acknowledged
- ⚪ grey ring – inhibited

## Note

This is an operational interlock, not a safety function. Safety functions (e.g. a safety temperature limiter) must be implemented in hardware.

## License

MIT
