---
name: screenshot-ui-replica
description: Use when the user provides a UI screenshot, raster image, Figma image-only export, or visual mockup and asks to recreate, one-to-one replicate, restore, convert, generate, or extract HTML/CSS/React/Tailwind from it. This skill is for high-fidelity visual reconstruction from pixels when real design layers, DOM, or source CSS are unavailable.
---

# Screenshot UI Replica

## Goal

Recreate a UI screenshot as high-fidelity frontend code. Treat the screenshot as the visual source of truth, but be explicit that a raster image cannot reveal real CSS, DOM structure, component names, fonts, or image assets. The deliverable is a carefully estimated visual replica.

## Default Output

Prefer a self-contained `index.html` with embedded CSS unless the user requests React, Vue, Tailwind, or integration into an existing app. For projectless chats, write files under the current workspace. Avoid external dependencies unless they materially improve fidelity.

## Workflow

1. Inspect the screenshot dimensions and composition.
   - Identify canvas size, top-level regions, major x/y coordinates, widths, heights, gaps, colors, border radii, shadows, and typography.
   - If the screenshot has obvious desktop dimensions, use those as the primary fidelity target and add responsive behavior second.

2. State the fidelity boundary briefly.
   - Say that exact CSS cannot be extracted from pixels.
   - Commit to visual reconstruction using measured/estimated CSS.

3. Build the page in layers.
   - Start with global canvas/background.
   - Add fixed top navigation/header.
   - Add main panel/container.
   - Add content sections and controls.
   - Add decorative background shapes last.

4. Use coordinate-led CSS for one-to-one desktop matching.
   - Prefer explicit sizes for the screenshot target: fixed heights, max widths, grid tracks, and known gaps.
   - Use `box-sizing: border-box`.
   - Use `position: relative` plus pseudo-elements for decorative details.
   - Use real text content from the screenshot where readable.

5. Recreate visual details.
   - Typography: match approximate font family, weight, size, line-height, and color.
   - Borders: match width, radius, opacity, dash pattern, and inset borders.
   - Shadows: tune blur, spread, opacity, and y-offset.
   - Icons/logos: use CSS approximations for simple shapes; if exact fidelity matters, ask for or extract original image assets.
   - Background illustrations: approximate with low-opacity CSS shapes unless an actual asset is provided.

6. Validate and iterate.
   - Check that the file opens standalone.
   - If a browser tool is available, view or screenshot the result against the target viewport.
   - Tighten the largest visible mismatches first: canvas scale, main container position, column widths, vertical spacing, typography, then small icons.

## CSS Heuristics

- Match the screenshot's dominant viewport first. A common pattern:

```css
.page {
  min-height: 100vh;
  position: relative;
  background: #dfe9fb;
}

.shell {
  max-width: 1630px;
  min-height: 990px;
  margin: 27px auto 28px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.83);
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 704px) minmax(0, 704px);
  gap: 35px;
  justify-content: center;
}
```

- Use pseudo-elements for screenshot-only decorations:

```css
.dropzone {
  position: relative;
  background:
    linear-gradient(90deg, #cfd5df 50%, transparent 0) 0 0 / 18px 3px repeat-x,
    linear-gradient(90deg, #cfd5df 50%, transparent 0) 0 100% / 18px 3px repeat-x,
    linear-gradient(0deg, #cfd5df 50%, transparent 0) 0 0 / 3px 18px repeat-y,
    linear-gradient(0deg, #cfd5df 50%, transparent 0) 100% 0 / 3px 18px repeat-y;
}

.dropzone::before {
  content: "";
  position: absolute;
  width: 66px;
  height: 64px;
  left: -18px;
  top: 147px;
  border-radius: 0 50% 50% 0;
  background: #5047f8;
}
```

## When Assets Are Missing

If the screenshot contains logos, mascots, product photos, or custom icons:

- Use CSS approximations for a first pass.
- Tell the user exact matching requires the original raster/vector asset or a crop.
- Do not claim the CSS recreation is the original source.

## Response Pattern

After creating or updating files, keep the final response short:

- Link to the generated file.
- Summarize the fidelity improvements.
- Mention any remaining limits, especially missing original image assets or fonts.
