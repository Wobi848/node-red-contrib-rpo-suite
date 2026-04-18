# node-red-contrib-pulse-edge

A Node-RED node for edge detection - outputs a pulse when a rising or falling edge is detected.

## Features

- Detects rising edge (false→true / 0→1)
- Detects falling edge (true→false / 1→0)
- Mode: Rising, Falling, or Both
- Accepts boolean or 0/1 number input
- Configurable initial state
- Single pulse output (no timers needed)

## How It Works

```
Signal:    LOW ──────┐         ┌────── HIGH
                     │         │
                     └─────────┘

Rising:              ↑ PULSE
Falling:                       ↑ PULSE
Both:                ↑ PULSE   ↑ PULSE
```

## Configuration

| Property | Description | Options |
|----------|-------------|---------|
| Mode | Which edge to detect | Rising / Falling / Both |
| Initial State | Assumed state before first input | undefined / true / false |

## Usage

### Input
- `msg.payload` - Boolean (`true`/`false`) or Number (`1`/`0`)

### Output (only on detected edge)
- `msg.payload` - Always `true`
- `msg.edge` - `"rising"` or `"falling"`
- `msg.previousState` - State before the edge

### Example Output
```json
{
  "payload": true,
  "edge": "rising",
  "previousState": false
}
```

## Examples

### Rising Edge Mode
```
Input: false → (sets state, no output)
Input: true  → OUTPUT {edge: "rising"}
Input: true  → (no change, no output)
Input: false → (falling ignored)
Input: true  → OUTPUT {edge: "rising"}
```

### Both Edges Mode
```
Input: 0 → (sets state, no output)
Input: 1 → OUTPUT {edge: "rising"}
Input: 0 → OUTPUT {edge: "falling"}
Input: 1 → OUTPUT {edge: "rising"}
```

## Use Cases

- **Button Press**: Detect button down (rising) or release (falling)
- **Sensor Trigger**: Single action when motion detected
- **Counter**: Count each state change
- **Signal Monitoring**: Verify signal is still changing (with watchdog)

## Node Status

Shows current state and configured mode:
- `HIGH | ↑` - State is true, rising mode
- `LOW | ↓` - State is false, falling mode
- `HIGH | ↑↓` - State is true, both edges mode

## Author

sr.rpo

## License

MIT
