---
name: Incident Operations Desk
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#170cae'
  on-tertiary: '#ffffff'
  tertiary-container: '#3433c3'
  on-tertiary-container: '#b3b5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  layout-gutter: 1.5rem
  layout-margin: 2rem
---

## Brand & Style

The design system establishes a high-precision, utilitarian environment built for engineering, IT operations, and corporate support teams managing mission-critical incidents. The emotional response is centered on control, clarity, and deliberate calm during high-stress operational bottlenecks. 

Rooted in modern corporate minimalism with high-density data legibility, the interface rejects decorative flourish in favor of clear status indication, disciplined visual rhythm, and immediate scannability. Content hierarchy relies on subtle architectural lines, deliberate negative space, and unambiguous color semantics that convey state and urgency without visual fatigue.

## Colors

The palette utilizes a deep corporate blue foundation with cool slate grays to preserve sustained visual comfort across long shifts.

### Functional Palette
- **Canvas Base**: `#FFFFFF` (Surface Elevated / Cards), `#F8FAFC` (App Shell / Background).
- **Structural Borders**: `#E2E8F0` for component containers, `#CBD5E1` for active or focused boundaries.
- **Typography & Text**: 
  - Primary text: Slate 900 (`#0F172A`).
  - Secondary metadata and column labels: Slate 700 (`#334155`).
  - Muted helpers and timestamps: Slate 500 (`#64748B`).

### Status System
Each operational state uses a dedicated text/icon color paired with a 10% tinted container background:
- **Pendiente**: Text `#B45309`, Container `#FEF3C7`, Border `#FDE68A`.
- **En revisión**: Text `#0284C7`, Container `#E0F2FE`, Border `#BAE6FD`.
- **En proceso**: Text `#4F46E5`, Container `#EEF2FF`, Border `#C7D2FE`.
- **Cerrado**: Text `#059669`, Container `#D1FAE5`, Border `#A7F3D0`.

### Priority Spectrum
- **Baja**: Text `#475569`, Container `#F1F5F9`.
- **Media**: Text `#1D4ED8`, Container `#EFF6FF`.
- **Alta**: Text `#C2410C`, Container `#FFEDD5`.
- **Crítica**: Text `#BE123C`, Container `#FFE4E6`.

## Typography

Inter serves as the sole typographic system, chosen for its neutral, highly legible glyph architecture under high-density data presentation.

### Application Rules
- **Display & Headlines**: Reserved strictly for view headers, metrics overviews, and modal titles. Always set with negative tracking to enhance structural compactness.
- **Body Text**: `body-md` (14px) is the primary engine of the platform, applied across incident descriptions, communication logs, and internal notes.
- **Labels & Microcopy**: `label-sm` is applied with uppercase tracking (`letter-spacing: 0.04em`) on table headers, status indicators, and category tags to differentiate structural labels from live data.
- **Identifiers & Telemetry**: Monospaced snippets (ticket hashes, log outputs, API responses) standardize on `code-sm`.

## Layout & Spacing

The layout model is built on an absolute 4px/8px baseline grid designed to maximize horizontal workspace while preserving sufficient breathing room for rapid incident scanning.

### Layout Model
- **Desktop (1280px and above)**: Collapsible persistent left sidebar (240px expanded, 64px collapsed), fluid multi-column workspace with a fixed right-hand context/triage pane (360px wide). Maximum content boundary uncapped on dashboard tables, capped at 1440px for individual ticket resolution views.
- **Tablet (768px - 1279px)**: Left navigation folds into an icon bar or overlay menu; right-hand context drawer collapses into an off-canvas slide-over triggered on demand.
- **Mobile (< 768px)**: Single-column stack. Tables convert into stacked incident summary cards. Bottom app navigation bar replaces desktop side panels.

### Rhythm & Densities
- **Compact View (Data Grids)**: Cell padding set to `space-sm` (8px) vertically, `space-base` (16px) horizontally.
- **Standard View (Forms, Detail Views)**: Field stacking and row separation set to `space-base` (16px).

## Elevation & Depth

Visual hierarchy uses flat structural containment backed by low-contrast outlines and diffuse ambient shadows. Hard drop shadows are avoided to keep the interface clinical and crisp.

### Elevation Hierarchy
- **Level 0 (Base Canvas)**: `#F8FAFC`. Completely flat; houses the application frame, navigation rails, and non-interactive backgrounds.
- **Level 1 (Panels & Cards)**: `#FFFFFF` surface with a `1px solid #E2E8F0` border and an ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Dropdowns, Popovers & Context Menus)**: `#FFFFFF` surface with a `1px solid #CBD5E1` border and an extended diffuse shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Command Palettes)**: `#FFFFFF` surface accompanied by a darkened backdrop scrim (`#0F172A` at 45% opacity) and an elevated shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.

## Shapes

The interface employs the "Soft" corner architecture (`0.25rem` / `4px` baseline) to maintain a disciplined, architectural feel suited for data-dense corporate tools.

### Geometry Specifications
- **Controls & Form Fields**: `rounded` (4px) for text inputs, select boxes, and basic standard action buttons.
- **Cards, Panels & Data Containers**: `rounded-lg` (8px) for major structural bounding boxes, modals, and split-view cards.
- **Badges, Tags & Avatars**: Status pills use `rounded-full` (9999px) to establish immediate shape-level differentiation from interactive buttons and input rectangles.

## Components

### Buttons
- **Primary**: Background `#1E40AF`, text `#FFFFFF`, hover `#1D4ED8`, active `#172554`. Height: 36px (compact) / 40px (default). Internal padding: 16px horizontal. Font: `label-md`.
- **Secondary / Outline**: Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#334155`. Hover: background `#F8FAFC`, border `#CBD5E1`.
- **Ghost**: Background transparent, text `#64748B`. Hover: background `#F1F5F9`, text `#0F172A`.
- **Destructive**: Background `#E11D48`, text `#FFFFFF`, hover `#BE123C`.

### Status & Priority Badges
- Built as inline-flex items, height: 22px, padding: 2px 8px, `rounded-full`.
- Display a 6px solid colored circular indicator to the left of the label.
- Uses exact pairings defined in the functional color tokens (e.g., *Pendiente*: Amber text, Amber background container, Amber ring/border).

### Form Fields & Inputs
- Height: 36px. Border: `1px solid #E2E8F0`, background: `#FFFFFF`, border-radius: 4px.
- Focus state: Border `#2563EB`, paired with an outer box-shadow ring `0 0 0 2px rgba(37, 99, 235, 0.15)`.
- Error state: Border `#E11D48`, ring `0 0 0 2px rgba(225, 29, 72, 0.15)`.

### Incident Lists & Tables
- Sticky table headers with background `#F8FAFC`, bottom border `1px solid #E2E8F0`, text in `label-sm` with Slate 500 (`#64748B`).
- Table rows: Background `#FFFFFF`, height: 48px, bottom border `1px solid #F1F5F9`. Hover state: `#F8FAFC`.
- Interactive rows feature selected-state indicators via a 3px left border in `#1E40AF`.

### Incident Cards (Kanban / Board Mode)
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, border-radius: 8px.
- Visual top-cap or side-rail indicator displaying the incident's priority color.
- Spacing: 12px internal padding with dedicated slots for ticket ID (`#INC-XXXX`), title, priority pill, and assigned agent avatar.

### SLA Timer Widget
- Compact badge or countdown bar indicating time to breach.
- Visual transitions: Slate (`#64748B`) when >4 hours remaining, Amber (`#F59E0B`) when <1 hour, Rose (`#E11D48`) with subtle pulse animation when breached or <15 minutes remaining.