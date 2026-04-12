# node-red-contrib-rpo-alarm-new-val

A Node-RED node: **Alarm New Value**

Passes values through and emits a timed pulse on a second output whenever a new (or changed) value arrives.

## Install

```bash
npm install node-red-contrib-rpo-alarm-new-val
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload**: Any value

## Outputs

- **Output 1**: Passed-through input value
- **Output 2**: `true` on new value, then `false` after pulse duration

## Configuration

| Parameter | Description |
|-----------|-------------|
| Trigger mode | Always trigger or only on change |
| Pulse duration (ms) | How long Output 2 stays true |

## License

MIT
