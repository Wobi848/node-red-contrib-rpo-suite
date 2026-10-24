# node-red-contrib-rpo-edge-filter

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-edge-filter`.
<!-- rpo-suite-note:end -->

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
