# node-red-contrib-rpo-sort

A Node-RED node: **Sort**

Sorts an array payload numerically or alphabetically and optionally returns only the top N entries.

## Install

```bash
npm install node-red-contrib-rpo-sort
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (array): Array of numbers or strings to sort

## Outputs

- **Output 1**: Sorted array; `msg.originalIndices` = original index mapping

## Configuration

| Parameter | Description |
|-----------|-------------|
| Sort mode | Numeric or alphabetic |
| Order | Ascending or descending |
| Top N | Return only first N results (0 = all) |

## License

MIT
