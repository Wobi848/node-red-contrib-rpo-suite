# node-red-contrib-multi-stat

Node-RED Multi-Source Statistics - calculates Min/Max/Avg across multiple topics.

## Features

- Aggregates values from multiple sources (topics)
- Calculates Min/Max/Avg in real-time
- Configurable decimal places
- Minimum topic count before first output
- Reset and remove via msg

## Behavior

- Each source is identified by `msg.topic`
- Stores only the latest value per topic (no history)
- On each input: update value → recalculate statistics → output

## Example

```
Input: topic="room1", payload=21.5
Input: topic="room2", payload=19.8
Input: topic="room3", payload=23.1

Output:
{
  min: 19.8,
  max: 23.1,
  avg: 21.47,
  count: 3,
  values: { room1: 21.5, room2: 19.8, room3: 23.1 }
}
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Decimals | Decimal places for min/max/avg | 2 |
| Min. Topics | Minimum topics before first output | 1 |

## Input

- `msg.payload` - Numeric value
- `msg.topic` - **Required** - Unique source ID

### Runtime Overrides

| Property | Description |
|----------|-------------|
| `msg.reset` | `true` = clear all values |
| `msg.remove` | `true` = remove this topic |

## Output

```json
{
  "min": 19.8,
  "max": 23.1,
  "avg": 21.47,
  "count": 3,
  "values": { "room1": 21.5, "room2": 19.8, "room3": 23.1 }
}
```

## Use Cases

| Application | Description |
|-------------|-------------|
| Room temperatures | Min/Max/Avg across all rooms |
| Sensor network | Aggregated readings |
| Load balancing | Min/Max across multiple servers |

## Node Status

- **Idle** - Waiting for data
- **Waiting (1/3 Topics)** - minTopics not yet reached
- **3 Topics | Min 19.8 Max 23.1 Avg 21.5** - Active statistics

## Author

sr.rpo

## License

MIT
