# node-red-contrib-idle-mode

Idle mode controller for HVAC components. Triggers a short exercise run when a device has been idle for too long, preventing mechanical seizure (e.g. pumps, valves).

## Install

```bash
npm install node-red-contrib-idle-mode
```

## Usage

Send `true` (running) or `false` (stopped) as `msg.payload`. When the device runs, the idle timer resets. When idle time exceeds the configured interval, an exercise run is triggered automatically.

| msg | Effect |
|-----|--------|
| `msg.payload = true` | Device running — resets idle timer |
| `msg.payload = false` | Device stopped — idle timer counts |
| `msg.reset = true` | Reset idle timer |
| `msg.exercise = true` | Trigger exercise run manually |

## Output

`msg.payload = true` during exercise run, `false` otherwise.

```json
{
  "idleMode": {
    "exercising": true,
    "idleTime": 604800,
    "exerciseInterval": 604800,
    "exerciseDuration": 60,
    "remainingExercise": 45,
    "nextExercise": 0,
    "lastExercise": "2026-04-10T08:00:00.000Z"
  }
}
```

## License

MIT — sr.rpo
