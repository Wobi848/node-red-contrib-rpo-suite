# node-red-contrib-difference

Node-RED Difference Calculator - calculates the difference between two numeric input values.

## Features

- Calculates A - B from two input values
- Configurable topic names for inputs
- Absolute value mode (|A - B|)
- Configurable decimal places (0-10)
- Outputs detailed input info

## Behavior

- Input A identified by configurable topic (default: "a")
- Input B identified by configurable topic (default: "b")
- Result = A - B
- Output triggered on every new message once both values are known

## Example

```
topic="a", payload=24.5  → stored as A
topic="b", payload=18.2  → stored as B
Output: 24.5 - 18.2 = 6.3
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Topic A | Topic name for input A | "a" |
| Topic B | Topic name for input B | "b" |
| Absolute | Output absolute value | false |
| Decimals | Number of decimal places | 2 |

## Input

- `msg.payload` - Numeric value
- `msg.topic` - **Required** - Must match Topic A or Topic B

### Runtime Override

| Property | Description |
|----------|-------------|
| `msg.reset` | `true` = reset both values |

## Output

```json
{
  "payload": 6.3,
  "inputs": {
    "a": { "topic": "a", "value": 24.5 },
    "b": { "topic": "b", "value": 18.2 },
    "result": 6.3,
    "absolute": false
  }
}
```

## Use Cases

| Application | Description |
|-------------|-------------|
| Temperature | Difference between two sensors |
| Energy | Consumption difference between readings |
| Level | Water level difference |

## Node Status

- **a(24.5) - b(18.2) = 6.3** - Result calculated
- **Waiting for a...** - Input A missing
- **Waiting for a and b...** - Both inputs missing

## Author

sr.rpo

## License

MIT
