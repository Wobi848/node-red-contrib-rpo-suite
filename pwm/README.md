# node-red-contrib-rpo-pwm

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
