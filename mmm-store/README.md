# node-red-contrib-rpo-mmm-store

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-mmm-store`.
<!-- rpo-suite-note:end -->

A Node-RED node: **Min/Max/Mean Store**

Maintains running minimum, maximum, and mean statistics over a sliding window of numeric values.

## Install

```bash
npm install node-red-contrib-rpo-mmm-store
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Value to add to statistics
- **msg.reset=true**: Clear statistics

## Outputs

- **Output 1**: Current mean; `msg.stats = { min, max, mean, count }`

## Configuration

| Parameter | Description |
|-----------|-------------|
| Window size | Number of samples to keep (0 = unlimited) |

## License

MIT
