---
name: Syntactic Architecture
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464553'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777584'
  outline-variant: '#c8c4d5'
  surface-tint: '#544fc0'
  primary: '#1f108e'
  on-primary: '#ffffff'
  primary-container: '#3730a3'
  on-primary-container: '#a9a7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4e45d5'
  on-secondary: '#ffffff'
  secondary-container: '#6860ef'
  on-secondary-container: '#fffbff'
  tertiary: '#242c40'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b4257'
  on-tertiary-container: '#a7afc8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3b35a7'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#372abf'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Epilogue
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Epilogue
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Epilogue
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Epilogue
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  body-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.06em
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system adopts an avant-garde, developer-grade aesthetic calibrated for complex developer tools, analytical orchestrators, and high-density productivity environments. The personality is uncompromisingly precise, functional, and hyper-structured. It rejects decorative softness in favor of engineered purity, structural framing, and deliberate typographic tension between geometric humanism and monospaced discipline.

The visual direction blends zero-radius brutalist modularity with refined technical craft. Layouts communicate absolute certainty through visible tectonic seams, technical data matrices, and architectural framing. Every element exists inside a strict geometric bounding box, offering power users an environment that feels like an advanced command terminal fused with a premier editorial publication.

## Colors

The palette centers on a commanding deep indigo seed (`#3730a3`), creating high-authority focal points without falling into generic SaaS blues. Contrast is calibrated for extended optical comfort under crisp light mode:

- **Primary (`#3730a3`)**: Anchors primary interactive mechanisms, active state indicators, and decisive callouts.
- **Secondary (`#4338ca`)**: Serves as a vibrant supporting tonal step for hover transitions, selected node fills, and focused borders.
- **Tertiary (`#0f172a`)**: A near-black slate used for high-emphasis headlines, structural dividers, and monospaced code markers.
- **Neutral (`#64748b`)**: Controls secondary data keys, metadata timestamps, inactive borders, and structural framing.

Background surfaces rely on stark, architectural light steps: pure canvas `#ffffff` offset by cold technical base coats (`#f8fafc` and `#f1f5f9`), framed by surgical 1px borders rather than diffuse tonal drop-offs.

## Typography

The typographic hierarchy establishes deliberate friction between expressive geometric form and strict computational order. 

- **Display & Headlines (`Epilogue`)**: High-character, tight tracking, and heavy weights inject sculptural authority into page titles, major module headings, and metric counters.
- **Body & Data (`JetBrains Mono`)**: Provides programmatic rhythm, tabular consistency, and supreme legibility across logs, complex tabular views, and interactive controls.
- **Labels & Microcopy (`JetBrains Mono`)**: Styled with uppercase treatment, generous character spacing, and medium/bold weights to emulate hardware labels and instrument readouts.

## Layout & Spacing

Layouts follow a strict, visible 12-column architectural grid with deterministic mathematical proportions. Column divisions align directly with 1px border intersections, producing an authentic CAD or IDE aesthetic.

- **Grid Strategy**: Fluid 12-column system bound to a 1440px desktop frame with 1.5rem (`gutter`) gutters and 2rem (`margin`) canvas margins.
- **Responsive Adaptations**:
  - **Desktop (1024px+)**: Full 12-column matrix with persistent left dock navigation, nested pane splits, and structured utility sidebars.
  - **Tablet (768px - 1023px)**: Condenses to an 8-column model; sidebar collapses into an icon ribbon; secondary metrics stack.
  - **Mobile (<768px)**: 4-column flow with continuous horizontal-scroll container rows and rigid full-width card stacks. Margins and gutters lock to 1rem.
- **Spatial Rhythm**: All component spacing obeys a 4px modular base scale (`0.25rem` intervals), maintaining strict structural density across data lists, toolbars, and inspection cards.

## Elevation & Depth

This design system avoids blurred, atmospheric drop shadows entirely. Depth is achieved strictly through **tectonic borders**, **crisp linear offsets**, and **surface tonal nesting**:

- **Level 0 (Base Canvas)**: Background flat tint (`#f8fafc`).
- **Level 1 (Card & Module Shells)**: Pure white (`#ffffff`) surfaces defined by hard 1px solid outlines (`#e2e8f0`).
- **Level 2 (Popovers, Tooltips & Dropdowns)**: Hard structural drop: a sharp 1px border coupled with an unblurred offset silhouette: `box-shadow: 3px 3px 0px 0px #0f172a`.
- **Level 3 (Modals & Command Palettes)**: Foreground card with hard offset silhouette: `box-shadow: 6px 6px 0px 0px #0f172a`, rendered above a high-contrast scrim overlay (`rgba(15, 23, 42, 0.4)`).

## Shapes

The shape system strictly enforces a **0px radius across every UI element**. 

Buttons, cards, tabs, modal viewports, dropdown triggers, and status badges are rendered with razor-sharp 90-degree corners. This pure orthogonal geometry reinforces the developer-grade architectural concept, treating every element on screen as an interlocking tile within a computational frame.

## Components

### Buttons
- **Primary**: Solid background `#3730a3`, text `#ffffff`, zero radius, 1px border `#3730a3`. On hover: `#4338ca` with a 2px 2px 0px `#0f172a` hard offset shadow. Active: pressed flat with no offset.
- **Secondary**: Surface `#ffffff`, text `#0f172a`, 1px solid border `#cbd5e1`. On hover: surface `#f1f5f9` with border `#0f172a`.
- **Destructive**: Transparent surface, border 1px solid `#b91c1c`, text `#b91c1c`. On hover: background `#fef2f2`.

### Chips & Badges
- Monospaced 0.6875rem uppercase labels (`JetBrains Mono`). Zero radius.
- Padding: 2px 6px.
- Status variants utilize 1px solid borders with muted pastel fills:
  - *Active/Healthy*: Border `#86efac`, fill `#f0fdf4`, text `#166534`.
  - *Warning*: Border `#fde047`, fill `#fefce8`, text `#854d0e`.
  - *System/Neutral*: Border `#e2e8f0`, fill `#f8fafc`, text `#475569`.

### Input Fields & Controls
- **Text Inputs**: Flat `#ffffff` surface, 1px solid `#cbd5e1` outline, `JetBrains Mono` 0.875rem. Focus state shifts border directly to 2px solid `#3730a3` without outer glow rings.
- **Checkboxes & Radios**: Absolute square geometries (0px radius for both checkboxes and radio selectors). Inactive state: 1.5px solid `#94a3b8` frame. Checked state: solid `#3730a3` fill with high-contrast sharp white geometric checkmark or nested square dot.

### Cards & Panels
- Pure white background, razor-sharp 1px border `#e2e8f0`.
- Card headers feature an explicit bottom partition line (`border-bottom: 1px solid #f1f5f9`) accompanied by small-caps monospaced category tags and bold `Epilogue` titles.

### Lists & Data Tables
- Row cells demarcated by horizontal hairline separators (`#e2e8f0`).
- Header cells styled in uppercase `JetBrains Mono` label format with sort glyphs.
- Row hover triggers an immediate solid background shift to `#f8fafc` without transition delays.