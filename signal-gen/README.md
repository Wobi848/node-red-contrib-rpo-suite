# node-red-contrib-rpo-signal-gen

A Node-RED node: **Signal Generator**

Generates periodic waveforms (sine, square, sawtooth, triangle, noise) at a configurable frequency and amplitude.

## Install

```bash
npm install node-red-contrib-rpo-signal-gen
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (string): `"start"`, `"stop"`, or `"reset"` to control generation

## Outputs

- **Output 1**: Current waveform sample value

## Configuration

| Parameter | Description |
|-----------|-------------|
| Waveform | sine, square, sawtooth, triangle, noise |
| Frequency (Hz) | Waveform frequency |
| Amplitude | Peak amplitude |
| Offset | DC offset |
| Interval (ms) | Output interval |
| Auto-start | Start on deploy |

## License

MIT
