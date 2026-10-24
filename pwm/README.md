# node-red-contrib-rpo-pwm

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-pwm`.
<!-- rpo-suite-note:end -->

A Node-RED node: **PWM**

Converts a duty cycle (0–100 %) into a PWM signal by toggling a 0/1 output at the configured frequency.

## Install

```bash
npm install node-red-contrib-rpo-pwm
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Duty cycle 0–100 %
- **msg.bypass** (boolean): If true, pass raw value through

## Outputs

- **Output 1**: 1 (ON) or 0 (OFF) according to PWM cycle

## Configuration

| Parameter | Description |
|-----------|-------------|
| Frequency (Hz) | PWM switching frequency |
| Min ON time (ms) | Minimum pulse width to avoid very short pulses |

## License

MIT
