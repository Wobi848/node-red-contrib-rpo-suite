# node-red-contrib-watchdog

Monitors incoming messages and triggers an alarm if no message is received within the configured timeout period.

## Install

```bash
npm install node-red-contrib-watchdog
```

## Usage

Any incoming message resets the watchdog timer.

| msg | Effect |
|-----|--------|
| Any message | Resets timer, clears alarm if active |
| `msg.reset = true` | Resets timer without counting as heartbeat |

## Output 1 — Passthrough

Original message unchanged.

## Output 2 — Alarm

`msg.payload = true` when timeout expired, `false` when cleared. Only fires on state change.

```json
{
  "alarm": true,
  "timeout": 60,
  "lastMessage": "2026-03-01T08:00:00Z",
  "elapsed": 62.3
}
```

## License

MIT — sr.rpo
