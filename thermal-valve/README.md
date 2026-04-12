# node-red-contrib-thermal-valve

A Node-RED PWM controller for thermal actuator valves (Thermostellantrieb). Converts a 0-100% analog input to a timed ON/OFF signal.

## Installation

```bash
npm install node-red-contrib-thermal-valve
```

## Inputs

- **payload** `number`: Valve position: 0 = fully closed, 100 = fully open.
- **bypass** _(optional)_ `boolean`: Force valve ON (true) or OFF (false).
- **clearBypass** _(optional)_ `boolean`: Return to normal PWM control.

## Outputs

- **payload** `boolean`: true = valve open, false = valve closed. Fires only on state change.
- **thermalValve** `object`: { input, output, onTime, offTime, cycleTime, cyclePosition, bypass, inverted }

## Configuration

- **Cycle Time**: Full ON/OFF cycle duration (typical: 3-15 minutes for thermal valves).
- **Min ON Time**: Minimum ON time in seconds. If calculated ON time is less, valve stays closed.
- **Min OFF Time**: Minimum OFF time in seconds. If calculated OFF time is less, valve stays open.
- **Invert**: Invert output signal (useful for normally-open actuators).

## Tips

- Thermal valves typically require 3-15 minute cycle times.
- Use Min ON/OFF Time to protect valve mechanics from rapid switching.
- Output only fires on state change - not every second.

## License

MIT (c) sr.rpo
