# API Contract

## `GET /api/search-result`

Secure lookup endpoint for SLSU Satellite Campus qualifiers, with fallback checks for SLSU Main Campus first-choice and DPWAS lists.

Lookup priority:

1. Satellite Campus qualifier list
2. Main Campus DPWAS list
3. Main Campus first-choice qualifier list
4. No current record found

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

### Satellite Campus qualifier match

```json
{
  "found": true,
  "type": "satellite_qualifier",
  "satellite": "SLSU Tiaong Campus",
  "course": "Bachelor of Science in Information Technology",
  "date": "May 8, 2026"
}
```

### Main Campus DPWAS match

```json
{
  "found": true,
  "type": "main_dpwas",
  "date": "April 29, 2026",
  "time": "10AM-11AM"
}
```

### Main Campus first-choice match

```json
{
  "found": true,
  "type": "main_first_choice",
  "program": "Bachelor of Science in Nursing"
}
```

### No match

```json
{
  "found": false
}
```

## Secure Data Files

The endpoint reads these encrypted files from `api/`:

- `satellite_qualifiers.secure.json` for satellite campus qualifier records
- `dpwas.secure.json` for Main Campus DPWAS records
- `data.secure.json` for Main Campus first-choice qualifier records

Satellite data uses `DATA_ENCRYPTION_KEY`. Main Campus fallback files use `MAIN_DATA_ENCRYPTION_KEY` when set; otherwise they use `DATA_ENCRYPTION_KEY`.

