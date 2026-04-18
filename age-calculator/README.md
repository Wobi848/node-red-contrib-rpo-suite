# node-red-contrib-age-calculator

A Node-RED node to calculate age and time elapsed since a birth date.

## Features

- Calculate age in years, months, weeks, days, hours, minutes, seconds
- Human-readable output (e.g., "34 Jahre, 6 Monate, 7 Tage")
- Unix timestamp of birth date
- Support for German date format (DD.MM.YYYY)
- Support for ISO date format (YYYY-MM-DD)
- Optional time component (HH:MM or HH:MM:SS)
- Configurable output fields via checkboxes or `msg.outputFields`

## Supported Date Formats

| Format | Example |
|--------|---------|
| DD.MM.YYYY | 12.09.1991 |
| DD.MM.YYYY HH:MM | 12.09.1991 06:05 |
| DD.MM.YYYY HH:MM:SS | 12.09.1991 06:05:30 |
| YYYY-MM-DD | 1991-09-12 |
| YYYY-MM-DD HH:MM | 1991-09-12 06:05 |
| YYYY-MM-DD HH:MM:SS | 1991-09-12 06:05:30 |

## Usage

### Input
- `msg.payload` - Birth date as string (overrides configured date)
- `msg.outputFields` - (optional) Override output fields dynamically

### Output
- `msg.payload` - Object containing selected fields

### Example Output (all fields enabled)
```json
{
  "years": 34,
  "months": 414,
  "weeks": 1801,
  "days": 12610,
  "hours": 302649,
  "minutes": 18158940,
  "seconds": 1089536400,
  "readable": "34 Jahre, 6 Monate, 7 Tage, 9 Stunden, 26 Minuten",
  "timestamp": 684648300000,
  "birthdate": "12.09.1991 06:05",
  "calculated": "2026-03-21T15:31:00.000Z"
}
```

### Dynamic Output Fields
You can override which fields are included via `msg.outputFields`:

```javascript
msg.outputFields = {
    years: true,
    months: false,
    weeks: false,
    days: true,
    hours: false,
    minutes: false,
    seconds: false,
    readable: true,
    timestamp: false
};
msg.payload = "12.09.1991 06:05";
return msg;
```

## Author

sr.rpo

## License

MIT
