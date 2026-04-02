'use strict';

/**
 * Statusline section registry - maps section IDs to render functions.
 * Each renderer: (ctx, sectionConfig, theme) => string | null
 * Agents and todos are handled separately (multi-line, see statusline-activity-renderers.cjs).
 */

const {
  RESET, green, yellow, red, cyan, magenta, dim,
  coloredBar, getContextColor, resolveColor
} = require('./colors.cjs');

// Default section config (order matches visual left-to-right / top-to-bottom)
const DEFAULT_SECTIONS = [
  { id: 'model',     enabled: true, order: 0, icon: '🤖' },
  { id: 'context',   enabled: true, order: 1 },
  { id: 'quota',     enabled: true, order: 2, icon: '⌛' },
  { id: 'directory', enabled: true, order: 3, icon: '📁' },
  { id: 'git',       enabled: true, order: 4, icon: '🌿' },
  { id: 'cost',      enabled: false, order: 5, icon: '💰' },
  { id: 'changes',   enabled: true, order: 6, icon: '📝' },
  { id: 'agents',    enabled: true, order: 7, icon: '🔄' },
  { id: 'todos',     enabled: true, order: 8, icon: '✅' },
];

const DEFAULT_THEME = {
  contextLow:  'green',
  contextMid:  'yellow',
  contextHigh: 'red',
  accent:      'cyan',
  muted:       'dim',
  separator:   'dim',
};

// ============================================================================
// SECTION RENDERERS
// ============================================================================

/** Renders model name: "🤖 claude-opus-4" */
function renderModelSection(ctx, sectionConfig, theme) {
  const icon = sectionConfig.icon || '🤖';
  const colorFn = resolveColor(sectionConfig.color || theme.accent);
  return `${icon} ${colorFn(ctx.modelName)}`;
}

// "▰▰▱▱▱ 40%" — returns null when context is 0
function renderContextSection(ctx, sectionConfig, theme) {
  if (ctx.contextPercent <= 0) return null;
  return `${coloredBar(ctx.contextPercent, 12)} ${getContextColor(ctx.contextPercent)}${ctx.contextPercent}%${RESET}`;
}

// "⌛ 5h 20% (1h30m)  wk 45% (4d)" — returns null when no usage windows
function renderQuotaSection(ctx, sectionConfig, theme) {
  if (!ctx.usageWindows || ctx.usageWindows.length === 0) return null;
  return `${sectionConfig.icon || '⌛'} ${resolveColor(sectionConfig.color || theme.muted)(ctx.usageWindows.join('  '))}`;
}

// "📁 ~/project"
function renderDirectorySection(ctx, sectionConfig, theme) {
  return `${sectionConfig.icon || '📁'} ${resolveColor(sectionConfig.color || 'yellow')(ctx.currentDir)}`;
}

// "🌿 main (2, +1, 3↑)" — returns null outside git repos
function renderGitSection(ctx, sectionConfig, theme) {
  if (!ctx.gitBranch) return null;
  const gitColorFn = resolveColor(sectionConfig.color || 'magenta');
  let part = `${sectionConfig.icon || '🌿'} ${gitColorFn(ctx.gitBranch)}`;
  const indicators = [];
  if (ctx.gitUnstaged > 0) indicators.push(`${ctx.gitUnstaged}`);
  if (ctx.gitStaged > 0)   indicators.push(`+${ctx.gitStaged}`);
  if (ctx.gitAhead > 0)    indicators.push(`${ctx.gitAhead}↑`);
  if (ctx.gitBehind > 0)   indicators.push(`${ctx.gitBehind}↓`);
  if (indicators.length > 0) part += ` ${yellow(`(${indicators.join(', ')})`)}`;
  return part;
}

// "💰 $0.42" — returns null when no cost data
function renderCostSection(ctx, sectionConfig, theme) {
  if (!ctx.costText) return null;
  return `${sectionConfig.icon || '💰'} ${resolveColor(sectionConfig.color || 'dim')(ctx.costText)}`;
}

// "📝 +10 -5" — returns null when no lines changed; if sectionConfig.color set, applies uniform color
function renderChangesSection(ctx, sectionConfig, theme) {
  if (ctx.linesAdded <= 0 && ctx.linesRemoved <= 0) return null;
  if (sectionConfig.color) {
    const changeFn = resolveColor(sectionConfig.color);
    return `${sectionConfig.icon || '📝'} ${changeFn(`+${ctx.linesAdded} -${ctx.linesRemoved}`)}`;
  }
  return `${sectionConfig.icon || '📝'} ${green(`+${ctx.linesAdded}`)} ${red(`-${ctx.linesRemoved}`)}`;
}

// Map section ID → render function (agents/todos handled by statusline-activity-renderers.cjs)
const SECTION_RENDERERS = {
  model:     renderModelSection,
  context:   renderContextSection,
  quota:     renderQuotaSection,
  directory: renderDirectorySection,
  git:       renderGitSection,
  cost:      renderCostSection,
  changes:   renderChangesSection,
};

/** Look up the render function for a section ID. Returns null if not registered. */
function getSectionRenderer(id) {
  return SECTION_RENDERERS[id] || null;
}

/**
 * Resolve effective layout from statuslineLayout config, falling back to defaults.
 * Supports both new lines[][] format and legacy sections[] format.
 * When statuslineLayout is undefined/null, returns defaults — identical pre-refactor behavior.
 * @param {Object|undefined} statuslineLayout - From .ck.json config
 * @returns {{ sections, theme, responsiveBreakpoint, maxAgentRows, todoTruncation }}
 */
function resolveLayout(statuslineLayout) {
  if (!statuslineLayout || typeof statuslineLayout !== 'object') {
    return {
      sections: DEFAULT_SECTIONS.slice(),
      theme: { ...DEFAULT_THEME },
      responsiveBreakpoint: 0.85,
      maxAgentRows: 4,
      todoTruncation: 50,
    };
  }

  const defaultById = {};
  for (const s of DEFAULT_SECTIONS) defaultById[s.id] = s;
  const sectionConfig = (statuslineLayout.sectionConfig && typeof statuslineLayout.sectionConfig === 'object')
    ? statuslineLayout.sectionConfig : {};

  let sections;

  if (Array.isArray(statuslineLayout.lines)) {
    // New lines[][] format: convert to flat sections array with order + per-section config
    let order = 0;
    sections = [];
    for (const line of statuslineLayout.lines) {
      if (!Array.isArray(line)) continue;
      for (const id of line) {
        const base = defaultById[id] || { id, enabled: true, order: 99 };
        const cfg = sectionConfig[id] || {};
        sections.push({ ...base, ...cfg, id, enabled: true, order: order++ });
      }
    }
  } else if (Array.isArray(statuslineLayout.sections)) {
    // Legacy sections[] format (backward compat)
    sections = statuslineLayout.sections
      .map(cs => ({ ...(defaultById[cs.id] || { id: cs.id, enabled: true, order: 99 }), ...cs }))
      .filter(s => s.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  } else {
    sections = DEFAULT_SECTIONS.slice();
  }

  // Guard: if theme is a string (e.g. "dark"), spread produces garbage {0:"d",1:"a",...}
  const themeInput = statuslineLayout.theme;
  const themeOverride = (themeInput && typeof themeInput === 'object' && !Array.isArray(themeInput)) ? themeInput : {};
  // Pass through the original lines config for the render modes to use
  const configLines = Array.isArray(statuslineLayout.lines) ? statuslineLayout.lines : null;

  return {
    sections,
    configLines,
    theme: { ...DEFAULT_THEME, ...themeOverride },
    responsiveBreakpoint: typeof statuslineLayout.responsiveBreakpoint === 'number'
      ? Math.max(0.5, Math.min(1.0, statuslineLayout.responsiveBreakpoint)) : 0.85,
    maxAgentRows: typeof statuslineLayout.maxAgentRows === 'number'
      ? statuslineLayout.maxAgentRows : 4,
    todoTruncation: typeof statuslineLayout.todoTruncation === 'number'
      ? statuslineLayout.todoTruncation : 50,
  };
}

module.exports = {
  DEFAULT_SECTIONS,
  DEFAULT_THEME,
  getSectionRenderer,
  resolveLayout,
};
