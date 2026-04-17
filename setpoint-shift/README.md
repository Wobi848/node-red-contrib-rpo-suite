# node-red-contrib-setpoint-shift

Outdoor temperature compensated setpoint shift. Increases the setpoint linearly as outdoor temperature drops — used for flow temperature compensation in heating systems.

## Install

```bash
npm install node-red-contrib-setpoint-shift
```

## Usage

Send outdoor temperature as `msg.payload`.

| msg | Effect |
|-----|--------|
| `msg.payload = -5` | Outdoor temperature in °C |

The output setpoint is interpolated between `setpointBase` (at `outdoorRef`) and `setpointMax` (at `outdoorMin`). Optional `limitLow`/`limitHigh` clamp the result.

## Output

`msg.payload` = calculated setpoint.

```json
{
  "setpointShift": {
    "outdoor": -5,
    "setpoint": 52.0,
    "outdoorRef": 15,
    "outdoorMin": -10,
    "setpointBase": 20,
    "setpointMax": 70
  }
}
```

## License

MIT — sr.rpo
