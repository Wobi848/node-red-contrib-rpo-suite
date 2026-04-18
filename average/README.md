# node-red-contrib-average

Node-RED Average Node - calculates a moving average over count or time window.

## Features

- Count mode: Average over last N messages (sliding window)
- Time mode: Average over last X seconds/minutes/hours
- Outputs min/max values from buffer
- Reset via msg.reset
- Configurable decimal places (0-10)

## Modes

### Count Mode
Average over the last N messages. New values push old values out.

```
Window = 3:
Input 10 → buffer [10]         → Output 10.0
Input 20 → buffer [10,20]      → Output 15.0
Input 30 → buffer [10,20,30]   → Output 20.0
Input 40 → buffer [20,30,40]   → Output 30.0
```

### Time Mode
Average over all values received within the time window. Old values expire automatically.

```
Window = 5 minutes:
All values from the last 5 minutes are averaged.
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Mode | "count" or "time" | count |
| Window | Number of messages or duration | 10 |
| Unit | s / min / h (time mode only) | min |
| Decimals | Number of decimal places | 2 |

## Input

- `msg.payload` - Numeric value to add to average

### Runtime Override

| Property | Description |
|----------|-------------|
| `msg.reset` | `true` = clear buffer |

## Output

```json
{
  "payload": 30.0,
  "average": {
    "input": 40,
    "output": 30.0,
    "count": 3,
    "min": 20,
    "max": 40,
    "mode": "count",
    "window": 3,
    "decimals": 2
  }
}
```

## Use Cases

| Application | Description |
|-------------|-------------|
| Sensor | Smooth noisy sensor readings |
| Energy | Average power consumption |
| Temperature | Rolling temperature average |
| Traffic | Average requests per minute |

## Node Status

- **Ø 30.00 (3 values)** - Current average (count mode)
- **Ø 18.50 (3/10)** - Buffer filling up
- **Ø 25.00 (last 5min, 12 values)** - Time mode

## Author

sr.rpo

## License

MIT
