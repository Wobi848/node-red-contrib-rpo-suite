# node-red-contrib-sr-latch

A Node-RED SR Latch (Set-Reset Flip-Flop) node - a memory element that holds its state until set or reset.

## Features

- Set state to ON (true)
- Reset state to OFF (false)
- Toggle between states
- Multiple input formats supported
- Topic takes priority over payload
- Configurable output mode (on change only / always)
- Configurable initial state

## How It Works

```
SET    ──┐     ┌── RESET
         │     │
State: ──┴─────┴──────────────
         ON    OFF

The latch remembers its state until changed.
```

## Configuration

| Property | Description | Options |
|----------|-------------|---------|
| Initial State | State when Node-RED starts | SET (ON) / RESET (OFF) |
| Output Mode | When to send output | On state change only / On every input |

## Usage

### Input

The node accepts multiple input formats:

**Via `msg.topic`** (takes priority):
- `set` or `s` - Set to ON
- `reset` or `r` - Reset to OFF
- `toggle` or `t` - Toggle state

**Via `msg.payload`**:
- Boolean: `true` = SET, `false` = RESET
- Number: `1` = SET, `0` = RESET
- String: `"set"`, `"s"`, `"on"`, `"true"`, `"1"` = SET
- String: `"reset"`, `"r"`, `"off"`, `"false"`, `"0"` = RESET
- String: `"toggle"`, `"t"` = TOGGLE

### Output

```json
{
  "payload": true,
  "action": "set",
  "previousState": false
}
```

| Property | Description |
|----------|-------------|
| `payload` | Current state: `true` (ON) or `false` (OFF) |
| `action` | Action performed: `"set"`, `"reset"`, or `"toggle"` |
| `previousState` | State before the action |

## Examples

### Basic Set/Reset
```
Input: {topic: "set"}   → Output: {payload: true, action: "set"}
Input: {topic: "set"}   → (no output - already set, no change)
Input: {topic: "reset"} → Output: {payload: false, action: "reset"}
```

### Using Boolean Payload
```
Input: {payload: true}  → SET (ON)
Input: {payload: false} → RESET (OFF)
```

### Toggle Mode
```
State: OFF
Input: {topic: "toggle"} → Output: {payload: true} (now ON)
Input: {topic: "toggle"} → Output: {payload: false} (now OFF)
Input: {topic: "toggle"} → Output: {payload: true} (now ON)
```

### Topic Priority
```
Input: {topic: "set", payload: false}
→ Output: {payload: true} (topic wins!)
```

## Use Cases

- **Manual Override**: Latch a manual mode flag until reset
- **Alarm Acknowledgment**: Latch alarm state until operator acknowledges
- **Mode Selection**: Toggle between operating modes
- **Start/Stop Control**: Control a process with set/reset signals
- **Memory Element**: Remember a state across flow executions

## Node Status

Shows current state in the editor:
- `SET (ON)` - Green dot, state is true
- `RESET (OFF)` - Blue dot, state is false

## Author

sr.rpo

## License

MIT
