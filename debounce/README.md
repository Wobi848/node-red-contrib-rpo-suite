# node-red-contrib-rpo-debounce

A Node-RED node: **Debounce**

Debounces rapid message bursts. Supports trailing edge, leading edge, and both-edges modes.

## Install

```bash
npm install node-red-contrib-rpo-debounce
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload**: Any value to debounce
- **msg.flush=true**: Immediately forward pending message
- **msg.debounceTime**: Override debounce time (ms)

## Outputs

- **Output 1**: Debounced value

## Configuration

| Parameter | Description |
|-----------|-------------|
| Debounce time (ms) | Wait period |
| Mode | trailing, leading, or both |

## License

MIT
