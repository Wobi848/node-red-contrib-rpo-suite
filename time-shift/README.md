# node-red-contrib-time-shift

Time shift node — outputs a delayed version of the input signal. Buffers incoming values and returns the value from the configured delay time ago. Useful for comparing current vs. past values or detecting trends.

## Install

```bash
npm install node-red-contrib-time-shift
```

## Usage

Send a numeric value as `msg.payload`. The node buffers values and outputs the one closest to `delay` seconds ago.

| msg | Effect |
|-----|--------|
| `msg.payload = 21.5` | Current value to buffer and delay |
| `msg.delay = 300` | Override delay at runtime (in configured unit) |
| `msg.reset = true` | Clear the buffer |

Output is suppressed until the buffer has accumulated enough data to cover the configured delay.

## Output

`msg.payload` = delayed value.

```json
{
  "timeShift": {
    "current": 21.5,
    "delayed": 19.8,
    "delay": 300,
    "actualDelay": 299.8,
    "bufferSize": 12
  }
}
```

## License

MIT — sr.rpo
