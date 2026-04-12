# node-red-contrib-arithmetic

A Node-RED node that performs arithmetic operations (+, -, x, /, %, ^) on two numeric inputs.

## Installation

```bash
npm install node-red-contrib-arithmetic
```

## Inputs

- **payload** `number`: Value for A or B (identified by msg.topic).
- **topic** `string`: Set to Topic A or Topic B name.
- **operator** _(optional)_ `string`: Override operator: + - x / % ^
- **reset** _(optional)_ `boolean`: Clear stored A and B values.

## Outputs

- **payload** `number`: Result rounded to configured decimal places.
- **arithmetic** `object`: { a, b, operator, result, decimals }

## Configuration

- **Topic A/B**: msg.topic identifiers (default: a / b).
- **Operator**: Arithmetic operator (default: +).
- **Decimal Places**: Output precision 0-10 (default: 2).

## Tips

- Division and modulo by zero are blocked with a warning - no output sent.
- Output fires when both A and B are known.

## License

MIT (c) sr.rpo
