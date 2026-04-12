# node-red-contrib-rpo-edge-filter

A Node-RED node: **Edge Filter**

Passes the first message in a time window and blocks all subsequent messages until the window expires.

## Install

```bash
npm install node-red-contrib-rpo-edge-filter
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload**: Any value
- **msg.reset=true**: Reset the filter immediately

## Outputs

- **Output 1**: First value within the time window

## Configuration

| Parameter | Description |
|-----------|-------------|
| Window size | Duration of the blocking window |
| Window unit | ms, s, or min |
| Filter mode | Time window or on-change |

## License

MIT
