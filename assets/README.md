# assets

Empty on purpose. No image files ship with this build.

Every image on the site is a placeholder box for now. In mockup mode it renders as a soft grey
box with a label. In wireframe mode it renders as a grey box with an X and the same label. The
markup is:

```html
<div class="ph ph--16x9">
  <span class="ph__label">[PLACEHOLDER: what this image is]</span>
</div>
```

Ratio classes: `ph--16x9`, `ph--4x3`, `ph--square`, `ph--tall`.

## What is needed

| Asset | Where | Notes |
|---|---|---|
| Brand mark | Header, footer | The PL mark as SVG. A text mark stands in. |
| Favicon set | All pages | Not wired up yet. |
| Hero image | Home, nutra, peptides, kratom | One per page. No coin imagery, no pill imagery, no glow. |
| Supporting images | Sections across the site | Count is set when each page is built. |
| Open Graph image | All pages | One per page, 1200 by 630. |

## Rules for anything that lands here

- No card network logos or marks: no Visa, Mastercard, Amex or Discover imagery.
- No partner bank or acquirer logos.
- No stock photography of pills, capsules, vials, syringes or anything that reads as human use.
- No gradients and no glow, per the design direction.
- Alt text follows the copy rules: no em dashes, no en dashes, no invented facts, no claims.
- File naming: lowercase, hyphen separated, page first, for example `nutra-hero.webp`.
- Ship an SVG where the asset is a mark or a diagram, a WebP where it is a photograph.
