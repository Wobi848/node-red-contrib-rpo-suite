# node-red-contrib-pt1

A Node-RED PT1 first-order low-pass filter for smoothing noisy measurement values.

Formula: y(t) = y(t-1) + (dt / (T1 + dt)) * (x(t) - y(t-1))

## Installation

```bash
npm install node-red-contrib-pt1
```

## Inputs

- **payload** `number`: Raw measurement value to filter.
- **T1** _(optional)_ `number`: Override T1 in seconds for this message only.
- **reset** _(optional)_ `boolean`: Reset filter state; next input passes through directly.

## Outputs

- **payload** `number`: Filtered (smoothed) value.
- **pt1** `object`: { input, output, T1, dt, decimals, initialized }

## Configuration

- **Time Constant T1**: Smoothing constant with unit s/min/h. Larger = more smoothing, slower response.
- **Decimal Places**: Output precision 0-4 (default: 2).

## Tips

- First message always passes through unfiltered (initialization).
- T1 = 0 disables filtering (passthrough mode).
- Uses actual elapsed time between messages - no fixed interval required.
- Tip: use the 24h moving average as input for best predictive results.

## License

MIT (c) sr.rpo
