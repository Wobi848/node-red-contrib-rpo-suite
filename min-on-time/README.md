# node-red-contrib-min-on-time

<!-- rpo-suite-note:start -->
> Part of the **[rpo-suite](https://www.npmjs.com/package/node-red-contrib-rpo-suite)** (64 building automation nodes). Install everything with `npm install node-red-contrib-rpo-suite`, or only this node with `npm install node-red-contrib-min-on-time`.
<!-- rpo-suite-note:end -->

Ensures output stays ON for a minimum duration. Even if input turns OFF early, output remains ON until the minimum time has elapsed.

## Install

```bash
npm install node-red-contrib-min-on-time
```

## Usage

| msg | Effect |
|-----|--------|
| `msg.payload = true` | Output ON, timer starts |
| `msg.payload = false` (before timer) | Output stays ON (held) |
| `msg.payload = false` (after timer) | Output OFF immediately |
| `msg.bypassMin = true` | Ignore minimum, follow input directly |
| `msg.reset = true` | Force output OFF immediately |

## Output

```json
{
  "input": false,
  "output": true,
  "held": true,
  "remainingMs": 20000,
  "minOnTime": 30000
}
```

## License

MIT — sr.rpo
