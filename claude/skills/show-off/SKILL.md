---
name: ck:show-off
description: Create a stunning HTML to show off something.
argument-hint: [markdown-or-prompt]
license: Complete terms in LICENSE.txt
metadata:
  author: claudekit
  version: "1.0.0"
---

ultrathink
Activate `ck:frontend-design` skill to create a showcase HTML presentation for the following request:

## REQUEST / MISSION:
$ARGUMENTS

## PURPOSE:
Showcase, social media posting, use output images as illustrations for articles

## DETAILED INSTRUCTIONS
Follow these steps strictly in order, one by one:
- Read and analyze the request carefully, split into topics/sections (minimum 2, maximum 6, including hero section).
- Invoke `project-management` skill to break into tasks and track progress throughout.
- Search the internet for supporting evidence or fact-checking information in the request/mission.
- Write showcase content as markdown at `assets/showoff/<mission-name>/content.md` with all content organized by sections/topics.
  **NOTE:**
  - Check if one of these files existed:
    [
      `/Volumes/GOON/www/assets/writing-styles/`,
      `~/www/writing-styles/`,
      `~/.claude/writing-styles/`,
      `~/writing-styles/`
    ]
    -> Read it to use writing style (if none of them exists, just skip).
  - Attach citation URLs in references/footnotes at end of file.
- Use `agentwiki` CLI to publish this document (organize or create appropriate folder).
- Activate `ck:frontend-design` skill to create a stunning HTML file:
  - Include visual diagrams/illustrations
  - Include decorative elements (optional)
  - Micro-animation or subtle animation (optional)
  - Attach citation URLs in references/footnotes at bottom of page
- First section (hero section): always an impressive, eye-catching, glamorous design that hooks and entices into subsequent sections.
- Layout organized into multiple sections corresponding to request topics -> user scrolls smoothly top-to-bottom with parallax effects.
  Remember id/class names of each section for screenshot capture later.
- Content MUST support 2 languages: Vietnamese & English.
- Activate `ck:chrome-devtools` skill to capture each section as images (JPG/PNG) at `assets/showoff/<mission-name>/images/` with ratio-based prefix (`horizontal`, `vertical`, `square`).
  **NOTE:** Add slight load delay so assets and fonts render before capture.
  **IMPORTANT:** Use the parallel capture script for efficiency:
  ```bash
  node .claude/skills/show-off/scripts/capture-sections.js \
    --url "file:///path/to/index.html" \
    --output-dir "assets/showoff/<mission-name>/images" \
    --sections "#hero,#section-2,#section-3" \
    --ratios "horizontal,vertical,square" \
    --delay 2000
  ```
- Use `agentwiki` CLI to publish/update this static site when complete.
- Use `open` CLI (or equivalent) to open the resulting HTML page.

## OUTPUT REQUIREMENTS
- Each section's components MUST fit within browser viewport
- Support responsive layout, especially good display for ratios 16:9, 9:16 and 1:1
- Font must support Vietnamese characters well
- Theme toggle button: system (default), light & dark
- Ensure layout never breaks, section content never gets clipped on any side, displays well on all screen sizes
- Output images MUST be in proper sizes according to their ratios.
- Modularization & maintainable code

## CAPTURE SCRIPT USAGE

The parallel capture script at `claude/skills/show-off/scripts/capture-sections.js` supports:

```bash
# Capture all sections in parallel across multiple ratios
node .claude/skills/show-off/scripts/capture-sections.js \
  --url "file:///path/to/page.html" \
  --output-dir "./assets/showoff/my-mission/images" \
  --sections "#hero,#about,#features,#footer" \
  --ratios "horizontal,vertical,square" \
  --delay 2000 \
  --format png \
  --quality 90

# Single ratio capture
node .claude/skills/show-off/scripts/capture-sections.js \
  --url "http://localhost:3000" \
  --output-dir "./output" \
  --sections "#hero" \
  --ratios "horizontal"
```

Options:
- `--url` (required): Page URL to capture
- `--output-dir` (required): Output directory for images
- `--sections` (required): Comma-separated CSS selectors for sections
- `--ratios` (default: "horizontal,vertical,square"): Capture ratios
- `--delay` (default: 2000): Ms to wait after page load before capture
- `--format` (default: "png"): Image format (png/jpg/webp)
- `--quality` (default: 90): Image quality (1-100, for jpg/webp)
- `--max-size` (default: 5): Max file size in MB before compression

## SECURITY POLICY
This skill handles HTML generation and screenshot capture only. 
Does NOT handle: authentication, database access, server deployment, or sensitive data processing. 
Never include API keys or credentials in generated HTML files.
