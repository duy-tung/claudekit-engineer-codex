#!/usr/bin/env python3
"""
Scan .claude/skills and regenerate the checked-in skill registries.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from pathlib import Path
import re

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
CATEGORY_ORDER = [
    "ai-ml",
    "frontend",
    "backend",
    "infrastructure",
    "database",
    "dev-tools",
    "multimedia",
    "frameworks",
    "utilities",
    "other",
]
CATEGORY_NAMES = {
    "ai-ml": "AI & Machine Learning",
    "frontend": "Frontend & Design",
    "backend": "Backend Development",
    "infrastructure": "Infrastructure & DevOps",
    "database": "Database & Storage",
    "dev-tools": "Development Tools",
    "multimedia": "Multimedia & Processing",
    "frameworks": "Frameworks & Platforms",
    "utilities": "Utilities & Helpers",
    "other": "Other",
}

# Exact mappings for high-signal CK skills to avoid falling into "other".
EXACT_CATEGORY_MAP = {
    "ask": "utilities",
    "bootstrap": "utilities",
    "brainstorm": "utilities",
    "ck-autoresearch": "utilities",
    "ck-debug": "utilities",
    "ck-loop": "utilities",
    "ck-predict": "utilities",
    "ck-scenario": "utilities",
    "code-review": "utilities",
    "coding-level": "utilities",
    "context-engineering": "utilities",
    "cook": "utilities",
    "copywriting": "utilities",
    "debug": "utilities",
    "docs": "utilities",
    "fix": "utilities",
    "journal": "utilities",
    "markdown-novel-viewer": "utilities",
    "mermaidjs-v11": "utilities",
    "plan": "utilities",
    "ck-plan": "utilities",
    "preview": "utilities",
    "problem-solving": "utilities",
    "project-management": "utilities",
    "project-organization": "utilities",
    "research": "utilities",
    "retro": "utilities",
    "sequential-thinking": "utilities",
    "test": "utilities",
    "watzup": "utilities",
    "find-skills": "dev-tools",
    "git": "dev-tools",
    "gkg": "dev-tools",
    "kanban": "dev-tools",
    "llms": "dev-tools",
    "mintlify": "dev-tools",
    "plans-kanban": "dev-tools",
    "scout": "dev-tools",
    "ship": "dev-tools",
    "team": "dev-tools",
    "use-mcp": "dev-tools",
    "worktree": "dev-tools",
    "xia": "dev-tools",
    "react-best-practices": "frontend",
    "remotion": "frontend",
    "shader": "frontend",
    "stitch": "frontend",
    "web-design-guidelines": "frontend",
    "tanstack": "frameworks",
    "deploy": "infrastructure",
    "agent-browser": "multimedia",
    "web-testing": "multimedia",
    "ck-security": "utilities",
    "security-scan": "utilities",
}


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def extract_frontmatter(content: str) -> dict[str, str]:
    """Extract the small subset of frontmatter fields we care about."""
    match = FRONTMATTER_RE.match(content)
    if not match:
        return {}

    result: dict[str, str] = {}
    lines = match.group(1).splitlines()
    index = 0

    while index < len(lines):
        line = lines[index]
        if not line.strip() or line.lstrip().startswith("#"):
            index += 1
            continue

        field_match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not field_match:
            index += 1
            continue

        key, value = field_match.group(1), field_match.group(2).strip()
        if value in {">", ">-", "|", "|-"}:
            block_lines: list[str] = []
            index += 1
            while index < len(lines) and lines[index].startswith("  "):
                block_lines.append(lines[index][2:])
                index += 1
            result[key] = " ".join(part.strip() for part in block_lines if part.strip())
            continue

        if value:
            result[key] = strip_quotes(value)
        index += 1

    return result


def extract_first_paragraph(content: str) -> str:
    """Extract the first meaningful paragraph after frontmatter."""
    content = FRONTMATTER_RE.sub("", content, count=1)
    paragraph: list[str] = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if line.startswith("#") or not line:
            if paragraph:
                break
            continue
        paragraph.append(line)
        if line.endswith(".") and len(" ".join(paragraph)) > 50:
            break

    return " ".join(paragraph)[:400]


def categorize_skill(name: str) -> str:
    """Categorize skill based on name heuristics."""
    lower_name = name.lower()
    if lower_name in EXACT_CATEGORY_MAP:
        return EXACT_CATEGORY_MAP[lower_name]
    if any(x in lower_name for x in ["ai-", "gemini", "multimodal", "adk"]):
        return "ai-ml"
    if any(x in lower_name for x in ["frontend", "ui", "design", "aesthetic", "threejs"]):
        return "frontend"
    if any(x in lower_name for x in ["backend", "auth", "payment"]):
        return "backend"
    if any(x in lower_name for x in ["devops", "docker", "cloudflare", "gcloud"]):
        return "infrastructure"
    if any(x in lower_name for x in ["database", "mongodb", "postgresql", "sql"]):
        return "database"
    if any(x in lower_name for x in ["mcp", "skill-creator", "repomix", "docs-seeker"]):
        return "dev-tools"
    if any(x in lower_name for x in ["media", "chrome-devtools", "document-skills"]):
        return "multimedia"
    if any(x in lower_name for x in ["web-frameworks", "mobile", "shopify"]):
        return "frameworks"
    if any(x in lower_name for x in ["debug", "problem", "code-review", "planning", "research", "sequential"]):
        return "utilities"
    return "other"


def normalize_display_name(internal_name: str, frontmatter: dict[str, str]) -> str:
    raw_name = frontmatter.get("name", "")
    if raw_name.startswith("ck:"):
        return raw_name[3:]
    if raw_name:
        return raw_name
    return internal_name


def scan_skills(base_path: Path) -> list[dict[str, object]]:
    """Scan all skill files and extract metadata."""
    skills: list[dict[str, object]] = []

    for skill_file in sorted(base_path.rglob("SKILL.md")):
        skill_dir = skill_file.parent
        internal_name = skill_dir.name
        if internal_name == "template-skill":
            continue

        if skill_dir.parent.name != "skills":
            internal_name = f"{skill_dir.parent.name}/{internal_name}"

        content = skill_file.read_text(encoding="utf-8")
        frontmatter = extract_frontmatter(content)
        description = frontmatter.get("description") or extract_first_paragraph(content)
        display_name = normalize_display_name(internal_name, frontmatter)

        skill_entry: dict[str, object] = {
            "name": internal_name,
            "display_name": display_name,
            "path": str(skill_file.relative_to(base_path)),
            "description": description,
            "category": categorize_skill(internal_name),
            "has_scripts": (skill_dir / "scripts").exists(),
            "has_references": (skill_dir / "references").exists(),
        }

        argument_hint = frontmatter.get("argument-hint", "")
        if argument_hint:
            skill_entry["argument_hint"] = argument_hint

        skills.append(skill_entry)

    return skills


def group_by_category(skills: list[dict[str, object]]) -> dict[str, list[dict[str, object]]]:
    categories: dict[str, list[dict[str, object]]] = defaultdict(list)
    for skill in skills:
        categories[str(skill["category"])].append(skill)
    return categories


def yaml_scalar(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def write_skills_registry(skills: list[dict[str, object]], repo_root: Path) -> Path:
    output_path = repo_root / "claude" / "scripts" / "skills_data.yaml"
    lines: list[str] = []

    for skill in skills:
        lines.append(f'- name: {yaml_scalar(str(skill["name"]))}')
        lines.append(f'  path: {yaml_scalar(str(skill["path"]))}')
        lines.append(f'  description: {yaml_scalar(str(skill["description"]))}')
        lines.append(f'  category: {yaml_scalar(str(skill["category"]))}')
        lines.append(f'  has_scripts: {"true" if skill["has_scripts"] else "false"}')
        lines.append(f'  has_references: {"true" if skill["has_references"] else "false"}')
        if "argument_hint" in skill:
            lines.append(f'  argument_hint: {yaml_scalar(str(skill["argument_hint"]))}')

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return output_path


def write_catalog_yaml(skills: list[dict[str, object]], repo_root: Path) -> Path:
    categories = group_by_category(skills)
    active_categories = [name for name in CATEGORY_ORDER if categories.get(name)]
    output_path = repo_root / "guide" / "SKILLS.yaml"
    lines = [
        "metadata:",
        f"  title: {yaml_scalar('Skills Catalog')}",
        f"  description: {yaml_scalar('Auto-generated catalog of all available skills in ClaudeKit Engineer')}",
        f"  last_updated: '{date.today().isoformat()}'",
        f"  total_skills: {len(skills)}",
        "categories:",
    ]

    for category in active_categories:
        lines.append(f"  {category}: {yaml_scalar(CATEGORY_NAMES[category])}")

    lines.extend([
        "legend:",
        f"  has_scripts: {yaml_scalar('Has executable scripts')}",
        f"  has_references: {yaml_scalar('Has reference documentation')}",
        "skills:",
    ])

    for category in active_categories:
        lines.append(f"  {category}:")
        for skill in sorted(categories[category], key=lambda item: str(item["display_name"]).lower()):
            lines.append(f'  - name: {yaml_scalar(str(skill["display_name"]))}')
            lines.append(f'    path: {yaml_scalar(str(skill["path"]))}')
            lines.append(f'    description: {yaml_scalar(str(skill["description"]))}')
            lines.append(f'    category: {yaml_scalar(category)}')
            lines.append(f'    has_scripts: {"true" if skill["has_scripts"] else "false"}')
            lines.append(f'    has_references: {"true" if skill["has_references"] else "false"}')
            if "argument_hint" in skill:
                lines.append(f'    argument_hint: {yaml_scalar(str(skill["argument_hint"]))}')

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return output_path


def write_catalog_markdown(skills: list[dict[str, object]], repo_root: Path) -> Path:
    categories = group_by_category(skills)
    active_categories = [name for name in CATEGORY_ORDER if categories.get(name)]
    output_path = repo_root / "guide" / "SKILLS.md"
    lines = [
        "# Skills Catalog",
        "",
        "Auto-generated catalog of all available skills in ClaudeKit Engineer.",
        "",
        f"**Last Updated**: {date.today().isoformat()}",
        "",
        f"**Total Skills**: {len(skills)}",
        "",
        "## Categories",
        "",
    ]

    for category in active_categories:
        lines.append(f"- [{CATEGORY_NAMES[category]}](#{category})")

    lines.extend(["", "## Legend", "", "- 📦 Has executable scripts", "- 📚 Has reference documentation", ""])

    for category in active_categories:
        lines.extend([f"## {CATEGORY_NAMES[category]}", ""])
        for skill in sorted(categories[category], key=lambda item: str(item["display_name"]).lower()):
            icons = []
            if skill["has_scripts"]:
                icons.append("📦")
            if skill["has_references"]:
                icons.append("📚")
            prefix = f'{" ".join(icons)} ' if icons else ""
            lines.extend([
                f"### {prefix}`{skill['display_name']}`",
                "",
                str(skill["description"]),
                "",
                f"**Location**: `.claude/skills/{skill['path']}`",
                "",
            ])

    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return output_path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    base_path = repo_root / "claude" / "skills"
    if not base_path.exists():
        raise SystemExit(f"Error: {base_path} not found")

    print("Scanning skills...")
    skills = scan_skills(base_path)
    print(f"Found {len(skills)} skills")

    categories = group_by_category(skills)
    for category in CATEGORY_ORDER:
        skills_list = categories.get(category, [])
        if not skills_list:
            continue
        print(f"\n{CATEGORY_NAMES[category]}:")
        for skill in sorted(skills_list, key=lambda item: str(item['display_name']).lower()):
            scripts = "📦" if skill["has_scripts"] else "  "
            refs = "📚" if skill["has_references"] else "  "
            print(f"  {scripts}{refs} {str(skill['display_name']):30} {str(skill['description'])[:80]}")

    registry_path = write_skills_registry(skills, repo_root)
    catalog_yaml = write_catalog_yaml(skills, repo_root)
    catalog_md = write_catalog_markdown(skills, repo_root)
    print(f"\n✓ Saved registry to {registry_path.relative_to(repo_root)}")
    print(f"✓ Saved catalog to {catalog_yaml.relative_to(repo_root)}")
    print(f"✓ Saved catalog to {catalog_md.relative_to(repo_root)}")


if __name__ == "__main__":
    main()
