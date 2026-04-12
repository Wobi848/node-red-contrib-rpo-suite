# node-red-contrib-rpo-int-bits

A Node-RED node: **Int Bits**

Converts an integer to an array of bits, or an array of bits back to an integer.

## Install

```bash
npm install node-red-contrib-rpo-int-bits
```

Or via the Node-RED Palette Manager.

## Inputs

- **payload** (number): Integer to convert to bit array
- **payload** (array): Bit array to convert to integer

## Outputs

- **Output 1**: Bit array or integer depending on input type

## Configuration

| Parameter | Description |
|-----------|-------------|
| Number of bits | How many bits to use (1–32) |
| Bit order | LSB first or MSB first |

## License

MIT
