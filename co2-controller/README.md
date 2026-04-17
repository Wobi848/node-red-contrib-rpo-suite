# node-red-contrib-co2-controller

CO2-based ventilation controller for demand-controlled ventilation (DCV). Calculates ventilation output (0–100%) based on measured CO2 level. Supports override and triggers an alarm above a configurable alarm level.

## Install

```bash
npm install node-red-contrib-co2-controller
```

## Usage

Send CO2 concentration in ppm as `msg.payload`.

| msg | Effect |
|-----|--------|
| `msg.payload = 850` | CO2 measurement in ppm |
| `msg.override = 75` | Force ventilation to 75% |
| `msg.clearOverride = true` | Clear override |

## Output 1 — Ventilation %

`msg.payload` = ventilation demand 0–100%.

```json
{
  "co2Controller": {
    "co2": 1050,
    "ventilation": 62.5,
    "minLevel": 800,
    "maxLevel": 1200,
    "alarmLevel": 1500,
    "alarm": false,
    "category": "II"
  }
}
```

Categories per EN 13779: I (≤800 ppm), II (800–1000 ppm), III (1000–1200 ppm), Alarm (≥1500 ppm).

## Output 2 — CO2 Alarm

`msg.payload = true` when CO2 exceeds alarm level. Sent only on state change.

## License

MIT — sr.rpo
