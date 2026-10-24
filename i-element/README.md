# node-red-contrib-i-element

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (64 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-i-element`.
<!-- rpo-suite-note:end -->

Integral element (I-Glied) with anti-windup for control systems. Integrates an input signal over time with configurable integration time Ti and output clamping.

## Install

```bash
npm install node-red-contrib-i-element
```

## Usage

Send a numeric value as `msg.payload`. The node integrates `x * dt / Ti` on each call.

| msg | Effect |
|-----|--------|
| `msg.payload = 5` | Input value to integrate |
| `msg.reset = true` | Reset integral to 0 |
| `msg.set = 50` | Set integral to specific value |
| `msg.Ti = 120` | Override integration time at runtime (in configured unit) |

## Output

`msg.payload` = current integral value (clamped to outMin/outMax).

```json
{
  "iElement": {
    "input": 5,
    "integral": 42.3,
    "Ti": 60,
    "dt": 30.1,
    "clamped": false,
    "clampedAt": null
  }
}
```

## License

MIT — sr.rpo
