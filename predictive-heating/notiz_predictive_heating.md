# Notiz: predictive-heating.js – Mode-Namen umbenennen

## Problem
Die `mode` Ausgabe ist irreführend:
- `"cooling"` bedeutet aktuell: *Aussentemperatur kühlt ab (Kältefront)*
- Klingt aber wie: *Klimaanlage / Kühlung aktiv*

## To-Do
In `predictive-heating.js` die Mode-Namen anpassen:

```javascript
// ALT
if (delta > 0.5) mode = "warming";
else if (delta < -0.5) mode = "cooling";
else mode = "stable";

// NEU (Vorschlag)
if (delta > 0.5) mode = "warm_front";
else if (delta < -0.5) mode = "cold_front";
else mode = "stable";
```

## Warum
- `warm_front` = Aussentemperatur steigt → Heizung zurückregeln
- `cold_front` = Aussentemperatur fällt → Heizung hochdrehen
- `stable` = keine nennenswerte Änderung

## Betroffene Datei
`predictive-heating.js` — Node-RED Custom Node
