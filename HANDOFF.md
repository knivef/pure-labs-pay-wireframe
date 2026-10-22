# Pure Labs Pay: wireframe handoff

This repo is the reference build for the production site. Static HTML, one stylesheet, one script,
no build step. Open `index.html` by double-clicking it, or serve the folder.

Two display modes, set on `body`: `data-mode="mockup"` (brand tokens, the default) and
`data-mode="wireframe"` (greyscale, system font, boxed images). Add `?mode=wireframe` or
`?notes=1` to any URL, or use the review bar in the bottom right. `review.html` links every page
in every combination.

Read `CLAUDE.md` before changing copy. It holds the two rules that matter most: terms are never
published, and merchant processing history is required but never stated as a requirement outside
the forms.

## Pages

| Page | Purpose | Primary keyword |
|---|---|---|
| `index.html` | Home. Leads with nutra, the live category. Problem, categories, pillars, process, features, markets, FAQ. | high risk payment processor for supplements |
| `nutra.html` | The live category and the deepest page. Who it is for, why brands switch, features, site review, process, FAQ. | nutra merchant account |
| `peptides.html` | Coming soon. Problem, what we are building, who it is for, get ready, priority list form, FAQ. | peptide merchant account |
| `kratom.html` | Coming soon, United States only. Adds supported and not supported, and a state gated priority list form. | kratom merchant account |
| `apply.html` | The one conversion page. Three step form with a sticky side panel. | not a keyword target |
| `contact.html` | Talk to underwriting. Short form for questions before applying. | not a keyword target |
| `legal/terms.html` | Website terms. Copy from counsel. | not a keyword target |
| `legal/privacy.html` | Privacy notice. Every consent checkbox links here. | not a keyword target |
| `legal/acceptable-use.html` | Accepted categories and restricted products. Every "what we don't support" line points here. | not a keyword target |
| `legal/restricted-regions.html` | Markets, and the kratom state list rendered from config. | not a keyword target |
| `review.html` | Review index. Not for production, not in the sitemap, carries noindex. | not applicable |

## Components

All in `css/styles.css`. Class names are stable: production can keep them or map them.

| Component | Classes |
|---|---|
| Layout | `.container`, `.container--narrow`, `.container--wide`, `.section`, `.section--tight`, `.section--alt`, `.section--bordered`, `.split`, `.feature-grid` (`--3`, `--4`), `.stack`, `.graph-field`, `.rule` |
| Chrome | `.site-header`, `.site-header__inner`, `.brand`, `.brand__mark`, `.site-nav`, `.site-nav__link`, `.nav-toggle`, `.nav-group`, `.nav-group__trigger`, `.nav-group__panel`, `.nav-menu__item`, `.site-footer`, `.footer-contact`, `.skip-link` |
| Type | `.eyebrow` (monospace label), `.lead`, `.h-major`, `.h-minor`, `.meta-line`, `.trust-line` |
| Buttons | `.btn` with `--primary`, `--secondary`, `--ghost`, `--compact`, `--nav`, `--block`, and `.btn-row` |
| Status | `.pill` with `--live`, `--soon`, `--xs`; `.chip`, `.chip--live`, `.chip--muted`, `.chip--lg`, `.chip-row` |
| Cards | `.card` with `--ice`, `--plum`, `--media`, `--flat`; `.card__title`, `.compare__label` |
| Content | `.steps` (`--row`), `.steps__title`, `.faq`, `.faq__item`, `.faq__body`, `.checklist`, `.checklist__tick` (`--no`), `.list-plain`, `.link-row`, `.market-list`, `.callout` (`--quiet`, `--warning`), `.region-list`, `.legal-outline` |
| Mock ups | `.checkout-card`, `.dash-card`, `.dash-card__panel`, `.sparkline`, `.bars`, `.mock-caption` |
| Forms | `.form`, `.field`, `.field__label`, `.field__hint`, `.field__error`, `.input`, `.select`, `.textarea`, `.radio-cards`, `.radio-card`, `.checkbox`, `.checkbox-group`, `.file-upload`, `.file-list`, `.field-group`, `.progress`, `.form-step`, `.form-nav`, `.form-success` |
| Placeholders | `.ph` (`--16x9`, `--4x3`, `--square`, `--tall`), `.ph__label`, `.ph-text` |
| Review tooling | `.note-tag`, `.note-panel`, `.note-anchor`, `.review-bar` and children. Strip all of these from production. |

## Design tokens

Raw values sit at `:root` under the names from the design handoff. A semantic layer is declared
twice, once per display mode, and components only read the semantic names. Swap a token once and
both modes follow.

| Token | Mockup | Role |
|---|---|---|
| `--color-paper` | `#ffffff` | Page canvas, navigation, inputs, light cards |
| `--color-ink` | `#151515` | Display text, headings, filled buttons, control outlines |
| `--color-graphite` | `#424242` | Secondary body copy |
| `--color-steel` | `#706f6f` | Muted metadata |
| `--color-rule-gray` | `#dcdcdc` | Hairline dividers and grid rules |
| `--color-edge-gray` | `#cbcac8` | Container and section borders |
| `--color-ice-panel` | `#f0f8f9` | Contained story and problem panels |
| `--color-plum-ledger` | `#543b4e` | Contrasting feature cards |
| `--color-forest-ledger` | `#0c221d` | Footer band |
| `--color-network-green` | `#29735c` | The mark, rail lines, small status markers only |
| `--color-mint-subscription` | `#bae0cf` | Footer subscribe control only. Unused today. |
| `--color-ledger-brown` | `#7b5953` | Monospace eyebrows and technical labels |
| Type | `mt-neue-display` 450 at 47 and 71px, `mt-neue-text` 400 at 21 and 32px, `mt-sans` 330 to 600 at 14, 16 and 18px, `mt-mono` 500 at 14px | Licensed faces, substituted with Manrope, Inter and IBM Plex Mono |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 48, 60, 64, 152 | 4px grid |
| Radii | cards 8px, buttons and links 2px, navigation controls 4px, inputs 0px, pills full | Never above 8px on a card or 4px on a rectangular control |
| Shadows | navigation bar only, plus a 1px inset ink outline on bordered controls | Cards never take a shadow |
| Layout | page max width 1200px, section gap 48px, card padding 24px, element gap 8px | |

Headings step up with the viewport: H1 runs 40px, then 47px from 768px, then 71px from 1024px.

## Forms

One engine in `js/main.js` drives all three. A form declares itself in markup: `data-form` names
the kind and becomes `source`, `data-vertical` or `data-vertical-from` sets the vertical,
`data-show-when="name=value"` reveals a group (join conditions with `&`, alternatives with `|`),
`data-show-when-checked` reveals a note tied to a ticked box, `data-require-one` asks for at least
one tick in a checkbox group, `data-blocks-next` holds a step while it is visible,
`data-state-gate` switches the form down to the fields marked `data-keep-active`, and
`[data-success][data-for="<form id>"]` is the panel shown after a valid submit.

Nothing posts anywhere. `FORM_ENDPOINT` in `js/main.js` is an empty string: the form validates,
shows the success panel and logs the payload to the console. Wire the POST where the comment says.

Every payload carries `source`, `vertical`, `submittedAt`, `history`, `emailType`, `gate`, `utm`,
`files` and a `fields` object keyed by the field names below.

### apply.html, `#apply-form`, three steps

| Field | Type | Required | Conditional | Payload key |
|---|---|---|---|---|
| Legal business name | text | yes | | `legalBusinessName` |
| Website URL | text | yes | | `website` |
| Country | select: United States, Canada, Other | yes | | `country` |
| Which country? | text | yes | shown when country is Other | `countryOther` |
| State or province | text | no | | `stateProvince` |
| Business type | select: LLC, Corporation, Sole proprietor, Other | yes | | `businessType` |
| What you sell | radio cards: Nutra, Peptides, Kratom, Other | yes | Peptides or Kratom shows the priority list notice and switches `source` to `waitlist`. Kratom with Canada shows "Kratom processing is US only" and blocks Next. | `whatYouSell` |
| Currently processing card payments | radio: yes, no | yes | no shows the soft message | `currentlyProcessing` |
| Current processor | select: Stripe, PayPal, Shopify Payments, Square, Authorize.net, NMI, Other high-risk processor, Other | yes | shown when processing is yes | `currentProcessor` |
| How long processing | select: Under 6 months, 6 to 12 months, 1 to 2 years, Over 2 years | yes | same | `timeProcessing` |
| Average monthly card volume | select: Under $25k, $25k to $100k, $100k to $500k, $500k to $1M, Over $1M | yes | same | `monthlyVolume` |
| Average order value | select: Under $50, $50 to $150, Over $150 | yes | same | `averageOrderValue` |
| Dispute ratio, last 3 months | select: Under 0.5%, 0.5% to 1%, Over 1%, Not sure | yes | same | `disputeRatio` |
| Sells subscriptions | radio: yes, no | yes | same | `sellsSubscriptions` |
| Statements upload | file, PDF, multiple | no | same | `files.statements` |
| Full name | text | yes | | `fullName` |
| Role | text | yes | | `role` |
| Work email | email | yes | | `workEmail` |
| Phone | tel | yes | | `phone` |
| Best time to reach you | select: Morning, Afternoon, Evening | yes | timezone detected and shown | `bestTime`, `timezone` |
| How did you hear about us | text | no | | `heardAbout` |
| Consent | checkbox | yes | links to the privacy notice | `consent` |
| Marketing opt in | checkbox | no | | `marketingOptIn` |

`?vertical=nutra`, `peptides` or `kratom` preselects the category. UTM parameters on the URL are
carried in the payload.

### peptides.html, `#priority-list-form`

Full name, work email, business name, website, country, state or province, sales model
(Research use only, Telehealth or prescription, Both), currently processing, current processor and
time processing when yes, average monthly card volume, consent. All required except state or
province. Payload `source: waitlist`, `vertical: peptides`.

### kratom.html, `#kratom-priority-form`

Full name, work email, business name, website, business state (50 states plus DC), product types
(checkbox group: Leaf or powder, Capsules, Extracts, Kava, Other, at least one), currently
processing, current processor and time processing when yes, average monthly card volume, "I only
sell to states where kratom is legal", consent. Ticking Extracts shows the 7-OH note. A business
state in `CONFIG.kratomRestrictedStates` shows the hold message, switches every field off except
name, email and consent, and still submits with `gate: "restricted-state"`. Payload
`source: waitlist`, `vertical: kratom`.

### contact.html, `#contact-form`

Name, work email, website, category, message, consent. All required. Payload `source: contact`.

## The merchant history logic, in plain words

We only work with merchants who already process cards. That is a real requirement, and the site
never says so.

Outside the forms it is signalled softly: "For established nutra brands", "Switching processors?
Bring your recent statements", and step one of the process is "Share your recent processing
statements". Nothing says "processing history required", "no startups" or "minimum X months". The
guardrail script fails the build if those phrases appear outside a form.

Inside the forms we ask directly: are you processing today, with whom, for how long, at what
volume, at what dispute level, and can we see your statements.

If someone answers "Not yet", they are never declined. They see: "We work best with brands that
already have a processing track record. Leave your details and we'll reach out when we have a
fit." The form still submits, and the payload carries `history: "none"` so underwriting can sort
those leads separately. `history` is `active` when they are processing, and `unknown` when the
question never applied, which happens when a kratom merchant's own state switched the rest of the
form off.

## The terms rule

No rates, percentages, reserves, rolling reserve periods, limits, setup fees, approval times or
contract lengths appear anywhere on this site. No pricing calculator, no example numbers, not even
as filler. The allowed phrases are "custom rate", "pricing built around your processing history",
"flexible terms for proven brands" and "you see every term before you sign".

The only figures on the site are the merchant's own ranges inside the forms, which is what Rule B
asks us to collect. `scripts/check-copy.js` allow-lists those exact strings and fails on any other
figure that sits near the words rate, fee, reserve, approval or limit.

## Analytics to add in production

Nothing is instrumented here, on purpose. Add these events when the real site is built.

| Event | When | Properties |
|---|---|---|
| `cta_click` | Any `.btn` or call to action link is clicked | `label` (the button text), `page` (path), `location` (header, hero, band, footer) |
| `form_start` | First interaction with any form | `form` (apply, waitlist, contact), `vertical` |
| `form_step` | A multi step form advances | `form`, `step` (1, 2, 3), `direction` (next, back) |
| `form_submit` | A valid submit on the apply or contact form | `form`, `vertical`, `history`, `emailType` |
| `waitlist_submit` | A valid submit where `source` is waitlist | `vertical`, `history`, `gate` |
| `history_none` | A submit where the merchant is not processing yet | `form`, `vertical` |

Keep the merchant's own figures out of the analytics payload: send the range labels, never a
customer identifier, and nothing from the statements upload.

## Placeholder or final

**Final:** every page's structure and copy as approved, the two display modes, the annotation
layer, the shared chrome and blocks, all three forms and their logic, the design tokens, the
keyword placement, the structured data shapes, `sitemap.xml`, `robots.txt` and `llms.txt` apart
from the domain.

**Placeholder:** the domain, the legal entity name, the processing partner and its registration
wording, all four legal pages, the opening dates for peptides and kratom, the supported platform
list, the countries outside the US and Canada, the Open Graph images, the brand mark and favicon,
and the testimonial section, which is switched off behind `CONFIG.showTestimonials`.

**Needs a decision, not a fact:** the kratom state list, the named processors in the problem
sections, the licensed telehealth channel, the substituted fonts, and whether a response time is
ever published. Each is a row in `PLACEHOLDERS.md` with the options written out.

## Before any handover

```bash
node scripts/check-copy.js
```

Then open `review.html` and click through both modes with notes on.
