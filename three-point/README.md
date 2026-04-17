# node-red-contrib-three-point

Three-point actuator controller for motorized mixing valves and dampers. Calculates open/close pulse duration based on the difference between setpoint and current position, with deadband and minimum pulse time.

## Install

```bash
npm install node-red-contrib-three-point
```

## Usage

Send target position (0–100%) as `msg.payload`.

| msg | Effect |
|-----|--------|
| `msg.payload = 75` | Move valve towards 75% open |
| `msg.open = true` | Full open command |
| `msg.close = true` | Full close command |
| `msg.stop = true` | Stop movement immediately |
| `msg.reset = true` | Reset to initial position |

## Output 1 — OPEN pulse

`msg.payload = true` while valve is opening, then `false` when pulse ends.

## Output 2 — CLOSE pulse

`msg.payload = true` while valve is closing, then `false` when pulse ends.

```json
{
  "threePoint": {
    "setpoint": 75,
    "position": 50,
    "difference": 25,
    "direction": "open",
    "pulseTime": 30.0,
    "runtime": 120,
    "deadband": 2,
    "moving": true
  }
}
```

## License

MIT — sr.rpo
