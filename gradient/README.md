# node-red-contrib-rpo-gradient

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (64 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-gradient`.
<!-- rpo-suite-note:end -->

A Node-RED node: **Gradient**

Calculates the rate of change (gradient) between consecutive numeric values using the actual elapsed time.

## Install

```bash
npm install node-red-contrib-rpo-gradient
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Numeric sample value
- **msg.reset=true**: Reset state

## Outputs

- **Output 1**: Smoothed gradient; `msg.gradient = { current, previous, gradient, unit, dt, smoothed, alarm, alarmRate }`

## Configuration

| Parameter | Description |
|-----------|-------------|
| Output unit | /s, /min, or /h |
| Smoothing | Moving average window (samples) |
| Decimal places | Rounding |
| Alarm rate | Trigger alarm above this rate (0 = off) |

## License

MIT
