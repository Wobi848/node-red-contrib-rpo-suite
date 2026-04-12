# node-red-contrib-hysteresis

A Node-RED node for hysteresis (deadband) logic - prevents rapid on/off switching when values hover around a threshold.

## Features

- Simple configuration: Setpoint + Hysteresis (±)
- Two modes: **High** (ON when above) or **Low** (ON when below)
- Configurable initial state
- Real-time status display in editor
- Live threshold preview while editing

## Configuration

| Property | Description | Example |
|----------|-------------|---------|
| Setpoint | Target value | 22 |
| Hysteresis (±) | Deadband range | 1 |
| Mode | When to turn ON | High / Low |
| Initial State | Starting state | undefined |

### Mode: High (Cooling)
Use when output should be ON when temperature is **above** setpoint.

```
Setpoint: 22, Hysteresis: 1
→ ON when value ≥ 23
→ OFF when value ≤ 21
```

### Mode: Low (Heating)
Use when output should be ON when temperature is **below** setpoint.

```
Setpoint: 22, Hysteresis: 1
→ ON when value ≤ 21
→ OFF when value ≥ 23
```

## How It Works

```
         OFF zone          Deadband           ON zone
      ◄────────────►  ◄──────────────►  ◄────────────►
                     │                │
  ────────────────── 21 ════════════ 23 ──────────────
                     │   (no change)  │
               Low Threshold    High Threshold
                 (22 - 1)         (22 + 1)
```

## Usage

### Input
- `msg.payload` - Numeric value (temperature, pressure, humidity, etc.)

### Output
- `msg.payload` - Boolean (`true` or `false`)
- `msg.value` - The input value
- `msg.previousState` - State before evaluation
- `msg.setpoint` - Configured setpoint
- `msg.hysteresis` - Configured hysteresis
- `msg.mode` - Configured mode

### Example Output
```json
{
  "payload": true,
  "value": 24.5,
  "previousState": false,
  "setpoint": 22,
  "hysteresis": 1,
  "mode": "high"
}
```

## Example Sequences

### Cooling (Mode: High)
| Input | Output | Reason |
|-------|--------|--------|
| 20 | OFF | Below 21 |
| 22 | OFF | Between thresholds, stays OFF |
| 24 | ON | Above 23 |
| 22 | ON | Between thresholds, stays ON |
| 20 | OFF | Below 21 |

### Heating (Mode: Low)
| Input | Output | Reason |
|-------|--------|--------|
| 24 | OFF | Above 23 |
| 22 | OFF | Between thresholds, stays OFF |
| 20 | ON | Below 21 |
| 22 | ON | Between thresholds, stays ON |
| 24 | OFF | Above 23 |

## Use Cases

- **HVAC Control**: Prevent heating/cooling from toggling rapidly
- **Pump Control**: Avoid frequent pump starts when water level fluctuates
- **Alarm Systems**: Reduce false alarms from sensor noise
- **Fan Control**: Smooth fan on/off behavior based on temperature

## Author

sr.rpo

## License

MIT
