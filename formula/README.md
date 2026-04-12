# node-red-contrib-rpo-formula

A Node-RED node that evaluates math formulas with named topic variables.

## Install

```bash
npm install node-red-contrib-rpo-formula
```

## How it works

Write any math formula using variable names. Each variable is set by sending a message where `msg.topic` is the variable name and `msg.payload` is the number. When enough variables are available, the formula is evaluated and the result sent.

## Examples

| Formula | Variables | Result |
|---------|-----------|--------|
| `a + b` | a=10, b=20 | 30 |
| `a * 1.5 + 100` | a=20 | 130 |
| `a^2 + b^2` | a=3, b=4 | 25 |
| `sqrt(a^2 + b^2)` | a=3, b=4 | 5 |
| `r^2 * pi` | r=2 | 12.5664 |
| `(a + b + c) / 3` | a=10, b=20, c=30 | 20 |
| `a * 1.5 - b / (c + 1)` | a, b, c | — |

## Inputs

- **payload** (number): Value for the variable named by `msg.topic`
- **topic** (string): Variable name — must match a name used in the formula
- **reset** (boolean): Clear all stored variable values

## Outputs

- **payload** (number): Result of the formula
- **msg.formula**: `{ formula, variables, result, decimals }`

## Configuration

| Parameter | Description |
|-----------|-------------|
| Formula | Math expression — letters are variables, numbers are constants |
| Min. variables | How many variables must be set before evaluating (0 = all) |
| Decimal places | Result rounding |

## Available math functions

`sin` `cos` `tan` `asin` `acos` `atan` `abs` `sqrt` `cbrt` `pow` `exp` `log` `log2` `log10` `floor` `ceil` `round` `min` `max` `sign`

Constants: `pi` `e`

## License

MIT
