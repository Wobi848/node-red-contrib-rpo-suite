# node-red-contrib-deadband

Node-RED Deadband filter - only forwards values when the change exceeds a threshold.

## Features

- Filters small value changes (noise)
- Configurable deadband threshold
- Optional initial reference value
- Runtime override via msg
- Reset function

## Behavior

- Change >= Deadband → value is forwarded + new reference stored
- Change < Deadband → message is blocked, no output
- First value always passes through (sets reference)

## Example

**Deadband = 0.5, reference = 20.0:**
```
Input 20.3 → Δ0.3 → blocked
Input 20.6 → Δ0.6 → forwarded, new ref = 20.6
Input 20.8 → Δ0.2 → blocked
Input 21.2 → Δ0.6 → forwarded, new ref = 21.2
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Deadband | Minimum change to forward value | 0.5 |
| Initial Value | Initial reference value (optional) | - |

## Input

`msg.payload` - Numeric value to filter

### Runtime Overrides

| Property | Description |
|----------|-------------|
| `msg.deadband` | Overrides deadband temporarily |
| `msg.reset` | `true` = reset reference value |

## Output

```json
{ "payload": 20.6 }
```

The original msg object is forwarded unchanged.

## Use Cases

| Application | Deadband |
|-------------|----------|
| Temperature sensor | 0.5 |
| Analog value (0-100) | 2 |
| Power consumption (Watt) | 50 |

## Node Status

- **Idle** - Waiting for first input
- **✓ 20.6** - Value forwarded
- **✗ 20.3 (Δ0.3)** - Value blocked

## Author

sr.rpo

## License

MIT
