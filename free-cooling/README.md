# node-red-contrib-free-cooling

Free cooling controller for HVAC systems. Enables free cooling when outdoor air is cool enough to reduce indoor temperature without mechanical cooling.

## Install

```bash
npm install node-red-contrib-free-cooling
```

## Usage

Send indoor and outdoor temperatures with matching topics.

| msg | Effect |
|-----|--------|
| `msg.topic = "indoor"`, `msg.payload = 26` | Indoor temperature in °C |
| `msg.topic = "outdoor"`, `msg.payload = 18` | Outdoor temperature in °C |

Free cooling activates when: `indoor - outdoor ≥ minDelta` AND `minOutdoor ≤ outdoor ≤ maxOutdoor`.

## Output 1 — Active state

`msg.payload = true/false` — free cooling active/inactive.

```json
{
  "freeCooling": {
    "indoor": 26,
    "outdoor": 18,
    "delta": 8,
    "minDelta": 3,
    "maxOutdoor": 24,
    "minOutdoor": 8,
    "active": true
  }
}
```

## Output 2 — State change

`msg.payload = true/false` — sent only on state change.

## License

MIT — sr.rpo
