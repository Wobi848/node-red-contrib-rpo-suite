# node-red-contrib-min-off-time

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (63 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-min-off-time`.
<!-- rpo-suite-note:end -->

Ensures output stays OFF for a minimum duration after turning off. Protects compressors and motors from rapid restart (anti-short-cycle).

## Install

```bash
npm install node-red-contrib-min-off-time
```

## Usage

| msg | Effect |
|-----|--------|
| `msg.payload = false` | Output OFF, timer starts |
| `msg.payload = true` (before timer) | Output stays OFF (held) |
| `msg.payload = true` (after timer) | Output ON immediately |
| `msg.bypassMin = true` | Ignore minimum, follow input directly |
| `msg.reset = true` | Force output ON immediately |

## Output

```json
{
  "input": true,
  "output": false,
  "held": true,
  "remainingMs": 40000,
  "minOffTime": 60000
}
```

## License

MIT — sr.rpo
