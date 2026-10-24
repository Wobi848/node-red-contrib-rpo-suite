# node-red-contrib-rpo-debounce

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-rpo-debounce`.
<!-- rpo-suite-note:end -->

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
