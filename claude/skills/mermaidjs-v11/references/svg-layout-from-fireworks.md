---
attribution: "Pattern adapted from fireworks-tech-graph by yizhiyanhua-ai (MIT)"
upstream: "github.com/yizhiyanhua-ai/fireworks-tech-graph"
upstream_path: "references/svg-layout-best-practices.md"
upstream_sha: "7b22cdd"
imported_at: "2026-04-28"
---

# SVG Diagram Layout Best Practices

Universal layout rules transferable to any SVG-output diagram engine, including Mermaid renders that emit SVG. Apply when reviewing rendered output for collisions, unreadable labels, or arrow-component overlap.

## Universal Layout Rules

### 1. Component Spacing
- Minimum clearance between components: **80px** edge to edge
- Minimum clearance for arrow paths: **60px** from component edges
- Layer vertical spacing: **120px** between horizontal layers
- Same-layer horizontal spacing: **100-120px** between components

### 2. Arrow Routing & Connection Points

**Connection points:**
- Never connect arrows to component corners — use midpoints of edges
- Top/bottom edge: `cx ± offset`, where offset is 0 for a single arrow, ±30px for multiple
- Left/right edge: `cy ± offset`
- Minimum 20px clearance from corners

**Path routing:**
- Avoid diagonals that cross components — use orthogonal (L-shaped) routing
- Curved arrows: place control point at least 40px away from any component edge
- Multiple arrows between the same layers: stagger Y by 15-20px to avoid overlap

```svg
<!-- Bad: diagonal crosses component -->
<path d="M 200,100 L 600,400"/>

<!-- Good: orthogonal routing around component -->
<path d="M 200,100 L 200,250 L 600,250 L 600,400"/>

<!-- Good: curved with safe control point (50px+ from any component) -->
<path d="M 200,100 Q 400,200 600,400"/>
```

### 3. Arrow Label Placement
- Position at midpoint of arrow path, offset 5-10px perpendicular to the arrow
- Always include a background rect — padding 4px horizontal / 2px vertical, fill matches canvas, opacity 0.9-0.95
- Minimum 15px safety distance from any component edge
- Multiple converging arrows: stagger labels vertically by 20px

### 4. Component Overlap Detection

Before finalizing the SVG, check:
- No component bounding boxes overlap (respect the safety margin)
- No arrow paths pass through component interiors (unless intentional, with dashed style)
- No text labels overlap with components or other labels

### 5. Z-Index Layering (SVG render order)

```
1. Background rect
2. Grouping containers (dashed rects)
3. Arrow paths
4. Arrow label background rects
5. Components (boxes, cylinders, etc.)
6. Component text
7. Arrow label text
8. Legend
```

## Style-Specific Adjustments

**Flat (clean):**
- Snap all coordinates to an 8px grid
- `rx="8" ry="8"` for rounded rects
- Thin (1.5-2px) arrows, filled polygon markers
- No shadows

**Soft / warm:**
- `<feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#00000008"/>`
- `rx="12" ry="12"` for more rounded corners
- Medium-weight (2px) arrows, subtle markers

## Validation Checklist

Before exporting PNG, verify:
- [ ] No arrow-component overlaps
- [ ] All arrow labels have background rects
- [ ] Minimum 60px clearance for all arrow paths
- [ ] Component spacing >= 80px
- [ ] Arrow connection points avoid corners (>= 20px from corner)
- [ ] Multiple arrows between layers are staggered
- [ ] Legend is readable and doesn't overlap content
- [ ] SVG validates with `rsvg-convert`

## Common Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Arrow crosses component | Use orthogonal routing or increase control point distance |
| Label overlaps component | Add background rect + increase offset |
| Components too close | Increase spacing to 80px minimum |
| Arrow connects to corner | Move connection point to edge midpoint offset |
| No z-index planning | Follow render order: arrows -> components -> text |
