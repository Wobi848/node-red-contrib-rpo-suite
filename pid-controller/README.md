# node-red-contrib-pid-controller-isa

Industrial-grade PID controller for Node-RED using the ISA standard algorithm. Comparable to Siemens FB41, Beckhoff Tc2_Pid, and Allen-Bradley PIDE.

## Features

- **ISA Standard PID Algorithm** - Industry-standard formulation
- **Feed-Forward** - Disturbance compensation with safety limiting
- **Tracking Mode** - Cascade control with NaN-safe fallback
- **Anti-Windup** - Conditional integration prevents saturation
- **Integrator Soft Clamp** - Fast recovery after long saturation
- **Bumpless Transfer** - Smooth transition from manual to auto mode
- **Derivative Smoothing** - EMA filter, numerically stable for any dt
- **Output Rate Limiting** - Protects actuators from rapid changes
- **Max Interval Timeout** - Detects sensor failures
- **NaN/Infinity Protection** - Robust operation with back-calculation recovery
- **Reverse Acting Mode** - For cooling control applications
- **Centered Band Mode** - DDC-style 50% output at setpoint
- **Xp Mode** - Proportional band (physically correct: Kp = outputSpan/Xp)
- **Industry-Compatible Aliases** - pv, sp, ff, external, cascade
- **Full Runtime Override** - All parameters adjustable via messages

## Installation

```bash
cd ~/.node-red
npm install node-red-contrib-pid-controller-isa
```

Or install via the Node-RED palette manager.

## Formula (ISA Standard)

```
output = Kp × [ e(t) + (1/Ti) × ∫e(t)dt + Td × de(t)/dt ] + FF

Direct:  e(t) = setpoint - processValue
Reverse: e(t) = processValue - setpoint
FF = ffGain × feedForward
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| **Setpoint** | Target value | 20 |
| **Use Xp** | Use proportional band instead of Kp | false |
| **Kp / Xp** | Proportional gain or band % (Kp = outputSpan/Xp) | 1.0 |
| **Ti** | Integral time in seconds (0 = disabled) | 60 |
| **Td** | Derivative time in seconds (0 = disabled) | 0 |
| **Output Min** | Minimum output % | 0 |
| **Output Max** | Maximum output % | 100 |
| **Rate Limit** | Max change per second, %/s (0 = disabled) | 0 |
| **Max Interval** | Max time between samples (0 = disabled) | 0 |
| **Reverse Acting** | Enable for cooling control | false |
| **Centered Band** | 50% output at setpoint (DDC-style) | false |
| **Enable Feed-Forward** | Enable msg.feedForward input | false |
| **FF Gain** | Feed-forward scaling factor | 1.0 |
| **Manual Mode** | Start in manual mode | false |
| **Manual Value** | Initial manual output % | 0 |
| **Decimals** | Output decimal places | 1 |

## Inputs

| Property | Type | Description |
|----------|------|-------------|
| `payload` / `pv` | number | **Required.** Process value (temperature, pressure, etc.) |
| `setpoint` / `sp` | number | Override setpoint (sticky - stays until changed or reset) |
| `Kp` | number | Override proportional gain |
| `Xp` | number | Override proportional band (converted to Kp = outputSpan/Xp) |
| `Ti` | number | Override integral time (seconds) |
| `Td` | number | Override derivative time (seconds) |
| `feedForward` / `ff` | number | Feed-forward value (limited to ±outputSpan) |
| `trackingValue` / `external` / `cascade` | number | Tracking value for cascade control |
| `manual` | boolean | Switch to manual (true) or auto (false) |
| `manualValue` | number | Set manual output value (0-100%) |
| `reset` | boolean | Reset controller state and restore default setpoint |

## Outputs

### Output 1 - Control Output

| Property | Type | Description |
|----------|------|-------------|
| `payload` | number | Control output (0-100%) |
| `pid` | object | Detailed PID information |

The `pid` object contains:

```javascript
{
  processValue: 18,      // Current process value
  setpoint: 22,          // Active setpoint
  error: 4,              // Current error
  output: 45.2,          // Control output
  P: 4,                  // Proportional term
  I: 1.2,                // Integral term
  D: 0,                  // Derivative term
  FF: 0,                 // Feed-forward term
  Kp: 1,                 // Active Kp
  Ti: 60,                // Active Ti
  Td: 0,                 // Active Td
  dt: 1.003,             // Time since last calculation (s)
  clamped: false,        // Output was clamped
  clampedAt: null,       // "min" or "max" if clamped
  antiWindup: false,     // Anti-windup was active
  manual: false,         // Manual mode active
  reverseActing: false,  // Reverse acting mode
  centeredBand: false,   // Centered band mode
  rateLimit: 0,          // Rate limit setting
  rateLimited: false,    // Output was rate limited
  maxInterval: 0,        // Max interval setting
  intervalExceeded: false, // Interval was exceeded
  ffEnable: false,       // Feed-forward enabled
  ffGain: 1.0,           // Feed-forward gain
  tracking: undefined,   // Tracking value if provided
  trackingActive: false  // Tracking mode was active
}
```

### Output 2 - Status

| Property | Type | Description |
|----------|------|-------------|
| `payload.manual` | boolean | Manual mode active |
| `payload.setpoint` | number | Active setpoint |
| `payload.processValue` | number | Current process value |
| `payload.error` | number | Current error |
| `payload.output` | number | Control output |

## Node Status

The node displays real-time status:

- **Green dot**: `SP:22 PV:18 → 45.2%` - Normal auto operation
- **Blue dot**: `MANUAL → 50.0%` - Manual mode
- **Yellow dot**: `SP:22 PV:18 → 100% (clamped)` - Output saturated
- **Yellow dot**: `SP:22 PV:18 → 45.2% (rate limited)` - Rate limited
- **Cyan dot**: `SP:22 PV:18 → 45.2% (tracking)` - Tracking mode active
- **Red dot**: `SP:22 PV:18 → 45.2% (interval!)` - Max interval exceeded

## Feed-Forward

Feed-forward compensates for disturbances **before** they cause errors.

**Example:** Room heating with outdoor temperature compensation

```text
Without FF: Cold outside → Room cools → PID reacts → Valve opens
With FF:    Cold outside → Valve opens immediately → Room stays stable
```

The feed-forward value is added directly to the output:

```text
output = PID(error) + ffGain × feedForward
```

Feed-forward does **not** affect the integrator - it's a parallel path.

### Usage

```javascript
msg.payload = roomTemperature;      // Process value
msg.feedForward = outsideTemp - 20; // Disturbance (deviation from 20°C)
return msg;
```

## Cascade Control (Tracking Mode)

Cascade control uses two PID controllers in series. The outer (master) loop controls the setpoint of the inner (slave) loop.

**Problem without Tracking:**
When the inner loop saturates (valve at 100%), the outer loop's integrator keeps winding up, causing massive overshoot when saturation ends.

**Solution with Tracking:**
Feed the inner loop's output back to the outer loop via `msg.trackingValue`. This forces the outer integrator to follow the actual output, preventing windup.

```text
[Outer PID] ────setpoint────→ [Inner PID] ───→ Valve
      ↑                            │
      └─── msg.trackingValue ──────┘
```

### Cascade Wiring Example

```javascript
// Function node between Inner PID and Outer PID
// Sends inner output back to outer as tracking value
msg.trackingValue = msg.payload;  // Inner PID output
msg.payload = roomTemperature;    // Process value for outer PID
return msg;
```

This is the same approach used by industrial controllers like Siemens FB41 (CONT_C) and Honeywell PID88.

## Anti-Windup

Uses **conditional integration**: The integral only accumulates when it won't drive the output further into saturation. This prevents windup before it happens, rather than correcting it after.

## Integrator Soft Clamp

The integrator is limited to ±(outputSpan/Ki) to prevent extreme values during long saturation periods. This ensures fast recovery when the process returns to normal range - no more waiting for a huge integral to wind down.

## Bumpless Transfer

When switching from manual to auto mode, the integral term is pre-loaded so the output continues smoothly from the current manual value.

## Safety Features

- **NaN/Infinity Protection** - If output becomes NaN or Infinity, it freezes to the last valid output and back-calculates the integrator to maintain consistency
- **Feed-Forward Limiting** - FF is clamped to ±outputSpan to prevent runaway output from extreme FF values
- **Tracking NaN Guard** - Invalid tracking input (e.g. "abc") falls back to normal integration instead of freezing the integrator
- **Reset Restores Defaults** - Reset command also restores the configured default setpoint

## Centered Band (DDC-Style)

When enabled, output is 50% at setpoint:

- Below setpoint → output > 50% (more heating)
- Above setpoint → output < 50% (less heating)

Works with any output range (0-100, 0-10V, 4-20mA).

## Example Flows

### Basic Temperature Control

```json
{
  "type": "pid-controller",
  "name": "Heater Control",
  "setpoint": 22,
  "Kp": 2,
  "Ti": 120,
  "Td": 30,
  "outMin": 0,
  "outMax": 100
}
```

### Cooling Control (Reverse Acting)

```json
{
  "type": "pid-controller",
  "name": "Chiller Control",
  "setpoint": 7,
  "Kp": 1.5,
  "Ti": 180,
  "reverseActing": true
}
```

### Feed-Forward with Outdoor Temperature

```javascript
// Function node before PID
msg.payload = roomTemperature;
msg.feedForward = (20 - outsideTemperature) * 0.5; // Scale factor
return msg;
```

## Tuning Tips

### Ziegler-Nichols Method

1. Set Ti = 0, Td = 0
2. Increase Kp until oscillation occurs (Ku)
3. Measure oscillation period (Tu)
4. Set parameters:
   - **P only**: Kp = 0.5 × Ku
   - **PI**: Kp = 0.45 × Ku, Ti = Tu / 1.2
   - **PID**: Kp = 0.6 × Ku, Ti = Tu / 2, Td = Tu / 8

### General Guidelines

- Start with **P only** (Ti = 0, Td = 0)
- Increase Kp until response is acceptable but not oscillating
- Add **I** (reduce Ti) to eliminate steady-state error
- Add **D** (increase Td) to reduce overshoot (use sparingly)

## License

MIT

## Author

sr.rpo - Building automation PID controller for Node-RED.
