# node-red-contrib-startup

Motor/fan startup controller with pre-run, ramp-up, ramp-down and post-run phases. Designed for controlled starting and stopping of fans, pumps and motors.

## Install

```bash
npm install node-red-contrib-startup
```

## Usage

Send `true` to start, `false` to stop.

| msg | Effect |
|-----|--------|
| `msg.payload = true` | Start sequence (pre-run → ramp-up → running) |
| `msg.payload = false` | Stop sequence (ramp-down → post-run → stopped) |
| `msg.bypass = true` | Skip pre-run and ramp phases |

## Output 1 — Speed

`msg.payload` = current speed 0–100%.

```json
{
  "startup": {
    "phase": "rampUp",
    "speed": 65.3,
    "running": true
  }
}
```

Phases: `stopped` → `preRun` → `rampUp` → `running` → `rampDown` → `postRun` → `stopped`

## Output 2 — Running

`msg.payload = true/false` — true during all active phases (pre-run, ramp, running, post-run).

## License

MIT — sr.rpo
