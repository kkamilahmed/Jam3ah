---
name: Jam3ah
colors:
  # ── Surfaces (dark mode — primary design direction) ──
  background: "#0e0e0e"
  on-background: "#c6c6c7"
  surface: "#111111"
  surface-dim: "#0e0e0e"
  surface-bright: "#252626"
  surface-container-lowest: "#111111"
  surface-container-low: "#131313"
  surface-container: "#181818"
  surface-container-high: "#1f2020"
  surface-container-highest: "#252626"
  on-surface: "#c6c6c7"
  on-surface-variant: "#acabaa"
  inverse-surface: "#f5f5f5"
  inverse-on-surface: "#1c1c1e"
  # ── Outlines ──
  outline: "#3a3a3a"
  outline-variant: "#2a2a2a"
  outline-subtle: "#1e1e1e"
  # ── Accent (Emerald — default theme; see themes section) ──
  surface-tint: "#34d399"
  primary: "#34d399"
  on-primary: "#0a0a0a"
  primary-container: "#0d2b20"
  on-primary-container: "#6ee7b7"
  inverse-primary: "#059669"
  # ── Secondary (neutral chrome) ──
  secondary: "#acabaa"
  on-secondary: "#0e0e0e"
  secondary-container: "#1f2020"
  on-secondary-container: "#c6c6c7"
  # ── Error ──
  error: "#f87171"
  on-error: "#0a0a0a"
  error-container: "#2c0a0a"
  on-error-container: "#f87171"
  # ── Extended text hierarchy ──
  text-max: "#ffffff"
  text-dim: "#8a8a8a"
  text-faint: "#6a6a6a"
  text-ghost: "#5a5a5a"
  text-phantom: "#4a4a4a"
  # ── Nav glass ──
  nav-bg: "rgba(14,14,14,0.92)"

typography:
  display:
    fontFamily: Manrope
    fontSize: 72px
    fontWeight: "800"
    lineHeight: 75.6px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Manrope
    fontSize: 42px
    fontWeight: "800"
    lineHeight: 46px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 30px
  title-lg:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: "700"
    lineHeight: 26px
  title-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: "700"
    lineHeight: 22px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 29.7px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 21px
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 19.5px
  label-lg:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: "600"
    lineHeight: 18px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.08em
  badge:
    fontFamily: Manrope
    fontSize: 9px
    fontWeight: "700"
    lineHeight: 12px
    letterSpacing: 0.06em

rounded:
  DEFAULT: 0.125rem
  full: 9999px

spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  nav-height: 64px
  container-padding-mobile: 16px
  container-padding-desktop: 24px
  card-padding: "32px 28px"
  card-padding-mobile: "20px 16px"
  section-gap: 80px
  modal-max-width: 440px

elevation:
  card: "none"
  dropdown: "0 8px 32px rgba(0,0,0,0.8)"
  modal: "0 25px 50px rgba(0,0,0,0.6)"
  modal-lg: "0 25px 60px rgba(0,0,0,0.7)"
  glow-soft: "0 0 32px rgba(52,211,153,0.06)"
  glow-accent: "0 0 12px rgba(52,211,153,0.6)"

motion:
  duration-fast: 0.12s
  duration-base: 0.15s
  duration-slow: 0.2s
  easing-standard: ease
  easing-linear: linear
  spin: "1s linear infinite"
  ping: "1.5s ease infinite"

themes:
  emerald:
    name: Emerald
    primary: "#34d399"
    primary-light: "#6ee7b7"
    on-primary: "#0a0a0a"
  amber:
    name: Gold
    primary: "#f59e0b"
    primary-light: "#fcd34d"
    on-primary: "#0a0a0a"
  sky:
    name: Ocean
    primary: "#38bdf8"
    primary-light: "#7dd3fc"
    on-primary: "#0a0a0a"
  violet:
    name: Royal
    primary: "#a78bfa"
    primary-light: "#c4b5fd"
    on-primary: "#ffffff"
  rose:
    name: Ruby
    primary: "#fb7185"
    primary-light: "#fda4af"
    on-primary: "#ffffff"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.DEFAULT}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.on-primary-container}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid {colors.outline}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
  button-subtle:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid rgba(52,211,153,0.3)"
    padding: "8px 16px"
  button-subtle-hover:
    backgroundColor: "rgba(52,211,153,0.25)"
  button-danger:
    backgroundColor: "rgba(239,68,68,0.06)"
    textColor: "{colors.error}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid rgba(239,68,68,0.2)"
    padding: "8px 16px"
  input-field:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid {colors.outline-variant}"
    padding: "10px 12px"
  input-field-focus:
    border: "1px solid {colors.primary}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid {colors.surface-container-high}"
    padding: "{spacing.card-padding}"
  card-hover:
    border: "1px solid {colors.outline}"
  card-active:
    backgroundColor: "{colors.primary-container}"
    border: "1px solid rgba(52,211,153,0.25)"
  badge:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid rgba(52,211,153,0.25)"
    padding: "6px 12px"
  status-badge:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    typography: "{typography.badge}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid rgba(52,211,153,0.25)"
    padding: "3px 8px"
  modal-overlay:
    backgroundColor: "rgba(0,0,0,0.8)"
    backdropFilter: "blur(4px)"
    zIndex: 60
  modal-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid {colors.outline-variant}"
    boxShadow: "{elevation.modal}"
    maxWidth: "{spacing.modal-max-width}"
  nav:
    backgroundColor: "{colors.nav-bg}"
    backdropFilter: "blur(20px)"
    height: "{spacing.nav-height}"
    borderBottom: "1px solid {colors.outline-subtle}"
  select-dropdown:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.DEFAULT}"
    border: "1px solid {colors.outline-variant}"
    boxShadow: "{elevation.dropdown}"
    maxHeight: 240px
  select-option-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
---

## Brand & Style

Jam3ah is a masjid management platform built for Islamic community administrators. The visual identity fuses a rigorous, data-dense dashboard aesthetic with quiet nods to Islamic geometric tradition. The result is a product that feels **professional and focused** — never ornamental — while still carrying a sense of cultural identity through its emerald accent, geometric SVG background pattern, and carefully chosen spacing rhythm.

The primary personality is **Precise Islam** — dark, calm, and purposeful. Dark backgrounds are near-black (not pitch black) to retain warmth. Every color decision is restrained; the accent color does the only expressive work. Type is dense but readable, hierarchy is established through weight and opacity alone rather than size changes. The single 2px border-radius applied to every component — buttons, inputs, cards, modals, badges — is intentional: it rejects both the sharp severity of 0px and the friendliness of rounded corners, landing in a space that reads as *structured authority*.

## Colors

The color strategy is a near-monochromatic dark system governed by a single swappable accent. Backgrounds are stacked layers of near-black:

- **`background`** (`#0e0e0e`) — the deepest layer, the root canvas
- **`surface-container-*`** — a five-step scale from `#111111` to `#252626`, each `+4–6` luminance, used to create depth through layering alone without shadows
- **`on-surface`** (`#c6c6c7`) — primary text. Not white. This grey reads comfortably against the near-black backgrounds without eye strain
- **`text-dim` → `text-phantom`** — a four-step text scale descending from `#8a8a8a` to `#4a4a4a`, used for secondary labels, placeholders, and decorative section headings
- **`primary`** (`#34d399`, emerald-400) — the sole expressive color. All interactive states, active indicators, focus rings, and status highlights are derived from this single accent at different opacities: `8%` fill, `25%` normal border, `40%` strong border, `60%` for glow effects
- **Error** (`#f87171`, red-400) — follows the same opacity derivation pattern as the primary for danger states

The accent is runtime-swappable across five presets (Emerald, Gold, Ocean, Royal, Ruby — see `themes` in the frontmatter). The neutral scale never changes; only the accent values swap. Light mode inverts all surfaces to a cool white/grey scale (`#f5f5f5` → `#d0d0d0`) and shifts the emerald accent to shade 600 (`#059669`) to maintain contrast.

Avoid introducing any new color that isn't already in the surface scale, the accent stack, or the error stack. The design's restraint is its identity.

## Typography

The entire product uses a single typeface: **Manrope** (Google Fonts, variable, weights 300–800). Its geometric construction and extended width make it legible at the small sizes (11–13px) common in data-dense admin panels. High weights (700, 800) are used aggressively for headings; this creates contrast with the medium-weight (500) body text without increasing size.

**Hierarchy rules:**
- Section overlines and micro-labels use `label-sm` or `label-md` set in **uppercase** with `0.08em` letter-spacing. This is a deliberate design choice to signal "metadata" visually.
- Card titles and row headers use `title-md` (15px / 700). This is the workhorse size.
- Body content is `body-sm` (13px / 500). Dense but not cramped.
- The landing page hero uses `display` (up to 72px / 800 / −0.03em tracking) rendered via `clamp(42px, 7vw, 72px)` — responsive fluid type.
- No body text is ever set lighter than weight 400, and never smaller than 11px.

Icons use **Material Symbols Outlined** (Google Fonts variable font) at weight 300 (`font-variation-settings: 'wght' 300`). The low weight keeps icons from competing with type. Default render size is 20px; nav icons bump to 22px.

## Layout & Spacing

The spacing unit is **4px**. All padding, gap, and margin values are multiples of 4.

The dashboard is a **fixed full-viewport layout**: a 64px sticky nav at top, content filling the remaining height, a 60px sticky bottom tab bar on mobile. There are no scrolling page containers — each tab renders its own scrollable region.

Key breakpoint: **768px** (mobile below, desktop above). On mobile, multi-column grids collapse to single-column stacks, padding drops from `24px` to `16px`, and the desktop sidebar nav becomes a bottom tab bar.

Max-width containers are used only on the landing page: hero content is constrained to `760px`, feature cards to `1100px`, and the top nav to `1200px`.

Card padding is `32px 28px` on desktop and `20px 16px` on mobile — a significant reduction that acknowledges reduced screen real estate without feeling cramped. Modals are capped at `440px` width and centered within a `blur(4px)` overlay.

The prayer schedule grid (the most data-dense view) uses `5` equal columns for the five daily prayers on desktop, collapsing to individual stacked day-cards on mobile.

## Elevation & Depth

Cards use **zero shadow**. Depth is achieved exclusively through background color: a card at `surface` (`#111111`) sits above `background` (`#0e0e0e`) by being 3 luminance points lighter. Hover states step up one surface tier and add a slightly brighter border. No `box-shadow` is applied to any card.

Shadows appear only where a layer must visually break from the document flow:
- **Dropdowns** (`0 8px 32px rgba(0,0,0,0.8)`) — select menus and date pickers
- **Modals** (`0 25px 50px rgba(0,0,0,0.6)`) — dialog containers
- **Accent glow** (`0 0 32px rgba(52,211,153,0.06)`) — next-prayer highlight card; so subtle it reads more as a tint than a shadow

The nav and modals use `backdrop-filter: blur(20px)` and `blur(4px)` respectively to signal elevation via the frosted glass idiom without relying on darkness.

## Shapes

**2px border-radius everywhere, with no exceptions except circular dots.**

This single token defines the product's visual character. It is not a rounded UI. It is not a sharp UI. The 2px radius is a studied neutral — corners are finished, not raw, but they carry no personality. This lets the accent color, the spacing, and the density carry all the visual expression. Pill shapes (`border-radius: 9999px`) appear only on the pulsing "next prayer" status dot (5px × 5px) and its `ping` animation ring.

Do not introduce `rounded-lg`, `rounded-xl`, or any radius above 2px. The uniformity is intentional.

## Components

### Buttons

Four variants, each serving a clear hierarchy:

1. **Primary** — solid `primary` fill, `on-primary` text. Used for the single most important action on screen (Save, Generate, Post).
2. **Secondary** — transparent with an `outline` border. Used for cancel actions and secondary navigation.
3. **Subtle** — translucent `primary-container` fill with an accent border. Used when multiple accent-colored actions coexist (tab pills, toggles).
4. **Danger** — translucent red fill at 6% opacity. Used for destructive actions (Delete, Remove).

All four share the same `2px` radius, `label-lg` typography, and `0.12s` hover transition. The distinction is entirely in fill and border color — not in size or shape.

### Inputs & Selects

Inputs use `surface-container-low` as their background to be visually recessed relative to cards. The border is `outline-variant` at rest; on focus it transitions to the `primary` accent. Custom `<Select>` components render their dropdown as a portal (`position: fixed, z-index: 9999`) with `0 8px 32px rgba(0,0,0,0.8)` shadow. Hover options highlight in `primary-container` with `primary` text — the same accent treatment used throughout.

### Cards & Panels

Cards are the fundamental building block. They sit on `surface` (`#111111`) with a `surface-container-high` border — barely visible against the background but enough to define the boundary. On hover, the border steps up to `outline` (`#3a3a3a`). When active or selected, they switch to `primary-container` fill with accent border — a clear state change with no animation required.

### Islamic Geometric Pattern

An SVG pattern (`id="islamic-dash"`) tiles at 80×80px and is applied as a full-bleed `position: absolute` background behind dashboard content. It consists of two concentric hexagons and three crossing lines in a classic geometric motif. The stroke is `0.5px` at the `primary` accent color at reduced opacity (`0.04`–`0.08` opacity on the rect fill). It reads as texture rather than decoration — barely perceptible but unmistakably intentional. Scale and opacity must stay at these values; making it more prominent would compete with content.

### Badges & Labels

Section overlines use `label-sm` / `label-md` in `text-ghost` (`#5a5a5a`), uppercase, wide-tracked. This pattern signals "category header" without a visible divider line. Status badges (TODAY, ACTIVE, PINNED) use `badge` typography (9px / 700) in the accent color against `primary-container`, with uppercase and `0.06em` tracking. All badges use the same 2px radius and border treatment as every other component.

### Navigation

The nav is a 64px frosted glass strip: `rgba(14,14,14,0.92)` background + `blur(20px)` + a 1px `outline-subtle` bottom border. On desktop it renders as a horizontal tab bar centered in the header. On mobile it disappears from the top and reappears as a 60px bottom tab bar with icon + label pairs. The active tab is indicated exclusively by accent color on the icon and label text — no pill, chip, or underline indicator is used in the bottom bar.
