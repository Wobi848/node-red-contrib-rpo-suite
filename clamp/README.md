# node-red-contrib-clamp

Node-RED Clamp Node - limits values to a min/max range.

## Features

- Limits values to configured min/max range
- Values below min are clipped to min
- Values above max are clipped to max
- Runtime overrides via msg properties
- Configurable decimal places (0-10)

## Behavior

- Input < min → Output = min
- Input > max → Output = max
- Input in range → Output = input unchanged

## Examples

**min=0, max=100:**
```
Input 120  → Output 100 (clamped)
Input -5   → Output 0   (clamped)
Input 42   → Output 42  (passthrough)
```

**min=-10, max=10:**
```
Input 15   → Output 10  (clamped)
Input -15  → Output -10 (clamped)
Input 0    → Output 0   (passthrough)
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Min | Lower bound | 0 |
| Max | Upper bound | 100 |
| Decimals | Number of decimal places | 2 |

## Input

- `msg.payload` - Numeric value to clamp

### Runtime Overrides

| Property | Description |
|----------|-------------|
| `msg.min` | Override minimum |
| `msg.max` | Override maximum |

## Output

```json
{
  "payload": 100,
  "clamp": {
    "input": 120,
    "output": 100,
    "min": 0,
    "max": 100,
    "clamped": true,
    "clampedAt": "max"
  }
}
```

## Use Cases

| Application | Description |
|-------------|-------------|
| Sensor | Limit sensor readings to valid range |
| Control | Constrain output to safe limits |
| UI | Ensure slider values stay within bounds |
| Safety | Prevent out-of-range values |

## Node Status

- **42 (in range)** - Value passed through
- **100 (clamped, was 120)** - Value was clamped at max
- **0 (clamped, was -5)** - Value was clamped at min
- **Invalid range** - min >= max

## Author

sr.rpo

## License

MIT
