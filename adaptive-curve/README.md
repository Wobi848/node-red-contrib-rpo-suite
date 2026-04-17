# node-red-contrib-adaptive-curve

Self-learning heating curve shift for HVAC systems. Continuously adjusts the curve shift based on room temperature error to compensate for building-specific characteristics.

## Install

```bash
npm install node-red-contrib-adaptive-curve
```

## Usage

Send room and outdoor temperature values with matching topics. The node adapts the shift value over time when the room temperature deviates from the setpoint.

| msg | Effect |
|-----|--------|
| `msg.topic = "room"`, `msg.payload = 19.5` | Room temperature input |
| `msg.topic = "outdoor"`, `msg.payload = -5` | Outdoor temperature input |
| `msg.reset = true` | Reset shift to 0 |
| `msg.shift = 2.5` | Set shift manually |
| `msg.pauseAdaptation = true/false` | Pause/resume adaptation |
| `msg.roomSetpoint = 22` | Override room setpoint at runtime |

## Output — Shift value

`msg.payload` = current curve shift in Kelvin (K).

```json
{
  "adaptiveCurve": {
    "roomTemp": 19.5,
    "roomSetpoint": 22,
    "outdoor": -5,
    "error": 2.5,
    "shift": 1.2,
    "adapting": true,
    "adaptationRate": 0.005,
    "maxShift": 8,
    "deadband": 0.3,
    "heatingLimit": 15
  }
}
```

No adaptation occurs above the heating limit (summer mode).

## License

MIT — sr.rpo
