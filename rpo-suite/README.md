# node-red-contrib-rpo-suite

One-line install for the complete sr.rpo GLT building automation node suite for Node-RED.

## Installation

```bash
npm install node-red-contrib-rpo-suite
```

Or via Node-RED Palette Manager: Search for `rpo-suite`

## Included Nodes (39)

### Classic Nodes

| Node | Package | Description |
|------|---------|-------------|
| age-calculator | [node-red-contrib-age-calculator](https://www.npmjs.com/package/node-red-contrib-age-calculator) | Calculate age/duration since a timestamp |
| hysteresis | [node-red-contrib-threshold-hysteresis](https://www.npmjs.com/package/node-red-contrib-threshold-hysteresis) | Threshold switching with hysteresis band |
| sr-latch | [node-red-contrib-sr-latch](https://www.npmjs.com/package/node-red-contrib-sr-latch) | Set-Reset latch with configurable priority |
| pulse-edge | [node-red-contrib-pulse-edge](https://www.npmjs.com/package/node-red-contrib-pulse-edge) | Edge detection and pulse generation |
| ton-toff | [node-red-contrib-ton-toff](https://www.npmjs.com/package/node-red-contrib-ton-toff) | On-delay and off-delay timers |
| deadband | [node-red-contrib-deadband](https://www.npmjs.com/package/node-red-contrib-deadband) | Filter small value changes |
| multi-stat | [node-red-contrib-multi-stat](https://www.npmjs.com/package/node-red-contrib-multi-stat) | Statistics over multiple inputs (min/max/avg/sum) |
| scale | [node-red-contrib-scale](https://www.npmjs.com/package/node-red-contrib-scale) | Linear value scaling between ranges |
| clamp | [node-red-contrib-clamp](https://www.npmjs.com/package/node-red-contrib-clamp) | Limit values to min/max range |
| average | [node-red-contrib-avg](https://www.npmjs.com/package/node-red-contrib-avg) | Moving average over count or time window |
| difference | [node-red-contrib-difference](https://www.npmjs.com/package/node-red-contrib-difference) | Calculate difference between two values |
| logic-combiner | [node-red-contrib-logic-combiner](https://www.npmjs.com/package/node-red-contrib-logic-combiner) | Combine multiple topics with AND/OR/XOR logic |
| heat-curve | [node-red-contrib-heat-curve](https://www.npmjs.com/package/node-red-contrib-heat-curve) | Heating curve calculation for HVAC systems |
| pid-controller | [node-red-contrib-pid-controller-isa](https://www.npmjs.com/package/node-red-contrib-pid-controller-isa) | Industrial-grade ISA PID with Feed-Forward & Cascade Tracking |
| predictive-heating | [node-red-contrib-predictive-heating](https://www.npmjs.com/package/node-red-contrib-predictive-heating) | Predictive heating curve with weather compensation |

### Logic & Signal Nodes

| Node | Package | Description |
|------|---------|-------------|
| toggle | [node-red-contrib-toggle](https://www.npmjs.com/package/node-red-contrib-toggle) | Flip-flop toggle with persistent state |
| comparator | [node-red-contrib-comparator](https://www.npmjs.com/package/node-red-contrib-comparator) | Compare two topic values with 6 operators |
| arithmetic | [node-red-contrib-arithmetic](https://www.npmjs.com/package/node-red-contrib-arithmetic) | Arithmetic operations on two topic values |
| change-detect | [node-red-contrib-change-detect](https://www.npmjs.com/package/node-red-contrib-change-detect) | Detect value changes with tolerance |
| pt1 | [node-red-contrib-pt1](https://www.npmjs.com/package/node-red-contrib-pt1) | First-order low-pass filter (PT1) |
| weekly-schedule | [node-red-contrib-weekly-schedule](https://www.npmjs.com/package/node-red-contrib-weekly-schedule) | Weekly time schedule with day/time slots |
| sensor-check | [node-red-contrib-sensor-check](https://www.npmjs.com/package/node-red-contrib-sensor-check) | Out-of-range and timeout fault detection |
| thermal-valve | [node-red-contrib-thermal-valve](https://www.npmjs.com/package/node-red-contrib-thermal-valve) | PWM thermal actuator valve control |

### Advanced Nodes

| Node | Package | Description |
|------|---------|-------------|
| multiplexer | [node-red-contrib-rpo-multiplexer](https://www.npmjs.com/package/node-red-contrib-rpo-multiplexer) | Route one of 8 input channels to a single output |
| pwm | [node-red-contrib-rpo-pwm](https://www.npmjs.com/package/node-red-contrib-rpo-pwm) | Convert duty cycle (0–100%) to PWM signal |
| rate-limiter | [node-red-contrib-rpo-rate-limiter](https://www.npmjs.com/package/node-red-contrib-rpo-rate-limiter) | Limit maximum rate of change per time unit |
| adder | [node-red-contrib-rpo-adder](https://www.npmjs.com/package/node-red-contrib-rpo-adder) | Sum or weighted average of named topic values |
| mmm-store | [node-red-contrib-rpo-mmm-store](https://www.npmjs.com/package/node-red-contrib-rpo-mmm-store) | Running min/max/mean statistics |
| int-bits | [node-red-contrib-rpo-int-bits](https://www.npmjs.com/package/node-red-contrib-rpo-int-bits) | Convert integer to/from bit array |
| sort | [node-red-contrib-rpo-sort](https://www.npmjs.com/package/node-red-contrib-rpo-sort) | Sort numeric or alphabetic arrays |
| signal-gen | [node-red-contrib-rpo-signal-gen](https://www.npmjs.com/package/node-red-contrib-rpo-signal-gen) | Periodic waveform generator (sine/square/sawtooth/triangle/noise) |
| limit-counter | [node-red-contrib-rpo-limit-counter](https://www.npmjs.com/package/node-red-contrib-rpo-limit-counter) | Count threshold crossings with alarm |
| ring-counter | [node-red-contrib-rpo-ring-counter](https://www.npmjs.com/package/node-red-contrib-rpo-ring-counter) | Wrap-around index counter |
| alarm-new-val | [node-red-contrib-rpo-alarm-new-val](https://www.npmjs.com/package/node-red-contrib-rpo-alarm-new-val) | Pulse output on new or changed value |
| counter | [node-red-contrib-rpo-counter](https://www.npmjs.com/package/node-red-contrib-rpo-counter) | Up/down counter with limits and wrap/alarm |
| debounce | [node-red-contrib-rpo-debounce](https://www.npmjs.com/package/node-red-contrib-rpo-debounce) | Debounce rapid messages (trailing/leading/both) |
| edge-filter | [node-red-contrib-rpo-edge-filter](https://www.npmjs.com/package/node-red-contrib-rpo-edge-filter) | Block repeated messages within a time window |
| gradient | [node-red-contrib-rpo-gradient](https://www.npmjs.com/package/node-red-contrib-rpo-gradient) | Rate of change with smoothing and alarm |
| formula | [node-red-contrib-rpo-formula](https://www.npmjs.com/package/node-red-contrib-rpo-formula) | Evaluate math formulas with named topic variables |

## Use Cases

- HVAC control systems
- Building automation (GLT)
- Industrial process control
- Sensor data processing
- PLC-style logic in Node-RED

## Author

sr.rpo

## License

MIT
