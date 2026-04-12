# node-red-contrib-rpo-adder

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
