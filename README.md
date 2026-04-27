# SLSU Satellite Campus Qualifier Checker

This folder is a separate checker for SLSU Satellite Campus qualifiers.

The checker also identifies application numbers that are already in the SLSU Main Campus first-choice qualifier list or Main Campus DPWAS list.

## Satellite CSV format

Use `satellite_qualifiers.csv` with these columns:

```csv
Application number,Satelite,course,date
2026-00001,"SLSU Tiaong Campus","Bachelor of Science in Information Technology","May 8, 2026"
```

The generator accepts both `Satelite` and `Satellite` as the campus column name.

## Generate satellite secure data

Set `DATA_ENCRYPTION_KEY`, then run:

```powershell
.\scripts\generate-satellite-secure-data.ps1 -SourceCsv satellite_qualifiers.csv
```

This creates `api/satellite_qualifiers.secure.json`.

## Main Campus fallback data

The API also uses these encrypted Main Campus lookup files:

- `api/dpwas.secure.json`
- `api/data.secure.json`

If these files use the same key as the satellite data, no extra environment variable is needed. If they were generated with a different key, set `MAIN_DATA_ENCRYPTION_KEY` in deployment to the Main Campus data key.

