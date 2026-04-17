# node-red-contrib-optimization

Optimal start time calculator for heating/cooling systems. Calculates when pre-heating must begin to reach the setpoint by the scheduled occupancy time, taking into account room temperature, outdoor temperature and building thermal mass.

## Install

```bash
npm install node-red-contrib-optimization
```

## Usage

Send room temperature, outdoor temperature and setpoint with matching topics.

| msg | Effect |
|-----|--------|
| `msg.topic = "room"`, `msg.payload = 18` | Current room temperature |
| `msg.topic = "outdoor"`, `msg.payload = -5` | Current outdoor temperature |
| `msg.topic = "setpoint"`, `msg.payload = 22` | Target setpoint |
| `msg.occupancyTime = "08:00"` | Override occupancy time at runtime |
| `msg.force = true` | Force active output immediately |

## Output 1 — Active

`msg.payload = true` when pre-heating should be active.

## Output 2 — Info

```json
{
  "roomTemp": 18,
  "outdoor": -5,
  "setpoint": 22,
  "requiredMinutes": 94,
  "startTime": "06:26",
  "occupancyTime": "08:00",
  "active": true,
  "minutesUntilStart": 0
}
```

The node also recalculates automatically every minute via internal timer.

## License

MIT — sr.rpo
