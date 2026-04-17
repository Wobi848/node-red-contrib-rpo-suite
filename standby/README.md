# node-red-contrib-standby

Standby/setback manager for HVAC systems. Switches between comfort, standby and frost setpoints based on operating mode. Typically driven by a weekly-schedule node.

## Install

```bash
npm install node-red-contrib-standby
```

## Usage

Send mode via `msg.mode` or `msg.topic`. Runtime setpoint overrides are also supported.

| msg | Effect |
|-----|--------|
| `msg.mode = "comfort"` | Switch to comfort setpoint |
| `msg.mode = "standby"` | Switch to standby (comfort + offset) |
| `msg.mode = "frost"` | Switch to frost protection setpoint |
| `msg.comfortSetpoint = 21` | Override comfort setpoint at runtime |
| `msg.standbyOffset = -3` | Override standby offset at runtime |

## Output 1 — Setpoint

`msg.payload` = active setpoint value.

```json
{
  "standby": {
    "mode": "comfort",
    "setpoint": 22,
    "comfortSetpoint": 22,
    "standbyOffset": -4,
    "frostSetpoint": 8
  }
}
```

## Output 2 — Mode change

`msg.payload` = new mode string — sent only when mode changes.

## License

MIT — sr.rpo
