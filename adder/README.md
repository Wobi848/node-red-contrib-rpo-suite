# node-red-contrib-rpo-adder

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-adder`.
<!-- rpo-suite-note:end -->

A Node-RED node: **Adder**

Collects numeric values from named topics and outputs their sum or weighted average.

## Install

```bash
npm install node-red-contrib-rpo-adder
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Value for the slot identified by `msg.topic`

## Outputs

- **Output 1**: Sum or weighted average; `msg.values` contains per-topic values

## Configuration

| Parameter | Description |
|-----------|-------------|
| Topics / weights | Comma-separated list of `topic:weight` pairs |
| Mode | Sum or weighted average |
| Min. required topics | Minimum topics with values before outputting |

## License

MIT
