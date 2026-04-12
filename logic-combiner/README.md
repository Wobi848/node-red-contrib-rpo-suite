# node-red-contrib-logic-combiner

Node-RED Logic Combiner - combines multiple boolean inputs with individual AND/OR operators per input.

## Features

- AND / OR operator **configurable per topic**
- Up to 99 topics
- Inversion per topic (NOT)
- Truthy/Falsy evaluation
- Min. topics before first output
- Optional initial value

## Behavior

- Each input is identified by `msg.topic`
- Per topic configurable: Operator (AND/OR), Label, Inversion
- Calculation is performed sequentially in the configured order
- Output as soon as minTopics is reached

## Example

**Complex logic: (Pump AND NOT Fault) OR Bypass**
```
Input 1 (Pump)         = true  → Start
Input 2 (Fault)   AND  = false → NOT → true
Input 3 (Bypass)  OR   = true
─────────────────────────────────────────────
Calculation: (true AND true) OR true = true
```

## Configuration

| Property | Description | Default |
|----------|-------------|---------|
| Min. Topics | Number of topics before first output | all |
| Initial Value | Initial value for topics | none |
| Topics | List with: Operator (AND/OR), Topic, Label, NOT | - |

### Topic Configuration

Each topic has the following properties:
- **Operator** (AND/OR): Combination with the previous result (first topic = Start)
- **Topic**: The msg.topic value for identification
- **Label**: Descriptive name (optional)
- **NOT**: Inverts the value before combination

## Input

- `msg.payload` - Any value (truthy/falsy)
- `msg.topic` - **Required** - Must match a configured topic

### Truthy/Falsy

**Falsy (= false):**
`false`, `0`, `""`, `null`, `undefined`, `NaN`, `"false"`, `"0"`, `"off"`

**Truthy (= true):**
Everything else: `true`, `1`, `"on"`, etc.

### Runtime Override

| Property | Description |
|----------|-------------|
| `msg.reset` | `true` = reset all values |

## Output

```json
{ "payload": true }
```

## Use Cases

| Application | Configuration |
|-------------|---------------|
| Safety circuit | EmergencyStop AND Door AND Release |
| Alarm system | Sensor1 OR Sensor2 OR Sensor3 |
| Ready state | Pump AND (NOT Fault) |
| Complex | (Pump AND NOT Fault) OR Bypass |

## Node Status

- **→ true (3/3)** - Result active
- **→ false (3/3)** - Result inactive
- **Waiting (1/3 Topics)** - Not enough data yet

## Author

sr.rpo

## License

MIT
