# Project notes

## Skills

### liquid-glass (`.claude/skills/liquid-glass/`)

Installed from https://github.com/haider-nawaz/liquid-glass-skill.

**Always invoke this skill for any UI, design, or website work** — building a new
page or site, restyling an existing one, or any request about how something
should look. Load it before writing markup or styles, not after.

Note on scope: the skill's source material is Apple's SwiftUI Liquid Glass APIs
(iOS/macOS 26+), so its code samples are Swift. For web work, use it as the
design authority — translate its rules to CSS:

- Glass belongs to the **navigation layer only** (nav bars, toolbars, buttons,
  floating controls), never to content itself (text blocks, lists, media).
- Regular vs. clear glass, tinting, and interactive states map to
  `backdrop-filter: blur() saturate()`, translucent backgrounds, and layered
  highlight/border treatments.
- Group nearby glass surfaces so they read as one material (the
  `GlassEffectContainer` idea) instead of stacking independent blurs.
- Respect `prefers-reduced-transparency`, `prefers-contrast`, and
  `prefers-reduced-motion` — the skill treats these as required, not optional.
