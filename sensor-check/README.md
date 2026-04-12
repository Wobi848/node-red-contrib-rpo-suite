# node-red-contrib-sensor-check

A Node-RED sensor plausibility monitor. Detects out-of-range values and communication timeouts, then outputs a fallback value and alarm signal.

## Installation

```bash
npm install node-red-contrib-sensor-check
```

## Inputs

- **payload** `number`: Current sensor value to check.
- **acknowledge** _(optional)_ `boolean`: Acknowledge and reset the fault state.

## Outputs

- **Output 1 payload** `number`: Original value when OK, fallback value when fault.
- **Output 2 payload** `boolean`: true = fault, false = OK. Includes msg.sensorCheck details.

## Configuration

- **Min / Max**: Plausibility range - values outside trigger a fault.
- **Fallback**: Value sent on Output 1 during a fault.
- **Use Fallback**: If unchecked, Output 1 is null during faults.
- **Timeout**: Seconds without a message before timeout fault. 0 = disabled.
- **Hysteresis**: Band applied when leaving fault state to prevent flickering.

## Tips

- faultType in msg.sensorCheck: "outOfRange" or "timeout".
- Use msg.acknowledge = true to reset after intervention.
- Combine Output 2 with notification nodes for alerting.

## License

MIT (c) sr.rpo
