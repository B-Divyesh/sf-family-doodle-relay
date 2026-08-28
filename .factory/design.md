# Family Doodle Relay — visual thesis

## Direction

**Monochrome typographic broadsheet.** The shared drawing is treated as the lead story in a small family newspaper. Heavy rules, numbered editions, narrow utility type, and generous newsprint margins make each relay feel worth keeping. The interface stays calm and handmade; it avoids arcade colour, confetti, and generic software cards.

## Palette

- `ink` `#171714`: primary text, rules, and controls.
- `paper` `#F5F0E5`: warm newsprint background.
- `sheet` `#FFFDF7`: drawing surface and raised paper.
- `soft-ink` `#5A5850`: secondary text (7.0:1 on paper).
- `press-red` `#9C2F24`: the single editorial accent for live state and focus (6.6:1 on paper).
- `wash` `#DED8C9`: dividers and inactive areas.
- `success` `#315C41`; `danger` `#8C251E`; both paired with text or symbols, never used alone.

This is an intentionally single light treatment. It recreates physical newsprint and gives the white canvas a distinct layer. The paper colour is always painted explicitly.

## Type

- Display: Georgia, Times New Roman, serif. Oversized, tightly led, editorial, and available without a network request.
- Utility and body: Arial, Helvetica, sans-serif. Clear at phone sizes and visually distinct from the headline.
- No font files or third-party requests. Tabular figures are used for codes and timers.

Scale: 14 / 16 / 20 / 28 / clamp(44–82) px. Body stays at 17 px. Paragraphs remain under 65 characters.

## Spacing and shape

An 8 px base unit drives all spacing. Sections use 64–112 px vertical gaps. Dense room tools use 8–24 px gaps. Corners stay nearly square (0–4 px) like clipped paper. Buttons use solid ink or ruled paper, with 48 px minimum height. Cards appear only for independent newspaper columns or turns.

## Interaction grammar

- Primary actions are black press blocks with short verb labels.
- State changes read like a printing press: a thin red line sweeps once across the new panel.
- Room codes use grouped, large tabular type and a copy action.
- The active player owns the canvas; the partner sees the same strokes immediately.
- Drawing tools are labelled and usable by touch, pointer, or keyboard. Undo and clear are explicit.
- Destructive host actions name their effect and require confirmation.

## Motion policy

Route and turn changes use a 220 ms opacity/vertical reveal. The active-turn rule sweeps once over 500 ms. Strokes themselves never animate after they are drawn. Under `prefers-reduced-motion: reduce`, reveals and sweeps are removed and state changes are instant. Nothing loops or flashes.

## Asset plan and provenance

The hero uses one original AI-generated monochrome editorial still-life: two hands at opposite edges passing a folded strip containing a playful unfinished doodle. It explains remote cooperation without showing a literal app screen. No readable text is embedded. The image is cropped for wide social preview and responsive web use.

Prompt sheet: “Monochrome editorial newspaper engraving, overhead view of two different human hands entering from opposite page edges and passing a folded accordion paper strip, the strip holds a simple whimsical unfinished doodle of a house becoming a friendly whale, black India ink, warm ivory newsprint, bold halftone and crosshatch texture, 1930s broadsheet illustration composition, quiet family play, generous negative space, imperfect handmade line, no text, no letters, no watermark, no logos, no brands, no colour, no extra fingers, no distorted anatomy.”

Negative list: readable words, logos, colour gradients, glossy 3D, photoreal faces, copyrighted characters, screens, extra fingers, malformed hands.

Generation: Azure AI Foundry image generation through `/opt/fleet/lib/gen-image.sh`, model deployment `factory-image`, generated 2026-08-28. Generated work is original for this product. Source PNG and prompt sidecar live in `assets/src/`; optimized WebP and social crop ship in `frontend/public/`.

Hand-authored SVG marks (favicon and small doodle motifs) use only original geometric strokes and the palette above.
