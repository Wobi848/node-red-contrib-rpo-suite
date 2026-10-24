# node-red-contrib-rpo-limit-counter

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-limit-counter`.
<!-- rpo-suite-note:end -->

A Node-RED node: **Limit Counter**

Counts rising-edge crossings of a threshold (with hysteresis) and triggers an alarm when a configurable count is reached.

## Install

```bash
npm install node-red-contrib-rpo-limit-counter
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Value to compare against threshold
- **msg.reset=true**: Reset counter

## Outputs

- **Output 1**: Current crossing count
- **Output 2**: `true` when alarm count reached, `false` otherwise

## Configuration

| Parameter | Description |
|-----------|-------------|
| Threshold | Crossing trigger level |
| Hysteresis | Dead-band to prevent chatter |
| Alarm count | Count at which alarm fires |

## License

MIT
