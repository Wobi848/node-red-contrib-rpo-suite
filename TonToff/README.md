# node-red-contrib-ton-toff

Node-RED timer node with configurable on-delay and off-delay (TON/TOFF).

## Features

- Configurable on-delay (TON)
- Configurable off-delay (TOFF)
- Delay units: ms / s / min
- Live countdown in node status
- Extended truthy/falsy evaluation

## Behavior

- Input becomes truthy → waits **onDelay** → Output true
- Input becomes falsy → waits **offDelay** → Output false
- Input changes while timer is running → cancel timer, start new timer
- Same input while timer is running → timer continues (no reset)
- Delay = 0 → immediate reaction (no timer)

## Examples

**onDelay=1s, offDelay=1s:**
```
Input 1 → waits 1s → Output true
Input 0 → waits 1s → Output false
```

**onDelay=2s, offDelay=0s:**
```
Input 1 → waits 2s → Output true
Input 0 → immediately → Output false
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| On Delay | Turn-on delay | 1 |
| Off Delay | Turn-off delay | 1 |
| Unit | ms / s / min (for both) | s |

## Input

`msg.payload` - Any value, evaluated as truthy/falsy:

**Falsy (= OFF):**
`false`, `0`, `""`, `null`, `undefined`, `NaN`, `"false"`, `"0"`, `"off"`

**Truthy (= ON):**
Everything else: `true`, `1`, `"on"`, `"hello"`, `42`, etc.

### Runtime Overrides

| Property | Description |
|----------|-------------|
| `msg.onDelay` | Overrides onDelay temporarily (in configured unit) |
| `msg.offDelay` | Overrides offDelay temporarily (in configured unit) |
| `msg.bypassOn` | `true` = immediate ON without delay |
| `msg.bypassOff` | `true` = immediate OFF without delay |

## Output

```json
{ "payload": true }
```

The original msg object is forwarded, only `payload` is overwritten.

## Use Cases

| Application | onDelay | offDelay |
|-------------|---------|----------|
| Motion detector | 0 | 30s |
| Debounce | 500ms | 0 |
| Soft start/stop | 2s | 5s |

## Node Status

- **Idle** - Waiting for first input
- **ON in 5s...** - On-delay running
- **OFF in 3s...** - Off-delay running
- **ON** - Output is true
- **OFF** - Output is false

## Author

sr.rpo

## License

MIT
