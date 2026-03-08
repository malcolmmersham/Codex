# Branding file format

Drop one of these files in the project root and refresh the page:

- `branding.json`
- `branding.yaml` (or `branding.yml`)
- `branding.md`

Supported color variable keys:

- `bg_a`, `bg_b`, `text`, `muted`, `accent`
- `hero_start`, `hero_end`, `hero_border`
- `card_border`, `card_bg_start`, `card_bg_end`
- `danger`, `danger_bg`, `danger_border`
- `bar_start`, `bar_end`, `spark`

You can also use CSS variable names directly (for example `--accent`).

## Example JSON

```json
{
  "theme": {
    "accent": "#00A3E0",
    "hero_start": "#0D2B45",
    "hero_end": "#16365D",
    "danger": "#FF6B6B"
  }
}
```

## Example YAML

```yaml
theme:
  accent: "#00A3E0"
  hero_start: "#0D2B45"
  hero_end: "#16365D"
  danger: "#FF6B6B"
```

## Example Markdown

```md
--accent: #00A3E0
--hero-start: #0D2B45
--hero-end: #16365D
--danger: #FF6B6B
```
