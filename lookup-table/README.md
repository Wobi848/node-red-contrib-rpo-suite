# node-red-contrib-lookup-table

Piecewise linear interpolation lookup table for Node-RED. Maps an input value to an output value using configurable X/Y point pairs. Values outside the defined range are clamped to the nearest endpoint.

## Install

```bash
npm install node-red-contrib-lookup-table
```

## Usage

Send a numeric value as `msg.payload`. The node interpolates between the configured points.

| msg | Effect |
|-----|--------|
| `msg.payload = 50` | Input value to look up |

## Output

`msg.payload` = interpolated output value.

```json
{
  "lookupTable": {
    "input": 50,
    "output": 60.0,
    "interpolated": true,
    "clamped": false,
    "lowerPoint": { "x": 0, "y": 10 },
    "upperPoint": { "x": 100, "y": 90 }
  }
}
```

Points are configured visually in the node editor as X/Y pairs and sorted automatically by X.

## License

MIT — sr.rpo
