# node-red-contrib-rpo-multiplexer

A Node-RED node: **Multiplexer**

Routes one of 8 input channels (ch0–ch7) to a single output. Switch the active channel by sending a message with topic `select` and payload `ch0`–`ch7`.

## Install

```bash
npm install node-red-contrib-rpo-multiplexer
```

Or via the Node-RED Palette Manager.

## Inputs

- **topic=ch0..ch7**: Value update for that channel
- **topic=select, payload=ch0..ch7**: Switch active channel

## Outputs

- **Output 1**: Value of the currently selected channel

## Configuration

| Parameter | Description |
|-----------|-------------|
| Active channel | Initially selected channel (ch0–ch7) |
| Pass-through mode | Forward all channels or only the active one |

## License

MIT
