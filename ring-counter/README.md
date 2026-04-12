# node-red-contrib-rpo-ring-counter

A Node-RED node: **Ring Counter**

A wrap-around index counter. Advance, retreat, set, or reset the index via message topics.

## Install

```bash
npm install node-red-contrib-rpo-ring-counter
```

Or via the Node-RED Palette Manager.

## Inputs

- **topic=advance**: Increment index (wraps to 0 after size-1)
- **topic=retreat**: Decrement index (wraps to size-1 after 0)
- **topic=set, payload=N**: Set index to N
- **topic=reset**: Reset to initial index

## Outputs

- **Output 1**: Current ring index (0 to size-1)

## Configuration

| Parameter | Description |
|-----------|-------------|
| Ring size | Number of positions |
| Initial index | Starting index |

## License

MIT
