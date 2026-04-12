# node-red-contrib-scale

Node-RED Scale Node - maps values from one range to another using linear interpolation.

## Features

- Linear mapping from input range to output range
- Works with inverted ranges (e.g. 100→0)
- Optional clamping to output range
- Runtime overrides via msg properties
- Configurable decimal places (0-10)

## Formula

```
output = (input - inMin) / (inMax - inMin) * (outMax - outMin) + outMin
```

## Examples

**0-10 → 0-100:**
```
Input 0  → Output 0
Input 5  → Output 50
Input 10 → Output 100
```

**4-20mA → 0-100%:**
```
Input 4  → Output 0
Input 12 → Output 50
Input 20 → Output 100
```

**Inverted 0-10V → 100-0%:**
```
Input 0  → Output 100
Input 5  → Output 50
Input 10 → Output 0
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Input Min | Lower bound of input range | 0 |
| Input Max | Upper bound of input range | 10 |
| Output Min | Lower bound of output range | 0 |
| Output Max | Upper bound of output range | 100 |
| Clamp | Limit output to range bounds | false |
| Decimals | Number of decimal places | 2 |

## Input

- `msg.payload` - Numeric value to scale

### Runtime Overrides

| Property | Description |
|----------|-------------|
| `msg.inMin` | Override input minimum |
| `msg.inMax` | Override input maximum |
| `msg.outMin` | Override output minimum |
| `msg.outMax` | Override output maximum |

## Output

```json
{
  "payload": 50,
  "scale": {
    "input": 12,
    "output": 50,
    "inMin": 4,
    "inMax": 20,
    "outMin": 0,
    "outMax": 100,
    "clamped": false,
    "decimals": 2
  }
}
```

## Use Cases

| Application | Description |
|-------------|-------------|
| 4-20mA | Sensor signal to percentage |
| 0-10V | Analog signal to engineering units |
| Inverted | Reverse valve position (100%=closed) |
| Temperature | Celsius to Fahrenheit |

## Node Status

- **12 → 50.00** - Scaled value
- **22 → 100.00 (clamped)** - Output was clamped
- **Invalid range** - inMin equals inMax

## Author

sr.rpo

## License

MIT
