# node-red-contrib-rpo-suite

One-line install for the complete sr.rpo building automation node suite for Node-RED.

**v1.4.10** — bundles 63 nodes across 8 palette categories.

## Installation

```bash
npm install node-red-contrib-rpo-suite
```

Or via Node-RED Palette Manager: Search for `rpo-suite`

## Palette Categories

- `rpo-control` — Control & Regulation (10)
- `rpo-logic` — Logic & Boolean (10)
- `rpo-math` — Math & Numeric (10)
- `rpo-time` — Time & Signal (13)
- `rpo-hvac` — HVAC & Building (10)
- `rpo-sensor` — Sensors & Physics (4)
- `rpo-flow` — Flow Control (5)
- `rpo-misc` — Miscellaneous (1)

## Included Nodes (63)

### Control & Regulation `rpo-control`

Feedback control, temperature regulation, and closed-loop algorithms.

| Folder | Package | Description |
|--------|---------|-------------|
| pid-controller | [node-red-contrib-pid-controller-isa](https://www.npmjs.com/package/node-red-contrib-pid-controller-isa) | Industrial-grade PID controller using ISA standard algorithm for Node-RED |
| pt1 | [node-red-contrib-pt1](https://www.npmjs.com/package/node-red-contrib-pt1) | PT1 first-order low-pass filter for smoothing noisy measurement values |
| i-element | [node-red-contrib-i-element](https://www.npmjs.com/package/node-red-contrib-i-element) | Integral element (I-Glied) with anti-windup for control systems |
| heat-curve | [node-red-contrib-heat-curve](https://www.npmjs.com/package/node-red-contrib-heat-curve) | Node-RED heating curve node - calculates flow temperature setpoint based on outdoor temperature |
| thermal-valve | [node-red-contrib-thermal-valve](https://www.npmjs.com/package/node-red-contrib-thermal-valve) | PWM controller for thermal actuator valves - converts 0-100% to timed on/off signal |
| three-point | [node-red-contrib-three-point](https://www.npmjs.com/package/node-red-contrib-three-point) | Three-point actuator controller for HVAC dampers and valves |
| adaptive-curve | [node-red-contrib-adaptive-curve](https://www.npmjs.com/package/node-red-contrib-adaptive-curve) | Self-learning heating curve with room temperature feedback |
| optimization | [node-red-contrib-optimization](https://www.npmjs.com/package/node-red-contrib-optimization) | Optimal start time calculator for heating/cooling systems |
| setpoint-shift | [node-red-contrib-setpoint-shift](https://www.npmjs.com/package/node-red-contrib-setpoint-shift) | Sliding setpoint / heating curve based on outdoor temperature for HVAC systems |
| predictive-heating | [node-red-contrib-predictive-heating](https://www.npmjs.com/package/node-red-contrib-predictive-heating) | Predictive outdoor temperature for heating curve control using weather forecast and solar UV correction |

### Logic & Boolean `rpo-logic`

Boolean logic, latches, edge detection, and state comparison.

| Folder | Package | Description |
|--------|---------|-------------|
| sr-latch | [node-red-contrib-sr-latch](https://www.npmjs.com/package/node-red-contrib-sr-latch) | Node-RED SR Latch (Set-Reset Flip-Flop) - memory element with set/reset control |
| pulse-edge | [node-red-contrib-pulse-edge](https://www.npmjs.com/package/node-red-contrib-pulse-edge) | Node-RED node for edge detection - outputs pulse on rising/falling edge |
| ton-toff | [node-red-contrib-ton-toff](https://www.npmjs.com/package/node-red-contrib-ton-toff) | Node-RED TON/TOFF timer - On-Delay and Off-Delay timer functions |
| toggle | [node-red-contrib-rpo-toggle](https://www.npmjs.com/package/node-red-contrib-rpo-toggle) | Toggle flip-flop - converts push button to switch (boolean output on every truthy input) |
| change-detect | [node-red-contrib-rpo-change-detect](https://www.npmjs.com/package/node-red-contrib-rpo-change-detect) | Forwards messages only when the value has changed (supports tolerance for numbers) |
| edge-filter | [node-red-contrib-edge-filter](https://www.npmjs.com/package/node-red-contrib-edge-filter) | Edge filter - forwards only first event in a time window (re-trigger protection) |
| logic-combiner | [node-red-contrib-logic-combiner](https://www.npmjs.com/package/node-red-contrib-logic-combiner) | Node-RED logic combiner - combines multiple boolean inputs with AND/OR |
| hysteresis | [node-red-contrib-threshold-hysteresis](https://www.npmjs.com/package/node-red-contrib-threshold-hysteresis) | Node-RED node for hysteresis logic - outputs boolean based on high/low thresholds |
| deadband | [node-red-contrib-deadband](https://www.npmjs.com/package/node-red-contrib-deadband) | Node-RED deadband filter - only passes values when change exceeds threshold |
| comparator | [node-red-contrib-comparator](https://www.npmjs.com/package/node-red-contrib-comparator) | Compares two numeric values with configurable operator and outputs boolean result |

### Math & Numeric `rpo-math`

Arithmetic, formulas, scaling, clamping, and statistical calculations.

| Folder | Package | Description |
|--------|---------|-------------|
| arithmetic | [node-red-contrib-arithmetic](https://www.npmjs.com/package/node-red-contrib-arithmetic) | Performs arithmetic operations (+,-,Ã—,Ã·,%,^) on two numeric inputs |
| formula | [node-red-contrib-rpo-formula](https://www.npmjs.com/package/node-red-contrib-rpo-formula) | Node-RED formula evaluator - evaluate math expressions with named topic variables |
| adder | [node-red-contrib-adder](https://www.npmjs.com/package/node-red-contrib-adder) | Multi-input adder with optional weighting - sum or weighted average of inputs |
| scale | [node-red-contrib-scale](https://www.npmjs.com/package/node-red-contrib-scale) | Node-RED scale node - maps values from one range to another using linear interpolation |
| clamp | [node-red-contrib-clamp](https://www.npmjs.com/package/node-red-contrib-clamp) | Node-RED clamp node - limits values to a min/max range |
| difference | [node-red-contrib-difference](https://www.npmjs.com/package/node-red-contrib-difference) | Node-RED difference calculator - calculates the difference between two numeric inputs |
| gradient | [node-red-contrib-gradient](https://www.npmjs.com/package/node-red-contrib-gradient) | Gradient calculator - computes rate of change of numeric values over time |
| int-bits | [node-red-contrib-int-bits](https://www.npmjs.com/package/node-red-contrib-int-bits) | Integer to bits converter - bidirectional integer and boolean array conversion |
| average | [node-red-contrib-avg](https://www.npmjs.com/package/node-red-contrib-avg) | Node-RED average node - calculates moving average over count or time window |
| multi-stat | [node-red-contrib-multi-stat](https://www.npmjs.com/package/node-red-contrib-multi-stat) | Node-RED multi-source statistics - calculates min/max/avg across multiple topics |

### Time & Signal `rpo-time`

Timers, counters, rate limiting, signal generation, and scheduling.

| Folder | Package | Description |
|--------|---------|-------------|
| counter | [node-red-contrib-rpo-counter](https://www.npmjs.com/package/node-red-contrib-rpo-counter) | Up/down counter with configurable limits, step, wrap and alarm modes |
| limit-counter | [node-red-contrib-limit-counter](https://www.npmjs.com/package/node-red-contrib-limit-counter) | Limit counter - counts threshold crossings and outputs alarm at configured limit |
| ring-counter | [node-red-contrib-ring-counter](https://www.npmjs.com/package/node-red-contrib-ring-counter) | Ring counter - cycles through N slots sequentially with wrap-around |
| debounce | [node-red-contrib-rpo-debounce](https://www.npmjs.com/package/node-red-contrib-rpo-debounce) | Debounce filter - waits until input is stable before forwarding message |
| rate-limiter | [node-red-contrib-rate-limiter](https://www.npmjs.com/package/node-red-contrib-rate-limiter) | Rate limiter - limits rate of change of numeric values per second/min/hour |
| signal-gen | [node-red-contrib-signal-gen](https://www.npmjs.com/package/node-red-contrib-signal-gen) | Signal generator - sine, square, sawtooth, triangle and random test waveforms |
| pwm | [node-red-contrib-pwm](https://www.npmjs.com/package/node-red-contrib-pwm) | PWM generator - converts 0-100% analog value to digital pulse-width signal |
| min-on-time | [node-red-contrib-min-on-time](https://www.npmjs.com/package/node-red-contrib-min-on-time) | Minimum ON time - ensures output stays ON for a minimum duration |
| min-off-time | [node-red-contrib-min-off-time](https://www.npmjs.com/package/node-red-contrib-min-off-time) | Minimum OFF time - anti-short-cycle protection for compressors and motors |
| operating-hours | [node-red-contrib-operating-hours](https://www.npmjs.com/package/node-red-contrib-operating-hours) | Operating hours counter with maintenance alarm for Node-RED |
| watchdog | [node-red-contrib-rpo-watchdog](https://www.npmjs.com/package/node-red-contrib-rpo-watchdog) | Watchdog timer - triggers alarm when no message received within timeout |
| time-shift | [node-red-contrib-time-shift](https://www.npmjs.com/package/node-red-contrib-time-shift) | Signal time delay / buffer for Node-RED |
| weekly-schedule | [node-red-contrib-weekly-schedule](https://www.npmjs.com/package/node-red-contrib-weekly-schedule) | Weekly scheduler with configurable time windows per day of week |

### HVAC & Building `rpo-hvac`

Domain-specific nodes for heating, cooling, and building operation modes.

| Folder | Package | Description |
|--------|---------|-------------|
| heat-quantity | [node-red-contrib-heat-quantity](https://www.npmjs.com/package/node-red-contrib-heat-quantity) | Thermal energy calculator - power and accumulated kWh |
| degree-days | [node-red-contrib-degree-days](https://www.npmjs.com/package/node-red-contrib-degree-days) | Heating degree days calculator according to SIA 2028 |
| frost-protection | [node-red-contrib-frost-protection](https://www.npmjs.com/package/node-red-contrib-frost-protection) | Frost protection controller for HVAC systems |
| free-cooling | [node-red-contrib-free-cooling](https://www.npmjs.com/package/node-red-contrib-free-cooling) | Free cooling / night cooling recommendation for HVAC systems |
| co2-controller | [node-red-contrib-co2-controller](https://www.npmjs.com/package/node-red-contrib-co2-controller) | CO2-based ventilation controller for HVAC systems (SIA 382.1 / EN 13779) |
| standby | [node-red-contrib-standby](https://www.npmjs.com/package/node-red-contrib-standby) | Operating mode manager: Comfort / Standby / Frost for HVAC |
| idle-mode | [node-red-contrib-idle-mode](https://www.npmjs.com/package/node-red-contrib-idle-mode) | Periodic exercise runner for idle pumps and valves |
| priority | [node-red-contrib-priority](https://www.npmjs.com/package/node-red-contrib-priority) | Priority-based input selector for DDC control (Hand/Remote/Auto) |
| sequencer | [node-red-contrib-rpo-sequencer](https://www.npmjs.com/package/node-red-contrib-rpo-sequencer) | Sequential channel switching with wear leveling for HVAC |
| startup | [node-red-contrib-startup](https://www.npmjs.com/package/node-red-contrib-startup) | Startup sequence with ramp-up and pre/post-run for pumps and fans |

### Sensors & Physics `rpo-sensor`

Psychrometric calculations and sensor-value validation.

| Folder | Package | Description |
|--------|---------|-------------|
| abs-humidity | [node-red-contrib-abs-humidity](https://www.npmjs.com/package/node-red-contrib-abs-humidity) | Absolute humidity calculator using Magnus formula |
| dewpoint | [node-red-contrib-dewpoint](https://www.npmjs.com/package/node-red-contrib-dewpoint) | Dew point calculator with condensation alarm |
| enthalpy | [node-red-contrib-enthalpy](https://www.npmjs.com/package/node-red-contrib-enthalpy) | Specific enthalpy of moist air with heat recovery recommendation |
| sensor-check | [node-red-contrib-sensor-check](https://www.npmjs.com/package/node-red-contrib-sensor-check) | Sensor plausibility monitor - detects out-of-range values and timeout with fallback output |

### Flow Control `rpo-flow`

Routing, lookup, sorting, storage, and alarm dispatch.

| Folder | Package | Description |
|--------|---------|-------------|
| multiplexer | [node-red-contrib-multiplexer](https://www.npmjs.com/package/node-red-contrib-multiplexer) | 8-channel multiplexer - selects and forwards one of N input channels |
| lookup-table | [node-red-contrib-lookup-table](https://www.npmjs.com/package/node-red-contrib-lookup-table) | Linear interpolation lookup table for Node-RED |
| sort | [node-red-contrib-rpo-sort](https://www.npmjs.com/package/node-red-contrib-rpo-sort) | Array sorter - sorts arrays numerically or alphabetically with topN support |
| mmm-store | [node-red-contrib-mmm-store](https://www.npmjs.com/package/node-red-contrib-mmm-store) | Min/Max/Mean persistent store - tracks statistics across Node-RED restarts |
| alarm-new-val | [node-red-contrib-alarm-new-val](https://www.npmjs.com/package/node-red-contrib-alarm-new-val) | New value alarm - signals when a new or changed value is received |

### Miscellaneous `rpo-misc`

Utility nodes that don't fit other categories.

| Folder | Package | Description |
|--------|---------|-------------|
| age-calculator | [node-red-contrib-age-calculator](https://www.npmjs.com/package/node-red-contrib-age-calculator) | Node-RED node to calculate age/time alive from a birth date |


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
