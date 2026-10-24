# node-red-contrib-operating-hours

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-operating-hours`.
<!-- rpo-suite-note:end -->

Counts operating hours and starts of a device. Triggers a maintenance alarm when the configured service interval is reached.

## Install

```bash
npm install node-red-contrib-operating-hours
```

## Usage

Send `true` (running) or `false` (stopped) as `msg.payload`.

| msg | Effect |
|-----|--------|
| `msg.payload = true` | Device running, time accumulates |
| `msg.payload = false` | Device stopped, time pauses |
| `msg.reset = true` | Reset all counters |
| `msg.resetService = true` | Reset service alarm only |

## Output 1 — Status

```json
{
  "running": true,
  "runtimeHours": 523.45,
  "starts": 142,
  "serviceInterval": 1000,
  "serviceHoursRemaining": 476.55,
  "serviceDue": false,
  "lastStart": "2026-03-01T08:00:00Z",
  "lastStop": null
}
```

## Output 2 — Service Alarm

`msg.payload = true` when service is due.

## License

MIT — sr.rpo
