---
name: RemoteLens Field Index
colors:
  paper: '#F4F1E8'
  paper-raised: '#FBF9F3'
  paper-muted: '#EAE7DC'
  ink: '#18231E'
  ink-muted: '#4B5A51'
  ink-faint: '#68766E'
  line: '#C8CEC5'
  line-strong: '#909C93'
  pine: '#1B5B43'
  pine-strong: '#124430'
  pine-soft: '#D9E8DF'
  ochre: '#9A5A22'
  ochre-soft: '#F1E2D2'
  rust: '#9A3E32'
  rust-soft: '#F3DEDA'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 'clamp(3rem, 7vw, 6.75rem)'
    fontWeight: '500'
    lineHeight: '0.94'
    letterSpacing: '-0.045em'
  heading:
    fontFamily: Newsreader
    fontSize: 'clamp(2rem, 4vw, 3.75rem)'
    fontWeight: '500'
    lineHeight: '1.03'
    letterSpacing: '-0.025em'
  title:
    fontFamily: Instrument Sans
    fontSize: '1.5rem'
    fontWeight: '650'
    lineHeight: '1.25'
    letterSpacing: '-0.015em'
  body:
    fontFamily: Instrument Sans
    fontSize: '1rem'
    fontWeight: '430'
    lineHeight: '1.5'
    letterSpacing: '0'
  label:
    fontFamily: Instrument Sans
    fontSize: '0.75rem'
    fontWeight: '650'
    lineHeight: '1.25'
    letterSpacing: '0.08em'
  data:
    fontFamily: IBM Plex Mono
    fontSize: '0.8125rem'
    fontWeight: '450'
    lineHeight: '1.4'
    letterSpacing: '0'
rounded:
  sm: '0.25rem'
  DEFAULT: '0.375rem'
  md: '0.5rem'
  lg: '0.75rem'
  full: '9999px'
spacing:
  hairline: '1px'
  field-gap: '0.75rem'
  section-gap: 'clamp(4.5rem, 9vw, 9rem)'
  page-gutter: 'clamp(1rem, 4vw, 4.5rem)'
  content-max: '90rem'
---

# RemoteLens design system

## Stitch record

- **Project:** `projects/10358525635842427502`
- **Seed design-system asset:** `assets/702306032286958244`
- **Selected responsive design-system asset:** `assets/a11ebb7086aa4bad8209e3ecacacdae1`
- **Uploaded DESIGN.md screen:** `8481547125760297533`
- **Generated:** 2026-07-30

The uploaded design document was accepted by Stitch. Its conversion RPC rejected
the returned screen-instance argument, and the optional rich-theme update RPC
also rejected fields that were valid in generated output. The seed asset was
therefore created directly and used with explicit Field Index prompts. During
the mobile generation pass, Stitch materialized the complete responsive asset
`assets/a11ebb7086aa4bad8209e3ecacacdae1`, including the named palette,
Newsreader typography, compact radius, spacing, and mobile component guidance.
That later asset is the selected token reference.

## Direction — Field Index

RemoteLens should feel like a carefully edited field index: a warm paper
surface, exact typography, fine rules, and provenance annotations that resemble
research notes rather than marketplace badges. The memorable motif is the
**provenance rail**—a narrow vertical line and numbered source marks that connect
important job fields to their origin.

The product is for technical, agent-comfortable remote workers, public API
consumers, and people learning to install an Agent Skill. They need to scan
structured developer jobs, judge eligibility and freshness, inspect source
evidence, and understand that CV comparison remains on their own computer.

The tone is calm, trustworthy, editorial, and exact. Functional job rows are
dense; explanatory pages breathe. Hierarchy comes from typography, spacing,
rules, and alignment rather than card grids or decoration.

## Principles

1. **Evidence before persuasion.** Provenance, freshness, eligibility, and
   unknown values are visible at the point of use.
2. **A ledger, not a dashboard.** Job results are rows separated by rules, not a
   grid of floating cards.
3. **Structured, not searchable.** Filters are labeled exact controls in a
   native `GET` form. There is no keyword box or `q` parameter.
4. **Quiet confidence.** Pine is rare and reserved for actions, selected states,
   links, and focus. Ochre and rust are functional status colors only.
5. **Progressive enhancement.** Core routes, filters, navigation, disclosure,
   and pagination remain useful in server-rendered HTML without JavaScript.

## Color tokens

The dominant surface is warm `paper`; `paper-raised` is used sparingly for
controls and code examples. Neutrals carry a subtle green cast. No pure white,
pure black, gradients, transparency-heavy surfaces, or decorative colored
backgrounds are used.

| Role           | Token          | Value     | Use                              |
| -------------- | -------------- | --------- | -------------------------------- |
| Canvas         | `paper`        | `#F4F1E8` | Page background                  |
| Raised surface | `paper-raised` | `#FBF9F3` | Inputs, examples, selected rows  |
| Muted surface  | `paper-muted`  | `#EAE7DC` | Quiet grouping                   |
| Primary text   | `ink`          | `#18231E` | Headings and body                |
| Secondary text | `ink-muted`    | `#4B5A51` | Supporting copy                  |
| Hairline       | `line`         | `#C8CEC5` | Ledger separators                |
| Strong line    | `line-strong`  | `#909C93` | Control borders                  |
| Action         | `pine`         | `#1B5B43` | Links, primary actions, focus    |
| Action hover   | `pine-strong`  | `#124430` | Hover/active                     |
| Selected       | `pine-soft`    | `#D9E8DF` | Selected exact filters           |
| Stale/warning  | `ochre`        | `#9A5A22` | Stale and caution states         |
| Error/closed   | `rust`         | `#9A3E32` | Invalid filters and closed state |

Text/background and component-state combinations must meet WCAG AA. Status is
always conveyed with text and shape in addition to color.

## Typography

- **Newsreader** is used for the brand, hero, and editorial section headings.
  Its serif forms make the index feel authored rather than generated.
- **Instrument Sans** is used for navigation, controls, body copy, and job
  titles. Body copy remains at least `1rem`.
- **IBM Plex Mono** is reserved for timestamps, HTTP examples, source keys, and
  fixed identifiers. It is never the default “developer” body face.
- Body measure is capped at `65ch`; tabular numbers are enabled for salary and
  freshness data.
- The page uses a small five-step type scale with strong jumps, fluid display
  sizes, and fixed product-interface sizes.

## Layout and rhythm

- A fluid twelve-column page grid sits inside a `90rem` maximum width.
- Public/editorial sections use intentionally asymmetric spans and generous
  `section-gap` spacing.
- Job browse uses a two-column desktop layout: a narrow filter ledger and a
  flexible result ledger. At content-driven breakpoints, filters move above
  results and the advanced group uses native `<details>`.
- Job detail uses an eight-column reading area plus a four-column provenance
  rail. On small screens, provenance follows the relevant field group.
- The base spacing unit is `0.25rem`; vertical rhythm favors multiples of the
  body’s `1.5rem` line height.
- Cards are used only for truly bounded examples. Lists, methodology, and
  provenance rely on rules and whitespace.

## Shape and depth

- Controls use disciplined `0.375rem` corners. Large containers never become
  soft rounded rectangles.
- Tag/filter chips may use a compact `0.25rem` radius, not capsule pills.
- Depth is tonal: raised paper plus a hairline. There are no decorative shadows,
  glows, glass effects, or floating panels.
- The square RemoteLens mark is a simple cropped lens/registration symbol that
  remains legible in one color.

## Interaction and accessibility

- A visible skip link is the first focusable element.
- Every interactive target is at least 44×44 CSS pixels.
- Keyboard focus is a `2px` pine outline with `3px` offset and never relies on
  color alone.
- Hover styling is guarded by `(hover: hover)`; functionality never depends on
  hover.
- Motion is limited to `transform` and `opacity`, uses
  `cubic-bezier(0.16, 1, 0.3, 1)`, and is removed under
  `prefers-reduced-motion: reduce`.
- Filter controls have persistent labels, plain validation messages, and
  `aria-describedby` links.
- Navigation adapts to mobile with a native disclosure pattern; critical links
  are not removed.
- `viewport-fit=cover`, safe-area padding, 200% zoom, and horizontal overflow
  are part of responsive verification.

## Component notes

- **Job row:** A ledger row with company/source line, strong title, eligibility
  and employment facts, source marks, exact tags, salary when explicit, and a
  first-seen timestamp. Status labels are text, not dots alone.
- **Filter ledger:** Native form controls grouped into “Eligibility”,
  “Employment”, and a `<details>` section for exact advanced filters. “Apply
  filters” is the only primary action; “Clear all filters” is a text action.
- **Provenance rail:** Numbered source marks and thin connector rules pair field
  values with `source-stated`, `parsed`, or `normalized` origins.
- **Freshness block:** Provider-specific timestamps and cycle states. Never show
  a synthetic global “fresh” badge.
- **Code/API block:** Light paper-raised surface, strong border, copyable plain
  text, and a non-color label for request/response.
- **Empty state:** Names the active exact constraints and offers “Clear all
  filters”; it does not imply that broader text search exists.

## Screen selection

All selected screens were reviewed from their rendered screenshots on
2026-07-30. Screen dimensions below are Stitch export pixels; the mobile
concepts represent a 390 CSS-pixel viewport at 2× density.

| Family                  | Desktop screen                     | Mobile screen                      | Selected direction                                                                                        |
| ----------------------- | ---------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Home                    | `7f1d3ba2779b4f41a2b43da6c35df393` | `2ef768b1bcc141878aada42757bc3bc1` | Asymmetric hero, trust ledger, three-row index preview, stacked Skill/API explanation                     |
| Browse / filters        | `34920d7e583048f78ada364e171391c5` | `e9e4240ae3884377a73183d71254684c` | Desktop filter/result ledger; mobile result-first layout with disclosure filters and full-width rows      |
| Job detail / provenance | `b31863ec9613445faeb57bbce1b5103f` | `db811e0c81624e19877b69b84e60e8a3` | Desktop four-column provenance rail; mobile inline evidence blocks beside each field group                |
| Sources / methodology   | `e107b0b0e486467291f3e9a4da02b330` | `3bb48dfc0b424c30a48fbd0d7385e19a` | Provider ledgers plus numbered lifecycle method; mobile keeps every safeguard in a readable single column |
| API / Agent Skill       | `2d9d779aabbc43da8285da3718e3fb5c` | `153998184f9a4f60b8b6420356b5b558` | Sticky/section navigation, structured-filter table, restrained examples, local-CV safety block            |

### Review decisions

Selected:

- Ledger rules and whitespace replace generic card grids.
- The provenance rail is the signature pattern.
- Newsreader supplies the editorial voice; Instrument Sans handles product UI;
  IBM Plex Mono is limited to identifiers, code, and timestamps.
- Browse is explicitly structured-filter-first with no keyword control.
- Mobile adapts composition: filters become disclosure content and provenance
  moves inline rather than disappearing.
- Provider freshness remains source-specific.

Rejected from generated copy or chrome:

- Stitch placed **Post a Job** in two desktop concepts. RemoteLens has no
  employer posting; this control must never be implemented.
- Generated mobile documentation invented `pip install`, LangChain, and other
  installation commands. Phase 0 documentation must label installation as a
  preview and must not invent a published package.
- Generated dark code panels are replaced by `paper-raised` examples with a
  strong rule so the implementation stays inside the paper system.
- Generated example roles are illustrative only. Repository fixtures remain
  sanitized, deterministic, and aligned with the developer-only cohort.
- The generated logo prompt inherited unrelated orange/dark metadata from the
  connector. The implementation uses a one-color pine registration/lens mark
  and does not inherit those unrelated tokens.
