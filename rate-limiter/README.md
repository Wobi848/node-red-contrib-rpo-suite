# node-red-contrib-rpo-rate-limiter

A Node-RED node: **Rate Limiter**

Limits the maximum rate of change of a numeric value. Useful for slowly ramping setpoints or protecting actuators.

## Install

```bash
npm install node-red-contrib-rpo-rate-limiter
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Input value

## Outputs

- **Output 1**: Rate-limited numeric value

## Configuration

| Parameter | Description |
|-----------|-------------|
| Max rate | Maximum allowed change per time unit |
| Unit | /s, /min, or /h |

## License

MIT
