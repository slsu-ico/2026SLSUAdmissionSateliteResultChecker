# API Contract

## `GET /api/search-result`

Secure lookup endpoint for SLSU Satellite Campus qualifiers.

### Readiness check

Request:

```http
GET /api/search-result
```

Response:

```json
{
  "ready": true,
  "protected": true
}
```

### Qualifier match

Request:

```http
GET /api/search-result?q=2026-00001
```

Response:

```json
{
  "found": true,
  "satellite": "SLSU Tiaong Campus",
  "course": "Bachelor of Science in Information Technology",
  "date": "May 8, 2026"
}
```

### No match

Response:

```json
{
  "found": false
}
```

## Secure data

The endpoint reads `api/satellite_qualifiers.secure.json`, generated from `satellite_qualifiers.csv` by:

```powershell
.\scripts\generate-satellite-secure-data.ps1 -SourceCsv satellite_qualifiers.csv
```

Required CSV columns:

```csv
Application number,Satelite,course,date
```

`Satelite` and `Satellite` are both accepted as the campus column name.
