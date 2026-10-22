# Placeholders and confirms

Every `[PLACEHOLDER: ...]` and `[CONFIRM: ...]` in the build has a row here, grouped by when it
has to be dealt with. PLACEHOLDER means a missing fact or asset. CONFIRM means a decision or a
sign-off. Run `node scripts/check-copy.js` before any handover, and re-extract the markers with:

```bash
grep -rno '\[\(PLACEHOLDER\|CONFIRM\)[^]]*\]' --include='*.html' --include='*.js' --include='*.txt' .
```

## Must fill before launch

These leave a visible gap on the page, or the site cannot legally go live without them.

| Placeholder | Where | What's needed | Status |
|---|---|---|---|
| [PLACEHOLDER: domain] | 72 places in 14 files: every canonical, Open Graph and Twitter tag, the footer and apply and contact addresses, sitemap.xml, robots.txt, llms.txt, SITE_BASE in js/main.js | The live domain. Replace every occurrence together, then re-run the link check. | Open |
| [PLACEHOLDER: legal entity name] | Footer disclosure and copyright, every page | The registered entity the brand belongs to. | Open |
| [PLACEHOLDER: partner acquiring bank or processor] | Footer disclosure, every page | The entity that provides the processing. The only place on the site where a partner is named. | Open |
| [PLACEHOLDER: registration details] | Footer disclosure, every page | The registration wording that sits with the processing partner, from the partner or counsel. | Open |
| [PLACEHOLDER: supplied by legal] | legal/terms, legal/privacy, legal/acceptable-use, legal/restricted-regions | The wording for all four legal pages. Nothing is drafted, because legal copy is not ours to invent. | Open |
| [PLACEHOLDER: date] | The four legal pages | Last updated dates, set when the copy lands. | Open |
| [PLACEHOLDER: full partner list] | legal/acceptable-use | The partner's own restricted product list, so this page and the partner agree. | Open |
| [PLACEHOLDER: other supported countries] | index Markets, legal/restricted-regions | The countries outside the US and Canada that may apply for review. | Open |
| [PLACEHOLDER: target month or "soon"] | peptides hero | When peptide onboarding opens. Visible under the hero call to action. | Open |
| [PLACEHOLDER: target date] | peptides FAQ, kratom FAQ | The opening date for each category. Keep in step with the hero line, and note these answers also feed the FAQ structured data. | Open |
| [PLACEHOLDER: supported platforms and gateways] | The shared How it works block, so home and nutra | The platforms and gateways we work with. | Open |

## Must confirm before launch

Decisions and sign-offs. The build has made a choice in each case, and the choice is reversible.

| Confirm | Where | What's needed | Status |
|---|---|---|---|
| [CONFIRM: final list with partner and legal before launch. Laws are changing in 2026.] | js/main.js, the kratom form, legal/restricted-regions | The team supplied AL, AR, CT, IN, KS, LA, TN, VT, WI, MA and it now gates the form. Needs a legal check: Rhode Island is not on it, and CT, KS, MA and TN are worth confirming, since several restrict by age rather than ban outright. State lists also miss county and city ordinances. | Open |
| [CONFIRM: peptide copy rule change] | peptides.html, CLAUDE.md | Naming a licensed prescriber channel implies human use, which the original peptide rule ruled out. The rule now allows that one channel, described as a channel only. Needs a compliance read, not just a partner yes. | Open |
| [CONFIRM: telehealth and compounding model accepted by partner] | peptides, three places | Whether the licensed telehealth and compounding channel is accepted. | Open |
| [CONFIRM: naming Stripe, PayPal, Shopify Payments and Adyen] | nutra and peptides, Problem sections | The copy states what four named companies restrict in their terms. Accurate as far as I know and common in this market, but it is a factual claim about named third parties. Counsel clears it, or it softens to "mainstream processors". | Open |
| [CONFIRM: accepted networks] | index, Features | Which card networks to name in plain text. No logos either way. | Open |
| [CONFIRM: settlement currencies] | index, nutra, peptides | Confirm settlement is USD and CAD, and whether anything else applies. | Open |
| [CONFIRM: accepted by partner] | nutra, Who it's for | Whether weight management products are accepted. | Open |
| [CONFIRM: partner restricted list] | nutra, FAQ | The restricted product list the partner applies. | Open |
| [CONFIRM: provider and age threshold by state] | kratom, What we're building | The age verification provider and the threshold per state. | Open |
| [CONFIRM: kava and related botanicals accepted by partner] | kratom, Supported and not supported | Whether kava is accepted alongside kratom. | Open |
| [CONFIRM: placeholders inside FAQ structured data] | peptides, kratom | FAQ nodes are read word for word from the page, so unresolved date markers reach the structured data. The build warns in the console. Resolve the dates, or drop those answers from the FAQ, before launch. | Open |
| [CONFIRM: statements wording in the apply FAQ] | index and nutra, FAQ | "your last three months of processing statements" states the history requirement outside a form, which Rule B avoids. "your recent processing statements" keeps the answer and the rule. | Open |
| [CONFIRM: home keyword placement] | index.html | The SEO map asks for the primary keyword in the H1 or first paragraph, the meta title and one H2. It now sits in the first paragraph only: the title reads "Payment Processing" rather than "Payment Processor", and the Features H2 went back to reader-first wording in the copy pass, by decision. Two one-word fixes are available if the team wants full coverage: "Processor" in the title, and "supplement" plus the phrase in one H2. Nutra, peptides and kratom carry all three placements. | Open |
| [CONFIRM: licensed display and text faces] | css/styles.css, every page | mt-neue-display, mt-neue-text, mt-sans and mt-mono are licensed faces we do not hold. The stacks name each face first, then Manrope, Inter and IBM Plex Mono. Licence the real faces or sign off on the substitutes. | Open |
| [CONFIRM: design reference provenance] | Site wide | The design tokens were extracted from moderntreasury.com. A style reference is normal practice, but confirm how close this brand sits to that visual language. | Open |
| [CONFIRM: brand record fields] | payment-brand-graphics repo | The pure-labs record still describes pre-screening and vetting in its tagline and sells fields. Owned by that repo, not this one. | Open |

## Can fill after launch

Nothing here blocks a launch. Each is a visible stand-in or an off switch.

| Item | Where | What's needed | Status |
|---|---|---|---|
| [PLACEHOLDER: Open Graph image, 1200 by 630, per assets/README.md] | All pages | One social image per page, referenced as assets/og-<page>.png. Tags are in place, files are not. | Open |
| Brand mark and favicon | Header and footer, every page | The PL mark as SVG plus a favicon set. A text mark stands in and looks deliberate. | Open |
| [PLACEHOLDER: response time, if committed] | apply, success screen | Whether to state a response time at all. Rule A bans published approval times, so this stays empty unless the team decides a service promise is worth making. | Open |
| [PLACEHOLDER: testimonials section heading] | index, Testimonials | Only needed when the section is switched on. | Open |
| [PLACEHOLDER: 2 to 3 approved merchant quotes] | index, Testimonials | Merchant quotes with written approval. Hidden while showTestimonials is false, visible only in notes mode. | Open |
| [CONFIRM: web font loading] | All pages | The Google Fonts link for the three substitutes is in every page but commented out, so the build opens from the filesystem with no external request. Enable it or self host. | Open |
| Payment rail diagram | nutra | Optional. The home hero uses the checkout mock the team specified, so the rail diagram is no longer needed there. | Open |
| Hero visuals for peptides and kratom | peptides, kratom | Both use built-in markup mocks today. Replace only if the team wants photography or illustration, per assets/README.md. | Open |

## Resolved

| Item | Outcome |
|---|---|
| [CONFIRM: accent colour] | Resolved by the design system. Filled buttons are Ink #151515, Network Green #29735c is reserved for the mark, the rail lines and small markers. The brand record blue is not used. | 
| [CONFIRM: peptide wording] | Resolved. The short form "peptide" is used across the site and matches the primary keyword. CLAUDE.md carries the substance rules instead of a wording prefix. |
| [CONFIRM: the word treated in two headings] | Resolved in the final pass. The home H2 reads "Tired of being the high-risk afterthought?" and the kratom card reads "Leaf brands get handled like concentrated extracts." |
| [PLACEHOLDER: H1 and section copy] | Resolved. Every page carries its final copy from the team. |
| [PLACEHOLDER: meta description] | Resolved. Ten unique descriptions, one per page. |
