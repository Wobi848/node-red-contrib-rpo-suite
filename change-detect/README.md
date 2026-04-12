# node-red-contrib-change-detect

A Node-RED node that forwards messages only when the value has changed. Supports numbers, booleans, strings, and objects.

## Installation

```bash
npm install node-red-contrib-change-detect
```

## Inputs

- **payload** `any`: Value to check.
- **reset** _(optional)_ `boolean`: Clear last value; next message is always forwarded.

## Outputs

- **payload** `any`: Original value, forwarded only when changed.
- **changeDetect** `object`: { previous, current, changed, type, tolerance }

## Configuration

- **Tolerance**: Minimum numeric difference to trigger output (0 = any change).
- **Initial Value**: Optional: pre-set the last value on deploy.

## Tips

- First message is always forwarded (no previous value to compare).
- Objects and arrays are compared via deep JSON comparison.
- Tolerance only applies to numeric values.

## License

MIT (c) sr.rpo
