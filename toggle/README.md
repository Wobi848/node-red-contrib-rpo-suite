# node-red-contrib-toggle

A Node-RED node that toggles a boolean output on every truthy input. Acts like a push button converting to a latching switch.

## Installation

```bash
npm install node-red-contrib-toggle
```

## Inputs

- **payload** `any`: Truthy toggles output; falsy silently ignored.
- **set** _(optional)_ `boolean`: Force output to specific value without toggling.
- **reset** _(optional)_ `boolean`: Reset to initial state.

## Outputs

- **payload** `boolean`: Current state: true or false.
- **toggle** `object`: { state, previous, toggleCount }

## Configuration

- **Initial State**: State on deploy/restart (default: OFF).
- **Persistent**: Retain state across Node-RED restarts via context filesystem store.

## Tips

- Send any truthy value (1, true, "on") to toggle.
- Use msg.set = true/false to force a specific state.
- Use msg.reset = true to return to the initial state.

## License

MIT (c) sr.rpo
