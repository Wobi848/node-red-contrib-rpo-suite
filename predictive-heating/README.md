# node-red-contrib-predictive-heating

Predictive outdoor temperature node for heating and cooling curve control. Uses weather forecast and solar UV correction to calculate a more realistic outdoor temperature — saving energy without sacrificing comfort.

## How it works

Instead of using only the current outdoor temperature for heating/cooling curve control, this node calculates a **weighted predictive temperature** that takes upcoming weather into account:

- **Cold front coming** → AT_pred drops → heating reacts earlier
- **Warm front coming** → AT_pred rises → cooling reacts earlier
- **High UV / solar gain** → AT_pred rises → passive solar heating is accounted for
- **No sun** → no correction → heating/cooling runs normally

Works automatically for both heating and cooling — no mode switching needed.

## Inputs

| Property | Type | Description |
|----------|------|-------------|
| `msg.at_current` | number | **Required** - Current outdoor temperature (°C) |
| `msg.avg_day0` | number | *(optional)* Forecast avg temperature today (°C) |
| `msg.avg_day1` | number | *(optional)* Forecast avg temperature tomorrow (°C) |
| `msg.avg_day2` | number | *(optional)* Forecast avg temperature day after tomorrow (°C) |
| `msg.uv_day0` | number | *(optional)* UV index today (0–12) |
| `msg.uv_day1` | number | *(optional)* UV index tomorrow (0–12) |

Forecast values are **stored in node context** — only send them when they change (e.g. once per hour from your weather API). `at_current` can be sent as often as needed. If a forecast value is missing and no stored value exists, it falls back to `at_current`.

## Output

```json
{
  "at_predictive": 3.5,
  "correction": -1.5,
  "solar_offset": 0.5,
  "mode": "cooling"
}
```

| Field | Description |
|-------|-------------|
| `at_predictive` | Calculated predictive outdoor temperature → use as AT input for heat/cool curve |
| `correction` | Delta between predictive and current AT (forecast influence only) |
| `solar_offset` | Solar UV correction applied (°C) |
| `mode` | `"warming"` / `"cooling"` / `"stable"` |

## Algorithm

```
AT_pred = (AT_current × w0 + avg_day0 × w1 + avg_day1 × w2 + avg_day2 × w3) / total_weight

uv_avg = (uv_day0 + uv_day1) / 2
solar_offset = (uv_avg / 12) × uvMaxOffset   // positive: high UV = warmer

AT_final = AT_pred + solar_offset
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| Weight Current | 4 | Weight of current outdoor temperature |
| Weight Day 0 | 2 | Weight of today's forecast |
| Weight Day 1 | 1 | Weight of tomorrow's forecast |
| Weight Day 2 | 0.5 | Weight of day after tomorrow's forecast |
| Max UV Offset | 2 | Maximum solar correction in °C (at UV index 12) |

## Use Cases

| Application | Description |
|-------------|-------------|
| Heating curve | Feed `at_predictive` as outdoor temp → pre-heat before cold front |
| Cooling curve | Feed `at_predictive` as outdoor temp → pre-cool before heat wave |
| HVAC control | Reduce energy by accounting for solar gains |

## Tips

> **Tip:** Instead of using the current momentary outdoor temperature as `at_current`, use a **24h rolling average**. This eliminates short-term fluctuations and represents the actual thermal load of the building — exactly how professional DDC/BMS systems work. The weighted forecast then builds on a stable base, making the prediction much more accurate.

## Weather API Integration

Example function node to map WeatherAPI response:

```javascript
var w = msg.payload;
msg.at_current = global.get('gWeatherAvg24hTemp') ?? w.current.temp_c;
msg.avg_day0   = w.forecast.forecastday[0].day.avgtemp_c;
msg.avg_day1   = w.forecast.forecastday[1].day.avgtemp_c;
msg.avg_day2   = w.forecast.forecastday[2].day.avgtemp_c;
msg.uv_day0    = w.forecast.forecastday[0].day.uv;
msg.uv_day1    = w.forecast.forecastday[1].day.uv;
return msg;
```

## Node Status

- **AT 5 → 3.5°C (cooling)** - Cold front detected (blue)
- **AT 5 → 7.2°C (warming)** - Warm front detected (yellow)
- **AT 5 → 5.4°C (stable)** - Stable weather with solar gain (green)

## Author

sr.rpo

## License

MIT
