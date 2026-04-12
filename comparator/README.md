# node-red-contrib-comparator

A Node-RED node that compares two numeric values identified by msg.topic and outputs a boolean result.

## Installation

```bash
npm install node-red-contrib-comparator
```

## Inputs

- **payload** `number`: Value for input A or B (identified by msg.topic).
- **topic** `string`: Set to Topic A or Topic B name.
- **operator** _(optional)_ `string`: Override operator: > < >= <= == !=
- **reset** _(optional)_ `boolean`: Clear stored A and B values.

## Outputs

- **payload** `boolean`: Comparison result.
- **comparator** `object`: { a, b, operator, result, tolerance }

## Configuration

- **Topic A/B**: msg.topic identifiers (default: a / b).
- **Operator**: Comparison operator (default: >).
- **Tolerance**: Dead band for == and != comparisons (default: 0.01).

## Tips

- Output fires when both A and B are known.
- Tolerance applies only to == and != operators.

## License

MIT (c) sr.rpo
