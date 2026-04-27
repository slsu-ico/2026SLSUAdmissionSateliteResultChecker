# SLSU Satellite Campus Qualifier Checker

This folder is a separate checker for SLSU Satellite Campus qualifiers.

## CSV format

Use `satellite_qualifiers.csv` with these columns:

```csv
Application number,Satelite,course,date
2026-00001,"SLSU Tiaong Campus","Bachelor of Science in Information Technology","May 8, 2026"
```

The generator accepts both `Satelite` and `Satellite` as the campus column name.

## Generate secure data

Set `DATA_ENCRYPTION_KEY`, then run:

```powershell
.\scripts\generate-satellite-secure-data.ps1 -SourceCsv satellite_qualifiers.csv
```

This creates `api/satellite_qualifiers.secure.json`, which is used by `api/search-result.js`.
