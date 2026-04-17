# node-red-contrib-rpo-sequencer

Multi-channel sequencer for boiler/chiller staging with wear leveling. Distributes load across 2–8 channels and activates/deactivates them based on demand percentage, respecting minimum on/off times.

## Install

```bash
npm install node-red-contrib-rpo-sequencer
```

## Usage

Send demand percentage (0–100%) as `msg.payload`.

| msg | Effect |
|-----|--------|
| `msg.payload = 60` | 60% demand — activates proportional number of channels |
| `msg.payload = true/false` | Boolean: 100% or 0% demand |
| `msg.forceChannel = [true, false, true]` | Force specific channel states |
| `msg.reset = true` | Reset all channels and runtime counters |

## Output

`msg.payload` = array of boolean channel states, e.g. `[true, false]`.

```json
{
  "sequencer": {
    "demand": 60,
    "activeChannels": 1,
    "channels": [true, false],
    "runtimes": [12.5, 8.2],
    "wearLevel": true
  }
}
```

With wear leveling enabled, the channel with the least runtime is activated first.

## License

MIT — sr.rpo
