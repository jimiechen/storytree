---
name: ProseFlow AI
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d5e3fd'
  on-surface: '#0d1c2f'
  on-surface-variant: '#494454'
  inverse-surface: '#233144'
  inverse-on-surface: '#ebf1ff'
  outline: '#7b7486'
  outline-variant: '#cbc3d7'
  surface-tint: '#6d3bd7'
  primary: '#6b38d4'
  on-primary: '#ffffff'
  primary-container: '#8455ef'
  on-primary-container: '#fffbff'
  inverse-primary: '#d0bcff'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#0058be'
  on-tertiary: '#ffffff'
  tertiary-container: '#2170e4'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0d1c2f'
  surface-variant: '#d5e3fd'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.8'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.7'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for a sophisticated AI-assisted literary environment. It balances the creative fluidity of novel writing with the technical precision of artificial intelligence. The aesthetic is **Corporate Modern** with a lean towards **Minimalism**, ensuring that the user's content remains the focal point while the interface provides a calm, high-performance workspace. 

The target audience consists of professional web-novelists and hobbyist writers who require a distraction-free yet powerful dashboard. The emotional response is one of clarity, reliability, and creative spark, achieved through ample whitespace, refined typography, and purposeful splashes of vibrant color.

## Colors

This design system utilizes a structured palette to differentiate between UI stability and AI dynamism:

- **Primary (Vibrant Purple):** Reserved for primary actions, active AI states, and brand-heavy elements like progress badges.
- **Secondary & Tertiary (Orange/Blue/Green):** Used exclusively for semantic categorizations such as "Character Profiles," "Plot Outlines," and "World Building" tags to provide quick visual scanning.
- **Background & Surface:** A layered approach using a light gray base with pure white surfaces to create a clear "Sheet" metaphor for the writing environment.
- **Text:** High-contrast deep charcoal (#1E293B) for maximum readability of Chinese characters, with a muted slate (#64748B) for metadata and placeholder text.

## Typography

The typography system prioritizes **Chinese Readability**. While the design system tokens utilize *Plus Jakarta Sans* and *Work Sans* for Latin characters and numerals, the system must fallback to **PingFang SC** (macOS/iOS) and **Microsoft YaHei** (Windows) for all Chinese text.

- **Line Height:** For the "Body" roles, a generous line height (1.7 to 1.8) is critical to prevent fatigue during long-form reading and writing of dense Chinese characters.
- **Weight:** Use Semi-Bold for headings to provide clear structural hierarchy against the lighter background.
- **Scale:** On mobile devices, `headline-lg` should scale down to 24px to ensure titles do not wrap excessively.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a sidebar-content structure typical of professional SaaS platforms.

- **Sidebar:** Fixed width at 260px for desktop, collapsible to an icon-only rail (72px).
- **Dashboard Grid:** A 12-column system. Cards typically span 3 columns for metrics, 6 columns for recent drafts, and 12 columns for the primary text editor.
- **Spacing Rhythm:** Based on a 4px baseline. Use `16px (md)` for standard internal card padding and `24px (lg)` for vertical spacing between sections.
- **Breakpoints:**
  - Mobile: < 768px (Single column, 16px margins).
  - Tablet: 768px - 1280px (2-column cards, reduced margins).
  - Desktop: > 1280px (Full 12-column grid, 40px margins).

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a focused hierarchy.

- **Level 0 (Background):** Light Gray (#F5F5F5), flat.
- **Level 1 (Cards/Navigation):** White (#FFFFFF) with a very soft, diffused shadow: `0 2px 12px rgba(0, 0, 0, 0.04)`. This creates a subtle "lift" without adding visual clutter.
- **Level 2 (Hover/Active):** When a user interacts with a card, the shadow intensifies to `0 8px 24px rgba(0, 0, 0, 0.08)` to provide tactile feedback.
- **Outlines:** Use a 1px solid border (#E2E8F0) on input fields and buttons to maintain definition against the white surfaces.

## Shapes

The shape language is friendly yet professional. 

- **Standard Elements:** Buttons, cards, and input fields utilize an **8px** (0.5rem) radius.
- **Large Containers:** Modals and feature "Hero" cards use a **16px** (1rem) radius.
- **Interactive Small Elements:** Search bars and tags (chips) utilize a **Pill-shape** (full round) to distinguish them from structural content containers.

## Components

### Buttons
- **Primary:** Purple background, white text. 8px border radius. Solid fill for main actions (e.g., "Start Writing").
- **Secondary:** White background, 1px border (#E2E8F0), purple text. Used for auxiliary actions (e.g., "Save Draft").

### Cards
- Pure white background. Subtle 1px border. 12px border radius. Use internal padding of 24px for desktop.

### Input Fields
- Soft gray background (#F8FAFC) when inactive, transitioning to a white background with a Purple border-stroke on focus.

### Navigation
- Sidebar items use a "Ghost" style (no background) with a 4px purple vertical indicator line on the left side of the active item.

### AI Floating Toolbar
- A unique component for the editor: A glassmorphic (frosted glass) pill-shaped bar that floats above the text, providing AI suggestions, thesaurus lookups, and character-consistency checks.

### Chips/Tags
- Small, rounded containers with low-opacity background colors matching the category (e.g., a Light Blue background with Dark Blue text for "Setting").