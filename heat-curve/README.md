# node-red-contrib-heat-curve

Node-RED Heating Curve Node - calculates flow temperature setpoint based on outdoor temperature (Heizkurve).

## Features

- Configurable heating curve with slope or design mode
- Night setback (Nachtabsenkung)
- Summer lockout (Sommerabschaltung)
- Two outputs: Flow temp + Heating active boolean
- Min/max flow temperature limits
- Runtime overrides via message properties

## Formula

```
flowTemp = roomTemp + slope × (roomTemp - outdoorTemp) + shift

With setback: flowTemp = flowTemp - setbackDelta
```

## Outputs

- **Output 1**: Flow temperature setpoint (°C) or `null` if summer lockout
- **Output 2**: Heating active boolean (`true` = heating, `false` = summer lockout)

## Example

```
slope=1.0, roomTemp=20, shift=0:

Outdoor -10°C → Flow 50°C
Outdoor   0°C → Flow 40°C
Outdoor  10°C → Flow 30°C

With setback (delta=10K):
Outdoor -10°C → Flow 40°C (50-10)

Summer lockout (threshold=18°C):
Outdoor 20°C → Output 1: null, Output 2: false
```

## Configuration

| Property | Description | Default | Range |
|----------|-------------|---------|-------|
| Mode | Slope or Design | slope | - |
| Slope | Curve steepness | 1.0 | 0.2–3.0 |
| Design Outdoor | Design outdoor temp | -15 | - |
| Design Flow | Design flow temp | 55 | - |
| Room Temp | Room setpoint | 20 | - |
| Shift | Parallel shift (Niveau) | 0 | -15 to +15 |
| Min Flow | Minimum flow temp | 20 | - |
| Max Flow | Maximum flow temp | 75 | - |
| Setback Delta | Night setback reduction | 10 | 0–30 K |
| Summer Lockout | Lockout threshold | 18 | - |
| Decimals | Decimal places | 1 | 0–2 |

## Input

- `msg.payload` - Outdoor temperature in °C
- `msg.setback` - `true` to activate night setback

### Runtime Override

All configuration values can be overridden via msg properties. Setback state is retained until explicitly changed.

| Property | Description |
|----------|-------------|
| `msg.setback` | Activate night setback (sticky) |
| `msg.setbackDelta` | Override setback delta |
| `msg.summerLockout` | Override summer lockout threshold |
| `msg.slope` | Override slope |
| `msg.designOutdoor` | Override design outdoor temp |
| `msg.designFlow` | Override design flow temp |
| `msg.roomTemp` | Override room setpoint |
| `msg.shift` | Override shift |
| `msg.minFlow` | Override min flow temp |
| `msg.maxFlow` | Override max flow temp |

## Output

**Output 1:**
```json
{
  "payload": 50.0,
  "heatCurve": {
    "outdoorTemp": -10,
    "flowTemp": 50.0,
    "slope": 1.0,
    "roomTemp": 20,
    "shift": 0,
    "minFlow": 20,
    "maxFlow": 75,
    "clamped": false,
    "clampedAt": null,
    "setback": false,
    "setbackDelta": 10,
    "flowTempBeforeSetback": 50.0,
    "summerLockout": 18,
    "heatingActive": true
  }
}
```

**Output 2:**
```json
{
  "payload": true
}
```

## Node Status

- **-10°C → 50.0°C** - Normal heating
- **-10°C → 40.0°C (setback)** - Night setback active
- **20°C → locked out** - Summer lockout
- **-20°C → 75.0°C (clamped max)** - Clamped to limit

## Use Cases

| Application | Description |
|-------------|-------------|
| HVAC | Heating system control |
| Building Automation | Weather-compensated heating |
| Heat Pump | Flow temperature optimization |
| Night Mode | Reduced heating at night |

## Author

sr.rpo

## License

MIT
