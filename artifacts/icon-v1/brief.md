# RemoteLens icon v1

## Brief

- Product: RemoteLens, a public remote developer-job index with visible source
  evidence.
- Audience: remote developers, job seekers, and local AI agents.
- Benefit: focused, trustworthy job discovery without ads, login, or CV upload.
- Approved metaphor: the existing centered lens/crosshair mark.
- Personality: calm, precise, technical, and trustworthy.
- Palette: ink `#17211D`, warm white `#F4F1E8`, paper `#F7F8F7`.
- Avoid: text, magnifying-glass handles, eyes, pins, briefcases, sparkles,
  robots, gradients, shadows, and competitor compositions.
- Platforms: browser favicon, Apple touch icon, and PWA icon matrix.

## Source decision

The existing product mark in `src/components/brand-mark.tsx` is the geometry
source of truth. A GPT Image master sheet was requested once, but it introduced
gradients, shadows, and proportion changes, so it was rejected rather than
shipped or regenerated. Final exports use deterministic SVG geometry matching
the approved product mark.

## GPT Image request

- Workflow: direct one-off
- Timestamp: 2026-08-01 Asia/Shanghai
- Requested format: high-quality PNG
- Requested dimensions: 3072 × 1024
- Returned dimensions: 1880 × 836
- Chroma key requested: `#FA00DA`
- Result: rejected by structural review
- Preserved source:
  `source/generated-master-rejected.png`
- Original tool output:
  `/Users/windht/.codex/generated_images/019fb989-87b0-7901-93f8-9b3d9a08e57b/call_OYUF0nYqGXVBsGhEfsHiePpQ.png`
