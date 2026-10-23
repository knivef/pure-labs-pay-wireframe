# Pure Labs Pay marketing site: wireframe and clickable mockup

This repo is an HTML/CSS wireframe and clickable mockup for the Pure Labs Pay marketing site.
It is a reference build. The team uses it as the spec for the production site, so structure,
copy and annotations matter more than polish.

Read this file in full before writing or editing anything in this repo. Every rule below is a
hard rule unless it says otherwise.

## 1. Brand and config

- BRAND_NAME: Pure Labs Pay.
- BRAND_NAME lives in exactly one place: the config object in `js/main.js`. Every visible
  instance of the brand name in the HTML is rendered from it or marked up so a rename is one edit.
  Never hardcode the brand name in CSS, in meta titles that cannot be scripted without a note,
  or in copy without flagging it.
- Existing brand record in the team's other repo (`payment-brand-graphics/shared/brands.json`,
  slug `pure-labs`): mark PL, domain purelabspay.com, accent #1d63d1, accent foreground #ffffff,
  accent ink #1d63d1, accent ink dark #3478e3.
- The team's design system supersedes the earlier accent question. Neither the brand record blue
  nor a lab green is the button colour: filled public buttons are Ink #151515, and the
  institutional green, Network Green #29735c, is reserved for the mark, the payment rail
  connector lines and small infrastructure markers. The mark stays PL, now a green square with
  paper lettering in the monospace face.
- Resolved: this site is payment processing, and nutra is the rollout priority. The
  `tagline` and `sells` fields in that brand record still describe pre-screening and vetting, so
  they are stale. Take tokens from the record, never copy. Updating the record itself is a job for
  the `payment-brand-graphics` repo, not this one.

### What it is

A payment processing brand for lab and wellness commerce. Merchant accounts and card processing for:

| Category | Status |
|---|---|
| Nutra and supplements | Live now. The rollout priority. |
| RUO peptides | Coming soon, waitlist |
| Kratom | Coming soon, waitlist, United States only, in supported states |

Processing is delivered through partner acquiring banks.

### Rollout priority

Nutra is the category we are rolling out. It is the only one a merchant can apply for today, so it
carries the weight of the site:

- Home leads with nutra. The nutra page is the deepest page and the one every primary call to
  action feeds into.
- RUO peptides and kratom are coming soon. Their pages exist, stay indexable and collect a
  waitlist. They never imply a merchant can apply for them now.
- On the peptides and kratom pages the page level primary action is "Join the priority list",
  anchored to that page's form. "Get my custom rate" still appears in the nav and footer on every
  page, so the nutra apply path is never more than one click away. This is the one place where the
  site wide primary call to action gives way to the waitlist call to action.
- Peptides are written as "peptides" across the site, which is the team's settled choice and
  matches the primary keyword. The research use framing is carried by the copy itself, for
  example a research use only sales model, research products and a research-use-only label, not
  by prefixing the word. Copy rule 5 holds the substance: no human use, no dosing, no outcomes.

### Design system

The visual system comes from the team's style reference, a treasury ledger on graph paper: a
white operating sheet, hairline rules, dark ink carrying the hierarchy, pale ice panels holding
contained stories, a deep forest band closing the page, and colour kept back for the mark, the
rail diagrams and the monospace labels. Source files handed over: `tokens.json`,
`variables.css`, `theme.css` and `DESIGN.md`.

- The raw palette and scale sit at `:root` in `css/styles.css` under the names the handoff uses.
  Components never read those directly. A semantic layer, declared once per display mode, maps
  them, so a token swap happens in one place and the wireframe mode cannot pick up a brand colour.
- Surfaces by level: Paper for the canvas and the navigation, Ice Panel for contained story and
  problem panels, Plum Ledger for contrasting feature cards, Forest Ledger for the footer band.
  Mint Subscription stays unused unless a footer subscribe control is ever added, since the
  reference confines it to newsletter-style footer controls.
- Do not round the inputs, do not shadow the ice or plum cards, do not set the display face above
  weight 450, do not colour body copy with the green or the brown, and do not replace the grid and
  connector hero visual with floating tiles.
- [CONFIRM: the reference was extracted from a named third party site, Modern Treasury. Treating
  it as a style reference is normal practice, but the team should confirm how close to that visual
  language this brand wants to sit.]

### What it is not

We are not a bank and we are not an acquirer. Never describe the company as a bank, an acquirer,
or a licence holder. Never name a partner bank or acquirer in marketing copy. The footer
disclosure is the single exception: it names the entity that provides processing, because that
is a disclosure a merchant is entitled to before applying. It carries a placeholder until the
team supplies the name, and nothing else on the site names a partner.

### Markets

Markets: global. Merchants in the United States, Canada, the UK, the EU, Australia and other
supported regions [CONFIRM: supported countries]. Kratom is US only, in supported states.

Settlement: in fiat (major currencies) or crypto (stablecoins). [CONFIRM: currencies, stablecoins
and networks]

## 2. Audience

Established online sellers on Shopify, WooCommerce and custom stores that already take card
payments, have been shut down or squeezed by mainstream processors, and want a processor that
understands their category. Readers are owners, founders, ops leads and finance leads.

Write for someone who has already lost an account once and does not want to lose another.

## 3. Positioning

One line: Payment processing for nutra, peptide and kratom brands that want to stay processing.

Pillars, in this order:

1. Built for your category: underwriting that knows supplements, peptides and botanicals.
2. Stability first: dispute and fraud tools that keep you under card network thresholds.
3. Pricing built around your history: a custom rate based on your recent statements.
4. A real team: one named contact from application to scale.

## 4. Rule A: terms are never published

Never publish commercial terms anywhere on the site. That means no rates, no percentages, no
reserves, no rolling reserve periods, no limits, no setup fees, no approval times and no contract
lengths. No pricing calculators, no pricing tables, no "from X%" teasers, no example numbers,
not even as placeholder text in a mockup.

Allowed phrases, use these instead:

- "custom rate"
- "pricing built around your processing history"
- "flexible terms for proven brands"
- "you see every term before you sign"

Calls to action, site wide:

| Role | Label | Target |
|---|---|---|
| Primary | Get my custom rate | `apply.html` |
| Secondary | Talk to underwriting | `contact.html` |
| Waitlist | Join the priority list | anchor to the form on that page |

Use these exact labels. Do not invent variants.

## 5. Rule B: lead first

Rule B: Lead first. Merchant processing history is required, but we qualify internally after
capturing the lead.

- Public pages signal history lightly, only in: "Switching processors? We'll build your rate
  around your history." and the pillar "Pricing built around your history".
- Public pages never list documents or statements, never imply a long application, document checks
  or a minimum history.
- Never write "processing history required", "no startups", "minimum X months".
- Two-stage forms. The public lead form (apply page and both priority lists) has 5 fields: name,
  work email, website, what they're looking for, monthly volume. No qualifying questions. The team
  qualifies leads internally, then sends the private full application.
- In the private application, if someone isn't processing payments yet, show a soft message, never
  a decline: "We work best with brands that already have a processing track record. Leave your
  details and we'll reach out when we have a fit."

## 6. Tone

Calm, clinical, confident. Plain English. Short sentences. No hype, no exclamation marks, no
growth-marketing voice. It should read like a specialist underwriter wrote it, not a broker.
Speak to people who have been burned before: acknowledge it plainly, do not dramatise it.

## 7. Copy rules

These are non-negotiable and apply to body copy, headings, buttons, form labels, error messages,
HTML comments, data-note annotations, meta titles, meta descriptions and alt text.

1. No em dashes and no en dashes, anywhere. Use commas, colons, full stops or hyphens.
2. Never invent facts. No statistics, merchant counts, volumes, logos, testimonials, partner names,
   ratings, awards or case studies. The footer disclosure is the one place a partner is named at
   all, and only from a name the team supplies. Where a real fact is needed, write a visible
   `[PLACEHOLDER: description]` in the page and log it in `PLACEHOLDERS.md`. Where something needs
   a decision or sign-off, write `[CONFIRM: description]` and log it the same way.
3. No card network logos or marks: no Visa, Mastercard, Amex or Discover imagery. Plain text
   references only, and only where they are necessary.
4. Banned words and phrases: guaranteed approval, guaranteed, no reserve, no reserves, instant
   approval, anonymous, no KYC, offshore, bank (as a description of us), cure, treat, heal,
   FDA approved, best rates, lowest rates, zero fees.
5. Peptide copy never implies human use of a research product, never mentions dosing, never
   claims a health outcome, and never uses patient facing wording. Research products are
   described as research products, and the research use framing stays visible on the page.
   One channel is named on purpose: a licensed telehealth or compounding model, with licensed
   prescribers, which the team is underwriting as a separate sales model. It is described only as
   a channel, never with dosing, outcomes or patient facing claims, and it carries a CONFIRM until
   the partner confirms it. The short form "peptide" is the team's chosen wording for headings,
   navigation and keywords, since the primary keyword is peptide merchant account.
6. Kratom copy never makes a health claim. It never mentions 7-OH except to say it is not supported.
7. Every call to action sits with a trust line. Examples: "Every term shown before you sign." or
   "Your details go only to our underwriting team."
8. `showTestimonials` is false. No testimonial markup ships enabled.

## 8. Pages

| Path | Page | Notes |
|---|---|---|
| `index.html` | Home | |
| `nutra.html` | Nutra and supplement processing | Live |
| `peptides.html` | RUO peptide processing | Coming soon, waitlist |
| `kratom.html` | Kratom processing | Coming soon, waitlist, United States only |
| `apply.html` | Get my custom rate | 5-field lead form |
| `contact.html` | Talk to underwriting | |
| `onboarding/application.html` | Full merchant application | Private, link sent after vetting |
| `onboarding/invite.html` | Internal: create the private application link for a vetted lead | Private |
| `legal/terms.html` | Terms | |
| `legal/privacy.html` | Privacy | |
| `legal/acceptable-use.html` | Acceptable use | |
| `legal/restricted-regions.html` | Restricted regions | |

## 9. SEO map

| Page | Primary keyword | Secondary keywords |
|---|---|---|
| Home | high risk payment processor for supplements | high risk merchant account, high risk payment processor with crypto settlement, high risk merchant account USA, high risk merchant account Canada, high risk merchant account UK |
| Nutra | nutra merchant account | nutraceutical merchant account, supplement merchant account, supplement payment processing, nutra payment processing with crypto settlement |
| Peptides | peptide merchant account | peptide payment processing, peptide payment gateway, research peptides payment processor |
| Kratom | kratom merchant account | kratom payment processing, kratom credit card processing, kava merchant account |

Rules:

- The primary keyword appears in the H1 or the first paragraph, in the meta title, and in at least
  one H2.
- One H1 per page.
- Coming-soon pages stay indexable. No noindex on peptides or kratom.
- The peptide keywords stay as written, because that is what merchants search. The visible
  label is still RUO peptides, so put the keyword in the H1, meta title and an H2 in a form
  that reads as research use only, for example "RUO peptide merchant account". The bare
  keyword may appear once in the meta title if the longer form will not fit.
- Secondary keywords go in H2s, body copy or meta descriptions where they read naturally. Never
  stuff them.

### Technical SEO

- Every page carries a unique title and meta description, a canonical, Open Graph and Twitter
  tags, and exactly one H1 with no skipped heading levels. The audit script that checks keyword
  placement and heading order is not in the repo: rerun it from the step that added it, or check
  by hand with the table above.
- The domain is a placeholder in six places: every canonical, the Open Graph and Twitter URLs and
  images, `sitemap.xml`, `robots.txt`, `llms.txt`, and `SITE_BASE` in `js/main.js`. Replace all of
  them together.
- Structured data is generated in `js/main.js` and injected into the head: Organization on every
  page, Service on the three category pages (`Payment processing`, US and CA, US only for kratom),
  FAQPage on the home and category pages, and BreadcrumbList on every page but the home page. The
  FAQ nodes are read from the visible text so the page and the markup cannot disagree, which also
  means an unresolved placeholder in an answer ends up in the structured data: the build logs a
  console warning when that happens. Production should render the same objects server side.
- `llms.txt` describes the business, the categories and their status, the markets, what we do not
  process, how to apply and how to reach us. It carries no rates and no terms, the same rule as
  the rest of the site.
- Every visual carries a text equivalent. Decorative icons take `aria-hidden="true"` and sit next
  to real text, a graphic that carries meaning on its own takes `role="img"` and an `aria-label`,
  and every mock up carries a visible caption that says plainly what it shows and that the data is
  sample data. Real images, when they land, follow the alt text rules in `assets/README.md`.

## 10. Build rules

- Static HTML, one stylesheet at `css/styles.css`, one small vanilla JS file at `js/main.js`.
- No frameworks, no build step, no package manager, no bundler.
- `js/main.js` loads as a classic script, never a module. ES modules are blocked when a page is
  opened straight from the filesystem.
- Shared chrome is rendered by `js/main.js`, not duplicated in the markup. Every page carries
  `<div id="site-header">` and `<div id="site-footer">`, each holding a `noscript` link list so
  the site stays navigable with scripting off. Repeatable blocks mount the same way through
  `data-block`, currently `final-cta` and `trust-strip`, and a page overrides the closing band's
  wording with `data-heading` and `data-text`. Pages under `legal/` set `data-prefix="../"` on
  `body`, and every injected link is built from that, so nothing depends on a server root.
- Four faces, per the design system: mt-neue-display for the hero and major section headings at
  weight 450, mt-neue-text for section and feature headings at 400, mt-sans for navigation, body,
  controls and footer lists at 330 to 600, and mt-mono for technical eyebrows and diagram
  annotations at 500. All four are licensed faces we do not hold, so each stack names the face
  first and then the substitute the reference gives: Manrope for the two neue cuts, Inter for the
  sans, IBM Plex Mono for the mono. The web font link sits commented out in every page so the
  build makes no external request. Wireframe mode drops to the system sans, keeping only the
  monospace, so technical labels still read as technical in greyscale.
- It must open by double-clicking `index.html` from the filesystem. So: relative links only, no
  leading-slash paths, no external requests, no CDN scripts, no web fonts, no analytics. Pages in
  `legal/` link back up with relative paths.
- Two display modes, set as a data attribute on `body`:
  - `data-mode="wireframe"`: greyscale, boxed image placeholders, system font.
  - `data-mode="mockup"`: brand tokens. This is the default.
  - A `?mode=` URL parameter switches modes and persists while clicking through the site.
- Annotation layer: every section carries a `data-note` attribute covering intent, SEO target and
  dev notes. Notes are visible only with `?notes=1`.
- Mobile first. Semantic HTML: header, nav, main, section, footer, real headings in order, real
  labels on every input.
- WCAG 2.2 AA contrast in both modes. Fully keyboard navigable. Visible focus styles, never
  removed. Respect `prefers-reduced-motion`.
- Theme colors are defined as CSS custom properties and swapped per mode. The full token set is
  declared twice, once per mode, so each mode is self contained. No hardcoded hex values in
  component rules, with one documented exception: the annotation layer and the review bar keep
  their own yellow and shadow values, because they are review tooling and not part of the brand.
- Line tokens follow the system: Rule Gray for hairline dividers and grid rules, Edge Gray for
  container and section borders, and an ink rule on every interactive boundary. That ink rule is
  also what satisfies WCAG 2.2 AA 1.4.11, since Rule Gray and Edge Gray are both under 3:1 on
  white and are therefore never used on a control edge.
- Shape is per element, not one radius: cards 8px, buttons and links 2px, navigation controls
  4px, inputs square at 0px, pills fully round. Nothing goes above 8px on a card or 4px on a
  rectangular control.
- Layout constants: page max width 1200px, section gap 48px, card padding 24px, intra component
  gap 8px, all on the 4px spacing grid.
- Cards never take a drop shadow. The only elevation in the system is the navigation bar shadow
  and a 1px inset ink outline on bordered controls.
- Forms do not submit anywhere yet. They validate, show the success state inline, and
  `console.log` the JSON payload. `FORM_ENDPOINT` in `js/main.js` is an empty string for the team
  to fill in.
- One form engine serves every form, and a form describes itself in markup: `data-form` names the
  kind and lands in the payload as `source`, `data-vertical` names the category, a group with
  `data-show-when="name=value"` is revealed conditionally, `data-soft-message` is the Rule B
  message shown when the answer is not processing, and `[data-success][data-for="<form id>"]` is
  the panel shown after a valid submit. Field `name` attributes are the payload keys. Required
  fields inside a hidden group are skipped by validation and left out of the payload.
- Every payload carries `history`, which is `none` when the merchant is not processing yet,
  `active` when they are, and `unknown` when the question never applied, and `emailType`,
  `freemail` or `business`. Free mail addresses are never blocked, only tagged, and the list of
  free mail domains sits in CONFIG.
- A multi step form marks itself `data-steps` and holds one fieldset per step with `data-step` and
  `data-step-name`. Next validates only the current step, Back keeps every answer because nothing
  is re-rendered, and submit revalidates every step and jumps back to any that fails. A visible
  element with `data-blocks-next` holds the step, which is how kratom with Canada is stopped.
  Answers from completed steps still reach the payload: a field hidden because its step is done
  counts, a field hidden by a conditional rule does not.
- Payload extras on the apply form: `data-vertical-from` names the field that sets the vertical,
  `data-waitlist-when` switches `source` to waitlist when a category that is not open yet is
  chosen, `data-preselect-from="vertical:whatYouSell"` reads `?vertical=` and preselects, UTM
  parameters on the URL are carried in `utm`, and chosen file names are listed in `files`. No file
  is uploaded while `FORM_ENDPOINT` is empty.
- Further markup hooks the engine reads: `data-show-when-checked="name=value"` reveals a note tied
  to a ticked box, `data-require-one="name"` on a fieldset asks for at least one tick in a
  checkbox group, `data-state-gate="name"` switches the form down to the fields marked
  `data-keep-active` when the answer is a state we cannot serve, and a checkbox group lands in the
  payload as an array. A switched off field takes no part in validation and never reaches the
  payload.
- Config object in `js/main.js`, one place, top of file:
  - `BRAND_NAME`
  - `FORM_ENDPOINT` (empty)
  - `showTestimonials` (false)
  - `supportedCountries`
  - `kratomRestrictedStates`
  - `DEMO_LEAD`
- `kratomRestrictedStates` now holds the team's list and the kratom priority list form gates on
  it: a merchant based in one of those states keeps the name, email and consent fields, loses the
  rest, and still submits, with `gate: "restricted-state"` in the payload. It is a hold, never a
  decline. The list itself still carries a CONFIRM, because state law here changes quickly.
- Private pages under `/onboarding/`: noindex and nofollow, excluded from the sitemap, disallowed
  in robots.txt, no analytics, never linked from any public page.
- The wireframe never stores personal ID numbers, tax IDs, date of birth or bank numbers anywhere,
  including drafts and console logs.

### Shared blocks

Rendered from `js/main.js` into a `data-block` mount, so each exists once: `trust-strip`,
`final-cta` (heading, body and primary action overridable), `how-it-works` (heading overridable)
and `kratom-states`, which renders `CONFIG.kratomRestrictedStates` on the restricted regions page
so that page and the kratom form read the same list.

### File layout

```
CLAUDE.md
PLACEHOLDERS.md
index.html
nutra.html
peptides.html
kratom.html
apply.html
contact.html
legal/terms.html
legal/privacy.html
legal/acceptable-use.html
legal/restricted-regions.html
css/styles.css
js/main.js
```

## 11. Placeholders and confirms

`PLACEHOLDERS.md` is the running log. One row per item, in page order:

| Placeholder | Page | What's needed | Status |
|---|---|---|---|

- The Placeholder cell carries the marker as written in the build, so
  `[PLACEHOLDER: ...]` for a missing fact or asset and `[CONFIRM: ...]` for a decision or a
  sign-off. Status is Open or Resolved.
- Every `[PLACEHOLDER: ...]` and `[CONFIRM: ...]` in the HTML has a row. Every row exists in the
  HTML or in `js/main.js`. Keep them in sync in the same step.
- Placeholders stay visible in both display modes. They are the point, not a defect.

## 12. Working style

Build in rollout priority order, one step at a time:

1. Shared shell: both display modes, the annotation layer, the config object, nav and footer.
2. Home, leading with nutra.
3. The nutra page, the live category and the deepest page on the site.
4. The apply page, the multi-step form, and the contact page.
5. The RUO peptides and kratom waitlist pages.
6. The four legal pages.

At the end of each step:

1. List what was built.
2. List any new placeholders and confirms.
3. Stop for review. Do not start the next step unprompted.

## 13. Checks before handing a step over

Run these over the files touched in the step.

Dash characters, must return nothing:

```bash
grep -rn '[—–]' . --include='*.html' --include='*.css' --include='*.js' --include='*.md'
```

Banned words, review every hit by hand. The word boundaries matter: without them, health and
Health Canada trip the heal pattern on every run.

```bash
grep -rniE '\b(guaranteed|no reserve|instant approval|anonymous|no kyc|offshore|cure|cures|treat|treats|treated|treating|heal|heals|healing|fda approved|best rates|lowest rates|zero fees|7-oh)\b' . --include='*.html'
```

Published terms, review every hit by hand. Expect hits from the merchant volume ranges in the
forms, for example Under $25k: those are the merchant's own figures, which Rule B asks for, not
our terms. Anything else with a currency figure or a percentage is a defect:

```bash
grep -rnE '[0-9]+(\.[0-9]+)?%|\$[0-9]|reserve|setup fee|contract length|approval time' . --include='*.html'
```

Hard requirement wording, must return nothing:

```bash
grep -rniE 'history required|no startups|minimum [0-9]+ months' . --include='*.html'
```

Then confirm by eye: one H1 per page, primary keyword in H1 or first paragraph and in the meta
title and one H2, every call to action paired with a trust line, every section carrying a
`data-note`, and both display modes rendering.

The grep patterns above are the only place in this repo where an em dash or en dash character is
allowed to appear, because the check needs them.
