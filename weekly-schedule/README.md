# node-red-contrib-weekly-schedule

A Node-RED weekly scheduler with configurable time windows per day. Outputs a boolean or custom value based on the current time.

## Installation

```bash
npm install node-red-contrib-weekly-schedule
```

## Inputs

- **override** _(optional)_ `boolean`: Force ON (true) or OFF (false) regardless of schedule.
- **clearOverride** _(optional)_ `boolean`: Remove override and return to schedule.

## Outputs

- **Output 1 payload** `any`: ON or OFF value on every input message.
- **Output 2 payload** `any`: ON or OFF value only on state change (checked every 10s).

## Configuration

- **Schedule**: List of day + time window entries. Add multiple per day for multiple windows.
- **ON/OFF Value**: Values to output when active/inactive (default: true / false).
- **Timezone**: Optional timezone string (default: system timezone).

## Tips

- Midnight crossing supported: set From after To (e.g. 22:00-06:00).
- Trigger Output 1 by injecting a message on Node-RED start.
- Output 2 fires automatically every 10s when state changes.

## License

MIT (c) sr.rpo
