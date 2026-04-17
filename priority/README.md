# node-red-contrib-priority

Priority-based signal selector. Outputs the value from the highest-priority active topic. Typical use: hand/auto/BMS override hierarchy in building automation.

## Install

```bash
npm install node-red-contrib-priority
```

## Usage

Send values with the configured topic names. The node outputs the value from the active input with the lowest priority number (1 = highest priority).

| msg | Effect |
|-----|--------|
| `msg.topic = "hand"`, `msg.payload = 75` | Hand override input |
| `msg.topic = "auto"`, `msg.payload = 50` | Automatic control input |
| `msg.reset = true` | Clear all stored values |

An input is considered inactive when its value equals the configured `nullValue` (default: empty string) or is `null`/`undefined`.

## Output

`msg.payload` = value of the highest-priority active input.

```json
{
  "priority": {
    "winner": "hand",
    "winnerPriority": 1,
    "value": 75,
    "inputs": {
      "hand": { "value": 75, "priority": 1, "label": "Hand", "active": true },
      "auto": { "value": 50, "priority": 2, "label": "Auto", "active": true }
    }
  }
}
```

## License

MIT — sr.rpo
