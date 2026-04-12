# node-red-contrib-rpo-counter

A Node-RED node: **Counter**

Counts up or down with configurable step, limits, and wrap/alarm behaviour. Topic-based control for direction, reset, and set.

## Install

```bash
npm install node-red-contrib-rpo-counter
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (truthy): Trigger a count step
- **topic=reset**: Reset to initial value
- **topic=set, payload=N**: Set count to N
- **topic=up/down**: Override direction for this message
- **msg.step**: Override step size

## Outputs

- **Output 1**: Current count; `msg.counter = { count, direction, step, min, max, atLimit, limitType }`

## Configuration

| Parameter | Description |
|-----------|-------------|
| Direction | Up or down |
| Step | Count increment |
| Initial value | Starting count |
| Min / Max | Count limits |
| On limit | stop, wrap, or alarm |
| Persist | Retain count across restarts |

## License

MIT
