# node-red-contrib-rpo — Monorepo

Building automation and industrial control nodes for Node-RED by **sr.rpo**.

63 nodes organized into 8 palette categories. Each package is individually available on npm.

**Meta-package:** [node-red-contrib-rpo-suite](rpo-suite/) v1.4.10 — installs everything.

## Install Everything

```bash
npm install node-red-contrib-rpo-suite
```

## Palette Categories

In the Node-RED editor palette, nodes are grouped by category:

- `rpo-control` — Control & Regulation (10)
- `rpo-logic` — Logic & Boolean (10)
- `rpo-math` — Math & Numeric (10)
- `rpo-time` — Time & Signal (13)
- `rpo-hvac` — HVAC & Building (10)
- `rpo-sensor` — Sensors & Physics (4)
- `rpo-flow` — Flow Control (5)
- `rpo-misc` — Miscellaneous (1)

## Packages by Category

### Control & Regulation `rpo-control`

Feedback control, temperature regulation, and closed-loop algorithms.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| pid-controller | node-red-contrib-pid-controller-isa | 1.0.2 | Industrial-grade PID controller using ISA standard algorithm for Node-RED |
| pt1 | node-red-contrib-pt1 | 1.0.3 | PT1 first-order low-pass filter for smoothing noisy measurement values |
| i-element | node-red-contrib-i-element | 1.0.3 | Integral element (I-Glied) with anti-windup for control systems |
| heat-curve | node-red-contrib-heat-curve | 1.0.1 | Node-RED heating curve node - calculates flow temperature setpoint based on outdoor temperature |
| thermal-valve | node-red-contrib-thermal-valve | 1.0.3 | PWM controller for thermal actuator valves - converts 0-100% to timed on/off signal |
| three-point | node-red-contrib-three-point | 1.0.3 | Three-point actuator controller for HVAC dampers and valves |
| adaptive-curve | node-red-contrib-adaptive-curve | 1.0.3 | Self-learning heating curve with room temperature feedback |
| optimization | node-red-contrib-optimization | 1.0.3 | Optimal start time calculator for heating/cooling systems |
| setpoint-shift | node-red-contrib-setpoint-shift | 1.0.3 | Sliding setpoint / heating curve based on outdoor temperature for HVAC systems |
| predictive-heating | node-red-contrib-predictive-heating | 1.0.1 | Predictive outdoor temperature for heating curve control using weather forecast and solar UV correction |

### Logic & Boolean `rpo-logic`

Boolean logic, latches, edge detection, and state comparison.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| sr-latch | node-red-contrib-sr-latch | 1.0.2 | Node-RED SR Latch (Set-Reset Flip-Flop) - memory element with set/reset control |
| pulse-edge | node-red-contrib-pulse-edge | 1.0.2 | Node-RED node for edge detection - outputs pulse on rising/falling edge |
| ton-toff | node-red-contrib-ton-toff | 1.0.3 | Node-RED TON/TOFF timer - On-Delay and Off-Delay timer functions |
| toggle | node-red-contrib-rpo-toggle | 1.0.3 | Toggle flip-flop - converts push button to switch (boolean output on every truthy input) |
| change-detect | node-red-contrib-rpo-change-detect | 1.0.3 | Forwards messages only when the value has changed (supports tolerance for numbers) |
| edge-filter | node-red-contrib-edge-filter | 1.0.3 | Edge filter - forwards only first event in a time window (re-trigger protection) |
| logic-combiner | node-red-contrib-logic-combiner | 1.0.1 | Node-RED logic combiner - combines multiple boolean inputs with AND/OR |
| hysteresis | node-red-contrib-threshold-hysteresis | 1.0.2 | Node-RED node for hysteresis logic - outputs boolean based on high/low thresholds |
| deadband | node-red-contrib-deadband | 1.0.3 | Node-RED deadband filter - only passes values when change exceeds threshold |
| comparator | node-red-contrib-comparator | 1.0.3 | Compares two numeric values with configurable operator and outputs boolean result |

### Math & Numeric `rpo-math`

Arithmetic, formulas, scaling, clamping, and statistical calculations.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| arithmetic | node-red-contrib-arithmetic | 1.0.3 | Performs arithmetic operations (+,-,Ã—,Ã·,%,^) on two numeric inputs |
| formula | node-red-contrib-rpo-formula | 1.0.2 | Node-RED formula evaluator - evaluate math expressions with named topic variables |
| adder | node-red-contrib-adder | 1.0.3 | Multi-input adder with optional weighting - sum or weighted average of inputs |
| scale | node-red-contrib-scale | 1.0.1 | Node-RED scale node - maps values from one range to another using linear interpolation |
| clamp | node-red-contrib-clamp | 1.0.1 | Node-RED clamp node - limits values to a min/max range |
| difference | node-red-contrib-difference | 1.0.1 | Node-RED difference calculator - calculates the difference between two numeric inputs |
| gradient | node-red-contrib-gradient | 1.0.3 | Gradient calculator - computes rate of change of numeric values over time |
| int-bits | node-red-contrib-int-bits | 1.0.3 | Integer to bits converter - bidirectional integer and boolean array conversion |
| average | node-red-contrib-avg | 1.0.1 | Node-RED average node - calculates moving average over count or time window |
| multi-stat | node-red-contrib-multi-stat | 1.0.3 | Node-RED multi-source statistics - calculates min/max/avg across multiple topics |

### Time & Signal `rpo-time`

Timers, counters, rate limiting, signal generation, and scheduling.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| counter | node-red-contrib-rpo-counter | 1.0.3 | Up/down counter with configurable limits, step, wrap and alarm modes |
| limit-counter | node-red-contrib-limit-counter | 1.0.3 | Limit counter - counts threshold crossings and outputs alarm at configured limit |
| ring-counter | node-red-contrib-ring-counter | 1.0.3 | Ring counter - cycles through N slots sequentially with wrap-around |
| debounce | node-red-contrib-rpo-debounce | 1.0.3 | Debounce filter - waits until input is stable before forwarding message |
| rate-limiter | node-red-contrib-rate-limiter | 1.0.3 | Rate limiter - limits rate of change of numeric values per second/min/hour |
| signal-gen | node-red-contrib-signal-gen | 1.0.3 | Signal generator - sine, square, sawtooth, triangle and random test waveforms |
| pwm | node-red-contrib-pwm | 1.0.3 | PWM generator - converts 0-100% analog value to digital pulse-width signal |
| min-on-time | node-red-contrib-min-on-time | 1.0.2 | Minimum ON time - ensures output stays ON for a minimum duration |
| min-off-time | node-red-contrib-min-off-time | 1.0.2 | Minimum OFF time - anti-short-cycle protection for compressors and motors |
| operating-hours | node-red-contrib-operating-hours | 1.0.2 | Operating hours counter with maintenance alarm for Node-RED |
| watchdog | node-red-contrib-rpo-watchdog | 1.0.2 | Watchdog timer - triggers alarm when no message received within timeout |
| time-shift | node-red-contrib-time-shift | 1.0.3 | Signal time delay / buffer for Node-RED |
| weekly-schedule | node-red-contrib-weekly-schedule | 1.0.3 | Weekly scheduler with configurable time windows per day of week |

### HVAC & Building `rpo-hvac`

Domain-specific nodes for heating, cooling, and building operation modes.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| heat-quantity | node-red-contrib-heat-quantity | 1.0.2 | Thermal energy calculator - power and accumulated kWh |
| degree-days | node-red-contrib-degree-days | 1.0.2 | Heating degree days calculator according to SIA 2028 |
| frost-protection | node-red-contrib-frost-protection | 1.0.2 | Frost protection controller for HVAC systems |
| free-cooling | node-red-contrib-free-cooling | 1.0.3 | Free cooling / night cooling recommendation for HVAC systems |
| co2-controller | node-red-contrib-co2-controller | 1.0.3 | CO2-based ventilation controller for HVAC systems (SIA 382.1 / EN 13779) |
| standby | node-red-contrib-standby | 1.0.3 | Operating mode manager: Comfort / Standby / Frost for HVAC |
| idle-mode | node-red-contrib-idle-mode | 1.0.3 | Periodic exercise runner for idle pumps and valves |
| priority | node-red-contrib-priority | 1.0.3 | Priority-based input selector for DDC control (Hand/Remote/Auto) |
| sequencer | node-red-contrib-rpo-sequencer | 1.0.3 | Sequential channel switching with wear leveling for HVAC |
| startup | node-red-contrib-startup | 1.0.3 | Startup sequence with ramp-up and pre/post-run for pumps and fans |

### Sensors & Physics `rpo-sensor`

Psychrometric calculations and sensor-value validation.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| abs-humidity | node-red-contrib-abs-humidity | 1.0.2 | Absolute humidity calculator using Magnus formula |
| dewpoint | node-red-contrib-dewpoint | 1.0.2 | Dew point calculator with condensation alarm |
| enthalpy | node-red-contrib-enthalpy | 1.0.2 | Specific enthalpy of moist air with heat recovery recommendation |
| sensor-check | node-red-contrib-sensor-check | 1.0.3 | Sensor plausibility monitor - detects out-of-range values and timeout with fallback output |

### Flow Control `rpo-flow`

Routing, lookup, sorting, storage, and alarm dispatch.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| multiplexer | node-red-contrib-multiplexer | 1.0.3 | 8-channel multiplexer - selects and forwards one of N input channels |
| lookup-table | node-red-contrib-lookup-table | 1.0.3 | Linear interpolation lookup table for Node-RED |
| sort | node-red-contrib-rpo-sort | 1.0.3 | Array sorter - sorts arrays numerically or alphabetically with topN support |
| mmm-store | node-red-contrib-mmm-store | 1.0.3 | Min/Max/Mean persistent store - tracks statistics across Node-RED restarts |
| alarm-new-val | node-red-contrib-alarm-new-val | 1.0.3 | New value alarm - signals when a new or changed value is received |

### Miscellaneous `rpo-misc`

Utility nodes that don't fit other categories.

| Folder | Package | Version | Description |
|--------|---------|---------|-------------|
| age-calculator | node-red-contrib-age-calculator | 1.0.5 | Node-RED node to calculate age/time alive from a birth date |


## Development

Scripts in `scripts/` automate common tasks:

```bash
npm run check        # Verify README, locales, data-i18n, examples for all packages
npm run check:npm    # Compare local versions with npm registry
npm run sync         # Sync rpo-suite dependency versions with local versions
npm run readme       # Regenerate this README from categories.json
npm run apply-cats   # Apply categories.json to all node HTML files
npm test             # Run tests in every package with a test/ folder
npm run verify       # Check + test
```

`categories.json` is the single source of truth for palette grouping. Edit it, then run `npm run apply-cats && npm run readme`.

## License

MIT — sr.rpo | wobi848
