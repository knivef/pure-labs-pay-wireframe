/* ==========================================================================
   Pure Labs Pay wireframe and mockup
   One file, no dependencies, no build step.
   Loaded as a classic script, not a module, because ES modules are blocked
   when a page is opened straight from the filesystem.

   What this file does:
   1. CONFIG, the single source of truth for the brand name and site settings
   2. Display mode, wireframe or mockup, from ?mode= then localStorage
   3. Notes layer, on or off, from ?notes= then localStorage
   4. Annotation tags built from every data-note attribute
   5. Shared header, footer and reusable blocks, injected into their mounts
   6. Menu behaviour: the Processing dropdown and the mobile panel
   7. The floating review bar
   8. Forms: validation, conditional fields, the soft message and the payload
   9. Structured data: Organization, Service, FAQPage and BreadcrumbList
  10. Private onboarding pages: the application and the invite tool
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIG
   Rename the brand in one place. Every element marked data-brand and the
   document title pick it up on load.
   -------------------------------------------------------------------------- */

var CONFIG = {
  BRAND_NAME: 'Pure Labs Pay',

  /* Left empty for the team. Forms validate, show the success state and log
     the payload to the console until this is filled in. */
  FORM_ENDPOINT: '',

  showTestimonials: false,

  /* Each supported country carries the labels that change with it, so the
     private application reads correctly outside the United States.
     [CONFIRM: supported countries] */
  supportedCountries: [
    { code: 'US', label: 'United States', region: 'State', postcode: 'ZIP code', taxId: 'EIN', personalId: 'SSN', bankCode: 'Routing number' },
    { code: 'CA', label: 'Canada', region: 'Province', postcode: 'Postal code', taxId: 'Business Number', personalId: 'SIN', bankCode: 'Transit and institution number' },
    { code: 'GB', label: 'United Kingdom', region: 'Region', postcode: 'Postcode', taxId: 'Company number', personalId: 'National Insurance number', bankCode: 'Sort code' },
    { code: 'AU', label: 'Australia', region: 'State or territory', postcode: 'Postcode', taxId: 'ABN', personalId: 'National ID', bankCode: 'BSB' },
    { code: 'EU', label: 'European Union', region: 'Region', postcode: 'Postal code', taxId: 'VAT number', personalId: 'National ID', bankCode: 'SWIFT or BIC' },
    { code: 'OTHER', label: 'Other supported region', region: 'State or region', postcode: 'Postal code', taxId: 'Business tax ID', personalId: 'National ID', bankCode: 'SWIFT or BIC' }
  ],

  /* The lead the private application prefills from. In production these five
     values arrive with the invite, keyed by the ref. */
  DEMO_LEAD: {
    leadId: 'PL-4FFT5U',
    name: 'Dana Okafor',
    email: 'dana@northline.co',
    website: 'northline.co',
    lookingFor: 'Better terms than my current setup',
    volumeBand: '$100k to $500k',
    vertical: 'nutra'
  },

  /* Two letter codes for the states we will not support kratom merchants in.
     Read by the kratom priority list form, which gates on the merchant's own
     state rather than guessing.
     [CONFIRM: final list with partner and legal before launch. Laws are
     changing in 2026.] */
  kratomRestrictedStates: ['AL', 'AR', 'CT', 'IN', 'KS', 'LA', 'TN', 'VT', 'WI', 'MA'],

  /* Free mail domains are accepted on every form. They are not blocked, only
     tagged in the payload as emailType: freemail, so underwriting can see at a
     glance whether a lead used a business address. */
  freemailDomains: [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com',
    'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com', 'aol.com',
    'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
    'gmx.com', 'gmx.de', 'mail.com', 'yandex.com', 'zoho.com'
  ]
};

/* The brand name as written into the HTML and the page titles. Only used to
   swap in CONFIG.BRAND_NAME when the two differ, so a rename stays one edit. */
var BRAND_NAME_IN_MARKUP = 'Pure Labs Pay';

(function () {
  'use strict';

  var MODES = ['mockup', 'wireframe'];
  var DEFAULT_MODE = 'mockup';
  var STORE_MODE = 'plp.mode';
  var STORE_NOTES = 'plp.notes';

  var storageOk = true;

  /* ------------------------------------------------------------------------
     Storage, every call wrapped
     ------------------------------------------------------------------------ */

  function storeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      storageOk = false;
      return null;
    }
  }

  function storeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      storageOk = false;
    }
  }

  /* ------------------------------------------------------------------------
     2 and 3. Resolve mode and notes. A URL parameter wins, then the last
     stored choice, then the default.
     ------------------------------------------------------------------------ */

  function params() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (err) {
      return { get: function () { return null; } };
    }
  }

  function resolveMode() {
    var fromUrl = (params().get('mode') || '').toLowerCase();
    if (MODES.indexOf(fromUrl) > -1) { return fromUrl; }
    var stored = storeGet(STORE_MODE);
    if (MODES.indexOf(stored) > -1) { return stored; }
    return DEFAULT_MODE;
  }

  function resolveNotes() {
    var fromUrl = (params().get('notes') || '').toLowerCase();
    if (fromUrl === '1' || fromUrl === 'true' || fromUrl === 'on') { return true; }
    if (fromUrl === '0' || fromUrl === 'false' || fromUrl === 'off') { return false; }
    return storeGet(STORE_NOTES) === '1';
  }

  function applyMode(mode, remember) {
    document.body.setAttribute('data-mode', mode);
    if (remember) { storeSet(STORE_MODE, mode); }
    syncUrl('mode', mode);
    syncReviewBar();
  }

  function applyNotes(on, remember) {
    if (on) {
      document.body.setAttribute('data-notes', '1');
    } else {
      document.body.removeAttribute('data-notes');
      closeOpenNote();
    }
    if (remember) { storeSet(STORE_NOTES, on ? '1' : '0'); }
    syncUrl('notes', on ? '1' : '0');
    applyTestimonialSwitch();
    syncReviewBar();
  }

  /* Keep the address bar in step with the toggles, so a link can be shared.
     Blocked on some filesystem origins, so it fails quietly. */
  function syncUrl(key, value) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(key, value);
      window.history.replaceState({}, '', url);
    } catch (err) {
      /* nothing to do, the toggles still work */
    }
  }

  /* Fallback for browsers that refuse storage on the filesystem: carry the
     current mode and notes state on internal links. */
  function decorateLinks() {
    var mode = document.body.getAttribute('data-mode') || DEFAULT_MODE;
    var notes = document.body.getAttribute('data-notes') === '1' ? '1' : '0';
    var links = document.querySelectorAll('a[href]');
    var i;
    for (i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^[a-z]+:/i.test(href)) { continue; }
      var base = href.split('#')[0].split('?')[0];
      var hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : '';
      links[i].setAttribute('href', base + '?mode=' + mode + '&notes=' + notes + hash);
    }
  }

  /* ------------------------------------------------------------------------
     1b. Brand name and testimonial switch
     ------------------------------------------------------------------------ */

  function applyBrandName() {
    var name = CONFIG.BRAND_NAME;
    var nodes = document.querySelectorAll('[data-brand]');
    var i;
    for (i = 0; i < nodes.length; i++) { nodes[i].textContent = name; }
    if (name !== BRAND_NAME_IN_MARKUP) {
      document.title = document.title.split(BRAND_NAME_IN_MARKUP).join(name);
    }
  }

  /* Testimonial sections render only when the flag is true. While it is false
     the section stays hidden on the page, but shows in notes mode so a
     reviewer can see the slot and its placeholder. */
  function applyTestimonialSwitch() {
    var blocks = document.querySelectorAll('[data-testimonials]');
    var notesOn = document.body.getAttribute('data-notes') === '1';
    var show = CONFIG.showTestimonials || notesOn;
    var i;
    for (i = 0; i < blocks.length; i++) { blocks[i].hidden = !show; }
  }

  /* ------------------------------------------------------------------------
     4. Annotation layer
     Every element carrying data-note gets a numbered tag at its top left
     corner. The tag sits outside the box, and a note on a form control is
     rendered in the flow above the control, so inputs are never covered.
     ------------------------------------------------------------------------ */

  var VOIDISH = /^(INPUT|SELECT|TEXTAREA|IMG|BR|HR|AREA|EMBED|IFRAME)$/;
  var openTag = null;

  function noteParagraphs(text, panel) {
    var parts = String(text).split('|');
    var i;
    for (i = 0; i < parts.length; i++) {
      var raw = parts[i].trim();
      if (!raw) { continue; }
      var p = document.createElement('p');
      var split = raw.indexOf(':');
      if (split > 0 && split < 24) {
        var strong = document.createElement('strong');
        strong.textContent = raw.slice(0, split + 1) + ' ';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(raw.slice(split + 1).trim()));
      } else {
        p.textContent = raw;
      }
      panel.appendChild(p);
    }
  }

  function closeOpenNote() {
    if (!openTag) { return; }
    var panel = document.getElementById(openTag.getAttribute('aria-controls'));
    if (panel) { panel.hidden = true; }
    openTag.setAttribute('aria-expanded', 'false');
    openTag = null;
  }

  function toggleNote(tag) {
    var panel = document.getElementById(tag.getAttribute('aria-controls'));
    if (!panel) { return; }
    var isOpen = tag.getAttribute('aria-expanded') === 'true';
    closeOpenNote();
    if (isOpen) { return; }
    panel.hidden = false;
    tag.setAttribute('aria-expanded', 'true');
    openTag = tag;
  }

  function buildNoteTags() {
    var noted = document.querySelectorAll('[data-note]');
    var i;
    for (i = 0; i < noted.length; i++) {
      var el = noted[i];
      var number = i + 1;

      var tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'note-tag';
      tag.textContent = String(number);
      tag.setAttribute('aria-expanded', 'false');
      tag.setAttribute('aria-controls', 'note-panel-' + number);
      tag.setAttribute('aria-label', 'Build note ' + number);

      var panel = document.createElement('div');
      panel.className = 'note-panel';
      panel.id = 'note-panel-' + number;
      panel.hidden = true;
      panel.setAttribute('role', 'note');
      noteParagraphs(el.getAttribute('data-note'), panel);

      if (VOIDISH.test(el.tagName) || el.hasAttribute('data-note-outside')) {
        var anchor = document.createElement('span');
        anchor.className = 'note-anchor';
        tag.className += ' note-tag--inline';
        anchor.appendChild(tag);
        anchor.appendChild(panel);
        if (el.parentNode) { el.parentNode.insertBefore(anchor, el); }
      } else {
        if (window.getComputedStyle(el).position === 'static') {
          el.style.position = 'relative';
        }
        el.insertBefore(panel, el.firstChild);
        el.insertBefore(tag, el.firstChild);
      }
    }

    document.addEventListener('click', function (event) {
      var tag = event.target.closest ? event.target.closest('.note-tag') : null;
      if (tag) {
        event.preventDefault();
        toggleNote(tag);
        return;
      }
      if (openTag && !(event.target.closest && event.target.closest('.note-panel'))) {
        closeOpenNote();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && openTag) {
        var tag = openTag;
        closeOpenNote();
        tag.focus();
      }
    });
  }


  /* ------------------------------------------------------------------------
     6. Shared chrome and reusable blocks
     There is no build step, so the header, the footer and the repeatable
     blocks are rendered here and injected into their mount points. Each page
     carries an empty div plus a noscript link list, so the site is still
     navigable with scripting off.

     Every page in legal/ sets data-prefix="../" on body. Links are built from
     that, so nothing depends on the server root and the build still works when
     a page is opened straight from the filesystem.
     ------------------------------------------------------------------------ */

  function prefix() {
    return document.body.getAttribute('data-prefix') || '';
  }

  function currentPage() {
    var path = window.location.pathname;
    var file = path.slice(path.lastIndexOf('/') + 1);
    return file === '' ? 'index.html' : file;
  }

  function markCurrent(scope) {
    var here = currentPage();
    var links = scope.querySelectorAll('a[href]');
    var i;
    for (i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      var base = href.split('#')[0].split('?')[0];
      var file = base.slice(base.lastIndexOf('/') + 1);
      if (file && file === here && href.indexOf('#') === -1) {
        links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  /* Header. One bar, sticky, with the Processing menu, the three links and the
     primary call to action. */
  function headerMarkup() {
    var p = prefix();
    return '' +
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header" data-note="Intent: one bar on every page. The Processing menu carries the category status, so a visitor sees what is live and what is coming before they click. | SEO: no keyword load, the links carry plain category names. | Dev: injected from js/main.js into #site-header. Sticky. Below 1024px the bar collapses behind a Menu button with a focus trap and Escape to close.">' +
        '<div class="container site-header__inner">' +
          '<a class="brand" href="' + p + 'index.html">' +
            '<span class="brand__mark" aria-hidden="true">PL</span>' +
            '<span class="brand__name" data-brand>' + BRAND_NAME_IN_MARKUP + '</span>' +
          '</a>' +

          '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu">' +
            '<span class="nav-toggle__bars" aria-hidden="true"></span>' +
            '<span class="nav-toggle__label">Menu</span>' +
          '</button>' +

          '<div class="site-nav" id="site-menu">' +
            '<nav aria-label="Main">' +
              '<ul class="site-nav__list">' +
                '<li class="nav-group">' +
                  '<button class="nav-group__trigger" type="button" aria-expanded="false" aria-controls="nav-processing">' +
                    'Processing' +
                    '<span class="nav-group__chevron" aria-hidden="true"></span>' +
                  '</button>' +
                  '<div class="nav-group__panel" id="nav-processing" hidden>' +
                    '<ul class="nav-menu">' +
                      navItem(p + 'nutra.html', 'Nutra', 'live', 'Live', 'Supplements, vitamins and wellness brands') +
                      navItem(p + 'peptides.html', 'Peptides', 'soon', 'Coming soon', 'Join the priority list') +
                      navItem(p + 'kratom.html', 'Kratom', 'soon', 'Coming soon, US', 'Join the priority list') +
                    '</ul>' +
                  '</div>' +
                '</li>' +
                '<li><a class="site-nav__link" href="' + p + 'index.html#how-it-works">How it works</a></li>' +
                '<li><a class="site-nav__link" href="' + p + 'index.html#faq">FAQ</a></li>' +
                '<li><a class="site-nav__link" href="' + p + 'contact.html">Talk to underwriting</a></li>' +
              '</ul>' +
            '</nav>' +
            '<div class="site-header__actions">' +
              '<a class="btn btn--primary btn--compact" href="' + p + 'apply.html">Get my custom rate</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function navItem(href, title, state, pillLabel, line) {
    return '' +
      '<li>' +
        '<a class="nav-menu__item" href="' + href + '">' +
          '<span class="nav-menu__title">' + title +
            ' <span class="pill pill--' + state + ' pill--xs">' + pillLabel + '</span>' +
          '</span>' +
          '<span class="nav-menu__hint">' + line + '</span>' +
        '</a>' +
      '</li>';
  }

  /* Footer. Three link columns, the contact block as selectable text, the
     short about line, the visible disclosure and the copyright. */
  function footerMarkup() {
    var p = prefix();
    var year = new Date().getFullYear();
    return '' +
      '<footer class="site-footer" data-note="Intent: close every page with the category list, the legal set and the disclosure a merchant needs to see before applying. | SEO: internal links to every page, plus one plain sentence describing the business for answer engines. | Dev: injected from js/main.js into #site-footer. The disclosure stays visible, never behind a toggle. The year is rendered from the clock.">' +
        '<div class="container">' +
          '<div class="site-footer__grid">' +

            '<div class="site-footer__brand">' +
              '<a class="brand" href="' + p + 'index.html">' +
                '<span class="brand__mark" aria-hidden="true">PL</span>' +
                '<span class="brand__name" data-brand>' + BRAND_NAME_IN_MARKUP + '</span>' +
              '</a>' +
              '<p class="site-footer__about"><span data-brand>' + BRAND_NAME_IN_MARKUP + '</span> provides card processing for nutra, peptide and kratom brands worldwide, with settlement in fiat or crypto, through partner acquiring banks and payment partners.</p>' +
              '<div class="footer-contact" data-note="Intent: a person to write to, not a form. | Dev: plain selectable text rather than mailto links, because the domain is still a placeholder. Swap to mailto when the domain lands.">' +
                '<p class="footer-contact__label">Contact</p>' +
                '<p class="footer-contact__email">underwriting@<span class="ph-text">[PLACEHOLDER: domain]</span></p>' +
                '<p class="footer-contact__email">support@<span class="ph-text">[PLACEHOLDER: domain]</span></p>' +
              '</div>' +
            '</div>' +

            '<div>' +
              '<h2>Processing</h2>' +
              '<ul>' +
                '<li><a href="' + p + 'nutra.html">Nutra</a></li>' +
                '<li><a href="' + p + 'peptides.html">Peptides</a></li>' +
                '<li><a href="' + p + 'kratom.html">Kratom</a></li>' +
              '</ul>' +
            '</div>' +

            '<div>' +
              '<h2>Company</h2>' +
              '<ul>' +
                '<li><a href="' + p + 'index.html#how-it-works">How it works</a></li>' +
                '<li><a href="' + p + 'contact.html">Talk to underwriting</a></li>' +
                '<li><a href="' + p + 'apply.html">Get my custom rate</a></li>' +
              '</ul>' +
            '</div>' +

            '<div>' +
              '<h2>Legal</h2>' +
              '<ul>' +
                '<li><a href="' + p + 'legal/terms.html">Terms</a></li>' +
                '<li><a href="' + p + 'legal/privacy.html">Privacy</a></li>' +
                '<li><a href="' + p + 'legal/acceptable-use.html">Acceptable use and restricted products</a></li>' +
                '<li><a href="' + p + 'legal/restricted-regions.html">Restricted regions</a></li>' +
              '</ul>' +
            '</div>' +

          '</div>' +

          '<div class="site-footer__legal">' +
            '<p class="site-footer__disclosure"><span data-brand>' + BRAND_NAME_IN_MARKUP + '</span> is a brand of <span class="ph-text">[PLACEHOLDER: legal entity name]</span>. Payment processing services are provided by <span class="ph-text">[PLACEHOLDER: partner acquiring bank or processor]</span>, <span class="ph-text">[PLACEHOLDER: registration details]</span>. <span data-brand>' + BRAND_NAME_IN_MARKUP + '</span> is not a bank. All accounts are subject to underwriting review and approval. Kratom processing is available to US merchants in supported states only.</p>' +
            '<p class="site-footer__copyright">&copy; ' + year + ' <span class="ph-text">[PLACEHOLDER: legal entity name]</span></p>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* Reusable three step process. Same component on the home page and on a
     category page, so the steps are defined once. A page overrides the
     heading with data-heading on the mount point. */
  function howItWorksMarkup(mount) {
    var heading = mount.getAttribute('data-heading') || 'Getting started is simple';
    return '' +
      '<section class="section section--bordered" id="how-it-works" data-note="Intent: three steps that stay on the lead first side of Rule B. No documents, no paperwork, nothing that implies a long application. | SEO: anchor target for the How it works link in the header and the footer. | Dev: block rendered from js/main.js, used on the home page and on category pages. Horizontal on desktop, stacked on mobile. Override the heading with data-heading. The platform list stays a placeholder until the team confirms it.">' +
        '<div class="container">' +
          '<h2>' + heading + '</h2>' +
          '<ol class="steps steps--row">' +
            step('Tell us what you\'re looking for', 'A few quick details. It takes about a minute.') +
            step('Talk to our team', 'We get to know your business and find the right setup for you.') +
            step('Go live', 'You get your custom rate in writing and we help you get set up.') +
          '</ol>' +
          '<p class="meta-line mt-5">Works with <span class="ph-text">[PLACEHOLDER: supported platforms and gateways]</span>.</p>' +
        '</div>' +
      '</section>';
  }

  function step(title, body) {
    return '<li><h3 class="steps__title">' + title + '</h3><p>' + body + '</p></li>';
  }

  /* State names for the restricted regions page. The kratom form keeps its
     own list of options in markup, so this map is only for rendering
     CONFIG.kratomRestrictedStates as readable names. */
  var US_STATE_NAMES = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  };

  /* The restricted regions list, rendered from CONFIG so the legal page and
     the kratom form can never drift apart. */
  function kratomStatesMarkup() {
    var list = CONFIG.kratomRestrictedStates || [];
    var items = '';
    var i;
    for (i = 0; i < list.length; i++) {
      items += '<li>' + (US_STATE_NAMES[list[i]] || list[i]) + ' (' + list[i] + ')</li>';
    }
    if (!items) { items = '<li>No states listed yet.</li>'; }

    return '' +
      '<div data-note="Intent: the one place a merchant can check whether their own state is served, kept in step with the form that gates on it. | SEO: not a keyword target, indexable. | Dev: rendered from CONFIG.kratomRestrictedStates in js/main.js, so this page and the kratom priority list form read the same list.">' +
        '<h2>Kratom: states we do not support</h2>' +
        '<p>Kratom processing is United States only, and we do not support merchants based in these states:</p>' +
        '<ul class="region-list">' + items + '</ul>' +
        '<div class="callout callout--warning">' +
          '<p class="callout__title">[CONFIRM: final list with partner and legal before launch. Laws are changing in 2026.]</p>' +
          '<p>This list is rendered from the build configuration. It is not legal advice and it is not final.</p>' +
        '</div>' +
        '<h2>Kratom: Canada</h2>' +
        '<p>We do not support kratom for merchants based in or selling to Canada. Canadian nutra brands can apply today.</p>' +
      '</div>';
  }

  /* Shared lead form, Rule B stage one.
     Five fields and a consent box, one column, all required. No qualifying
     questions, no conditional messages: the team qualifies internally and
     sends the private application afterwards.

     A page mounts it with
       <div data-block="lead-form"
            data-vertical="peptides"          the category, set silently
            data-submit-label="..."           button text
            data-trust="..."                  the trust line
            data-success-title="..."
            data-success-text="..."></div>
     On the apply page the vertical is left out and read from ?vertical=
     instead, and a category that is not open yet switches source to waitlist
     and shows the priority list note. */

  var LEAD_LOOKING_FOR = [
    'A new payment processor',
    'A backup processor',
    'Better terms than my current setup',
    'Fiat or crypto settlement',
    'Something else'
  ];

  var LEAD_VOLUME_BANDS = [
    'Under $25k',
    '$25k to $100k',
    '$100k to $500k',
    '$500k to $1M',
    'Over $1M'
  ];

  var WAITLIST_VERTICALS = ['peptides', 'kratom'];

  function leadVertical(mount) {
    var fixed = (mount.getAttribute('data-vertical') || '').toLowerCase();
    if (fixed) { return fixed; }
    return (params().get('vertical') || '').toLowerCase();
  }

  function leadOptions(values) {
    var out = '';
    var i;
    for (i = 0; i < values.length; i++) {
      out += '<option value="' + values[i] + '">' + values[i] + '</option>';
    }
    return out;
  }

  /* PL plus six characters, no look-alikes, so a lead can be read down a
     phone line without confusion. */
  function newLeadId() {
    var alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    var out = '';
    var i;
    for (i = 0; i < 6; i++) {
      out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return 'PL-' + out;
  }

  function leadFormMarkup(mount) {
    var p = prefix();
    var vertical = leadVertical(mount);
    var waitlist = WAITLIST_VERTICALS.indexOf(vertical) > -1;
    var source = mount.getAttribute('data-source') || (waitlist ? 'waitlist' : 'apply');
    var label = mount.getAttribute('data-submit-label') || 'Get my custom rate';
    var trust = mount.getAttribute('data-trust') || 'Your details go only to our underwriting team.';
    var successTitle = mount.getAttribute('data-success-title') || 'Thanks, we\'ve got your details';
    var successText = mount.getAttribute('data-success-text') || 'Our team will be in touch.';
    var note = '';

    /* Only on the apply page, where the category arrives in the URL rather
       than from the page itself. */
    if (waitlist && !mount.getAttribute('data-vertical')) {
      note =
        '<p class="callout callout--quiet lead-form__note">' +
          'Processing for this category opens soon. You\'ll join the priority list.' +
        '</p>';
    }

    return '' +
      note +
      '<form class="form form--lead" id="lead-form" data-form="lead" data-vertical="' + vertical + '" data-source="' + source + '" novalidate data-note-outside data-note="Intent: capture the lead, nothing else. Five fields and a consent box, one column, every one required. | Dev: the shared lead form from js/main.js, used on apply, peptides and kratom. No qualifying questions and no conditional logic: the team qualifies internally, then sends the private application. The category is set from the page or ?vertical=, never asked. Nothing posts while CONFIG.FORM_ENDPOINT is empty.">' +

        '<div class="field">' +
          '<label class="field__label" for="lead-name">Full name</label>' +
          '<input class="input" type="text" id="lead-name" name="name" autocomplete="name" required>' +
          '<p class="field__error">Enter your full name.</p>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="lead-email">Work email</label>' +
          '<input class="input" type="email" id="lead-email" name="email" autocomplete="email" required>' +
          '<p class="field__error">Enter an email address we can reply to.</p>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="lead-website">Company website</label>' +
          '<input class="input" type="text" inputmode="url" id="lead-website" name="website" placeholder="yourstore.com" required>' +
          '<p class="field__error">Enter the website where you sell.</p>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="lead-looking">What are you looking for?</label>' +
          '<select class="select" id="lead-looking" name="lookingFor" required>' +
            '<option value="">Select an option</option>' +
            leadOptions(LEAD_LOOKING_FOR) +
          '</select>' +
          '<p class="field__error">Tell us what you need, so we route you to the right person.</p>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="lead-volume">Monthly volume</label>' +
          '<select class="select" id="lead-volume" name="volumeBand" required>' +
            '<option value="">Select a range</option>' +
            leadOptions(LEAD_VOLUME_BANDS) +
          '</select>' +
          '<p class="field__error">Select the range that fits your business.</p>' +
        '</div>' +

        '<div class="field">' +
          '<label class="checkbox">' +
            '<input type="checkbox" name="consent" value="yes" required>' +
            '<span>I agree to the <a href="' + p + 'legal/privacy.html">privacy policy</a> and to be contacted about my application.</span>' +
          '</label>' +
          '<p class="field__error">Please agree before sending your details.</p>' +
        '</div>' +

        '<div>' +
          '<button class="btn btn--primary" type="submit" data-label="' + label + '">' + label + '</button>' +
          '<span class="trust-line">' + trust + '</span>' +
        '</div>' +
      '</form>' +

      '<div class="form-success" data-success data-for="lead-form" role="status" tabindex="-1" hidden>' +
        '<h2>' + successTitle + '</h2>' +
        '<p>' + successText + '</p>' +
      '</div>';
  }

  /* The lead payload is flat and fixed, so the team can map it to a CRM
     without reading the markup. */
  function buildLeadPayload(form) {
    var value = function (name) {
      var el = form.elements[name];
      return el ? (el.value || '').trim() : '';
    };
    var email = value('email').toLowerCase();
    var domain = email.indexOf('@') > -1 ? email.split('@')[1] : '';

    return {
      name: value('name'),
      email: value('email'),
      emailType: CONFIG.freemailDomains.indexOf(domain) > -1 ? 'freemail' : 'business',
      website: value('website'),
      lookingFor: value('lookingFor'),
      volumeBand: value('volumeBand'),
      vertical: form.getAttribute('data-vertical') || '',
      source: form.getAttribute('data-source') || 'apply',
      page: window.location.pathname,
      utm: utmParameters(),
      submittedAt: new Date().toISOString(),
      leadId: newLeadId()
    };
  }

  /* The submitting state. There is no endpoint yet, so the button holds for a
     moment to show the state the team has to build. */
  function sendLead(form) {
    var button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Sending';
    }
    window.setTimeout(function () {
      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = button.getAttribute('data-label') || 'Send';
      }
      showSuccess(form);
    }, 450);
  }

  /* Reusable closing call to action. A page overrides the heading and the body
     with data-heading and data-text on the mount point. */
  function finalCtaMarkup(mount) {
    var p = prefix();
    var heading = mount.getAttribute('data-heading') || 'Find out what your rate looks like';
    var text = mount.getAttribute('data-text') ||
      'Tell us what you\'re looking for. Our team will take it from there.';
    /* A coming soon page swaps the primary action for its own waitlist, per
       the rollout priority in CLAUDE.md. Get my custom rate still sits in the
       header and the footer on every page. */
    var primaryLabel = mount.getAttribute('data-primary-label') || 'Get my custom rate';
    var primaryHref = mount.getAttribute('data-primary-href') || (p + 'apply.html');
    return '' +
      '<section class="section cta-band" data-note="Intent: the repeatable closing call to action. Primary goes to the apply form, secondary to a person. | SEO: no keyword target, it carries the conversion. | Dev: block rendered from js/main.js. Override the heading and the body with data-heading and data-text, and the primary action with data-primary-label and data-primary-href, on the mount point. The trust line is fixed, because every call to action carries one.">' +
        '<div class="container container--narrow">' +
          '<h2 class="h-major">' + heading + '</h2>' +
          '<p class="lead">' + text + '</p>' +
          '<div class="btn-row">' +
            '<a class="btn btn--primary" href="' + primaryHref + '">' + primaryLabel + '</a>' +
            '<a class="btn btn--secondary" href="' + p + 'contact.html">Talk to underwriting</a>' +
          '</div>' +
          '<span class="trust-line">Every term shown before you sign.</span>' +
        '</div>' +
      '</section>';
  }

  /* Reusable trust strip. Plain text and line icons, never logos or numbers. */
  function trustStripMarkup() {
    var icons = {
      underwriting: '<path d="M4 3h10l4 4v14H4z"/><path d="M14 3v4h4"/><path d="M8 13l2.5 2.5L15 11"/>',
      shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8L15 10"/>',
      settlement: '<path d="M4 9h13l-3-3"/><path d="M20 15H7l3 3"/>',
      worldwide: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'
    };
    function item(icon, label) {
      return '' +
        '<li class="trust-strip__item">' +
          '<svg class="trust-strip__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + icon + '</svg>' +
          '<span>' + label + '</span>' +
        '</li>';
    }
    return '' +
      '<section class="trust-strip" data-note="Intent: four plain lines, placed under a hero or above a form, to steady a merchant who has been shut down before. | SEO: no keyword target. | Dev: block rendered from js/main.js. Text only with line icons, no logos, no numbers, nothing that needs a source.">' +
        '<div class="container">' +
          '<ul class="trust-strip__list">' +
            item(icons.underwriting, 'Underwriting built for your category') +
            item(icons.shield, 'Dispute and fraud tools included') +
            item(icons.settlement, 'Fiat and crypto settlement') +
            item(icons.worldwide, 'Merchants worldwide') +
          '</ul>' +
        '</div>' +
      '</section>';
  }

  /* ------------------------------------------------------------------------
     Menu behaviour: the Processing dropdown and the mobile panel
     ------------------------------------------------------------------------ */

  var DESKTOP_QUERY = '(min-width: 64rem)';

  function isDesktop() {
    try {
      return window.matchMedia(DESKTOP_QUERY).matches;
    } catch (err) {
      return false;
    }
  }

  function focusables(scope) {
    var nodes = scope.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var list = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].offsetParent !== null || nodes[i] === document.activeElement) { list.push(nodes[i]); }
    }
    return list;
  }

  function setupMenus() {
    var header = document.querySelector('.site-header');
    if (!header) { return; }

    var toggle = header.querySelector('.nav-toggle');
    var trigger = header.querySelector('.nav-group__trigger');
    var panel = header.querySelector('.nav-group__panel');

    function closeGroup() {
      if (!trigger || !panel) { return; }
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    }

    function openGroup() {
      if (!trigger || !panel) { return; }
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }

    function closeMenu(returnFocus) {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      closeGroup();
      if (returnFocus) { toggle.focus(); }
    }

    function openMenu() {
      header.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (header.classList.contains('is-open')) { closeMenu(false); } else { openMenu(); }
      });
    }

    if (trigger) {
      trigger.addEventListener('click', function () {
        if (trigger.getAttribute('aria-expanded') === 'true') { closeGroup(); } else { openGroup(); }
      });
    }

    /* Escape closes the dropdown first, then the mobile panel. */
    header.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') { return; }
      if (trigger && trigger.getAttribute('aria-expanded') === 'true') {
        closeGroup();
        trigger.focus();
        return;
      }
      if (header.classList.contains('is-open')) { closeMenu(true); }
    });

    /* Focus trap while the mobile panel is open. */
    header.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !header.classList.contains('is-open') || isDesktop()) { return; }
      var items = focusables(header);
      if (!items.length) { return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* A click outside the bar closes whatever is open. */
    document.addEventListener('click', function (event) {
      if (header.contains(event.target)) { return; }
      closeGroup();
      if (header.classList.contains('is-open')) { closeMenu(false); }
    });

    /* Following a link closes the panel, so the next page starts clean. */
    header.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href]') : null;
      if (link) { closeMenu(false); }
    });

    /* Crossing into the desktop layout drops the mobile state. */
    window.addEventListener('resize', function () {
      if (isDesktop() && header.classList.contains('is-open')) { closeMenu(false); }
    });
  }

  /* ------------------------------------------------------------------------
     8. Forms
     Declarative, so the same engine runs the waitlist forms, the contact form
     and the apply form. A form opts in with data-form and describes itself in
     markup:

       data-form="waitlist"            the kind, carried into the payload
       data-vertical="peptides"        which category the lead is for
       data-show-when="name=value"     on a group, reveals it conditionally
       data-soft-message               shown when the answer is not processing
       data-success                    the panel shown after a valid submit

     Nothing is posted anywhere. The form validates, shows the success state
     and logs the payload, until the team fills in CONFIG.FORM_ENDPOINT.
     ------------------------------------------------------------------------ */

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var SITE_PATTERN = /^(https?:\/\/)?[^\s.\/]+\.[^\s\/]{2,}.*$/;

  function isHidden(el) {
    return !!(el.closest && el.closest('[hidden]')) || el.offsetParent === null;
  }

  /* A control that is hidden or switched off takes no part in validation and
     never reaches the payload. The kratom form switches fields off when a
     merchant's own state rules them out. */
  function isInactive(el) {
    return el.disabled || isHidden(el);
  }

  /* The nearest ancestor that is switched off, if any. */
  function hiddenContainer(el) {
    var node = el;
    while (node && node.tagName !== 'BODY') {
      if (node.hidden) { return node; }
      node = node.parentElement;
    }
    return null;
  }

  /* Payload rule, which is not the same as the validation rule: a field in a
     step the visitor has already completed is hidden, but its answer counts.
     A field hidden by a conditional rule, or switched off, does not. */
  function skipInPayload(el) {
    if (el.disabled) { return true; }
    var hidden = hiddenContainer(el);
    if (!hidden) { return false; }
    return !hidden.hasAttribute('data-step');
  }

  function checkboxGroup(form, name) {
    return form.querySelectorAll('input[type="checkbox"][name="' + name + '"]');
  }

  function checkedValues(form, name) {
    var nodes = checkboxGroup(form, name);
    var out = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && !nodes[i].disabled) { out.push(nodes[i].value); }
    }
    return out;
  }

  function wrapperOf(control) {
    if (!control.closest) { return null; }
    return control.closest('.field') || control.closest('fieldset');
  }

  function clearError(control) {
    var wrap = wrapperOf(control);
    if (wrap) { wrap.classList.remove('is-invalid'); }
    control.removeAttribute('aria-invalid');
  }

  function markError(control) {
    var wrap = wrapperOf(control);
    if (wrap) { wrap.classList.add('is-invalid'); }
    control.setAttribute('aria-invalid', 'true');
  }

  function groupValue(form, name) {
    var node = form.elements[name];
    if (!node) { return ''; }
    if (typeof node.value === 'string') { return node.value; }
    return '';
  }

  /* Reveal or hide the conditional groups, and the soft message that answers
     a Not yet processing choice. */
  /* A rule reads name=value. Several conditions join with &, and alternative
     values for one field join with |, so
     data-show-when="whatYouSell=Peptides|Kratom&country=Canada" means the
     category is either of those and the country is Canada. */
  function ruleMatches(form, rule) {
    var parts = String(rule).split('&');
    var i;
    for (i = 0; i < parts.length; i++) {
      var pair = parts[i].split('=');
      var current = groupValue(form, pair[0]);
      if ((pair[1] || '').split('|').indexOf(current) === -1) { return false; }
    }
    return true;
  }

  function syncConditionals(form) {
    var groups = form.querySelectorAll('[data-show-when]');
    var i;
    for (i = 0; i < groups.length; i++) {
      var match = ruleMatches(form, groups[i].getAttribute('data-show-when'));
      groups[i].hidden = !match;
      if (!match) {
        var inside = groups[i].querySelectorAll('input, select, textarea');
        var j;
        for (j = 0; j < inside.length; j++) { clearError(inside[j]); }
      }
    }

    /* Notes tied to a ticked box, for example the extracts note. */
    var checkedRules = form.querySelectorAll('[data-show-when-checked]');
    for (i = 0; i < checkedRules.length; i++) {
      var checkedRule = checkedRules[i].getAttribute('data-show-when-checked').split('=');
      checkedRules[i].hidden = checkedValues(form, checkedRule[0]).indexOf(checkedRule[1]) === -1;
    }

    var soft = form.querySelector('[data-soft-message]');
    if (soft) {
      soft.hidden = groupValue(form, 'currentlyProcessing') !== 'no';
    }

    syncStateGate(form);
  }

  /* State gate. A merchant based in a state we cannot support keeps the name
     and email fields, so we can tell them when that changes, and everything
     else switches off. This is a hold, never a decline: the lead still
     submits and carries gate: restricted-state in the payload. */
  function syncStateGate(form) {
    var gate = form.querySelector('[data-state-gate]');
    if (!gate) { return; }

    var select = form.elements[gate.getAttribute('data-state-gate')];
    var code = select ? select.value : '';
    var restricted = !!code && CONFIG.kratomRestrictedStates.indexOf(code) > -1;

    gate.hidden = !restricted;
    form.classList.toggle('is-gated', restricted);

    if (restricted && select.selectedIndex > -1) {
      var slot = gate.querySelector('[data-state-name]');
      if (slot) { slot.textContent = select.options[select.selectedIndex].text; }
    }

    var controls = form.querySelectorAll('input, select, textarea');
    var i;
    for (i = 0; i < controls.length; i++) {
      if (controls[i] === select || controls[i].hasAttribute('data-keep-active')) { continue; }
      controls[i].disabled = restricted;
      if (restricted) { clearError(controls[i]); }
    }

    if (restricted) {
      var invalidGroups = form.querySelectorAll('[data-require-one].is-invalid');
      for (i = 0; i < invalidGroups.length; i++) { invalidGroups[i].classList.remove('is-invalid'); }
    }
  }

  /* ------------------------------------------------------------------------
     Multi step forms
     A form marked data-steps holds one fieldset per step. Only the current
     step is shown, Next validates just that step, and Back keeps everything
     already entered, because nothing is ever cleared or re-rendered.
     ------------------------------------------------------------------------ */

  function setupSteps(form) {
    var steps = form.querySelectorAll('[data-step]');
    if (!steps.length) { return null; }

    var back = form.querySelector('[data-step-back]');
    var next = form.querySelector('[data-step-next]');
    var submit = form.querySelector('[data-step-submit]');
    var progress = form.querySelector('[data-progress]');
    var fill = progress ? progress.querySelector('.progress__fill') : null;
    var stepLabel = progress ? progress.querySelector('[data-progress-step]') : null;
    var nameLabel = progress ? progress.querySelector('[data-progress-name]') : null;
    var current = 0;

    function render() {
      var i;
      for (i = 0; i < steps.length; i++) { steps[i].hidden = i !== current; }
      if (back) { back.hidden = current === 0; }
      if (next) { next.hidden = current === steps.length - 1; }
      if (submit) { submit.hidden = current !== steps.length - 1; }
      if (stepLabel) { stepLabel.textContent = 'Step ' + (current + 1) + ' of ' + steps.length; }
      if (nameLabel) { nameLabel.textContent = steps[current].getAttribute('data-step-name') || ''; }
      /* the fill is set here rather than in CSS, so the stylesheet does not
         need a class per step count */
      if (fill) { fill.style.width = ((current + 1) / steps.length * 100) + '%'; }
    }

    /* A visible blocker, for example kratom with Canada, holds the step. */
    function blocker() {
      var blocks = steps[current].querySelectorAll('[data-blocks-next]');
      var i;
      for (i = 0; i < blocks.length; i++) {
        if (!blocks[i].hidden) { return blocks[i]; }
      }
      return null;
    }

    function goNext() {
      var firstInvalid = validate(form, steps[current]);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      var held = blocker();
      if (held) {
        held.scrollIntoView({ block: 'center' });
        return;
      }
      if (current < steps.length - 1) {
        current = current + 1;
        render();
        form.scrollIntoView({ block: 'start' });
        focusFirst(steps[current]);
      }
    }

    function goBack() {
      if (current > 0) {
        current = current - 1;
        render();
        form.scrollIntoView({ block: 'start' });
        focusFirst(steps[current]);
      }
    }

    function focusFirst(step) {
      var focusables = step.querySelectorAll('input, select, textarea');
      var i;
      for (i = 0; i < focusables.length; i++) {
        if (!isInactive(focusables[i])) { focusables[i].focus(); return; }
      }
    }

    if (next) { next.addEventListener('click', goNext); }
    if (back) { back.addEventListener('click', goBack); }

    /* Return on a text field moves on rather than submitting from step one. */
    form.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') { return; }
      var tag = event.target.tagName;
      if (tag === 'TEXTAREA' || event.target.type === 'submit') { return; }
      if (current < steps.length - 1) {
        event.preventDefault();
        goNext();
      }
    });

    render();

    /* On submit, every step is checked again, and a failure jumps back to the
       step that holds it. Paging forward already validates, so this only
       catches an answer cleared after the fact. */
    function validateAll() {
      var i;
      for (i = 0; i < steps.length; i++) {
        var wasHidden = steps[i].hidden;
        steps[i].hidden = false;
        var firstInvalid = validate(form, steps[i]);
        steps[i].hidden = wasHidden;
        if (firstInvalid) {
          current = i;
          render();
          firstInvalid.focus();
          return firstInvalid;
        }
      }
      return null;
    }

    return {
      blocked: blocker,
      validateAll: validateAll,
      isLast: function () { return current === steps.length - 1; }
    };
  }

  /* UTM parameters ride along with the lead, so marketing can see the source
     without a tracker on the page. */
  function utmParameters() {
    var out = {};
    var found = false;
    try {
      params().forEach(function (value, key) {
        if (key.toLowerCase().indexOf('utm_') === 0) {
          out[key.toLowerCase()] = value;
          found = true;
        }
      });
    } catch (err) {
      return null;
    }
    return found ? out : null;
  }

  /* ?vertical=nutra preselects the category on the apply form, so a link from
     a category page arrives with the answer already given. */
  function applyPreselect(form) {
    var rule = form.getAttribute('data-preselect-from');
    if (!rule) { return; }
    var pair = rule.split(':');
    var wanted = (params().get(pair[0]) || '').toLowerCase();
    if (!wanted) { return; }
    var radios = form.querySelectorAll('input[name="' + pair[1] + '"]');
    var i;
    for (i = 0; i < radios.length; i++) {
      if (radios[i].value.toLowerCase() === wanted) {
        radios[i].checked = true;
        radios[i].dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  }

  /* File inputs list what was chosen. Nothing is uploaded while
     FORM_ENDPOINT is empty, so the payload carries the names only. */
  function setupFileInputs(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    var i;
    for (i = 0; i < inputs.length; i++) {
      (function (input) {
        var list = form.querySelector('[data-file-list="' + input.name + '"]');
        input.addEventListener('change', function () {
          if (!list) { return; }
          list.innerHTML = '';
          var j;
          for (j = 0; j < input.files.length; j++) {
            var li = document.createElement('li');
            li.textContent = input.files[j].name;
            list.appendChild(li);
          }
        });
      }(inputs[i]));
    }
  }

  function fileNames(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    var out = {};
    var i, j;
    for (i = 0; i < inputs.length; i++) {
      if (skipInPayload(inputs[i]) || !inputs[i].files.length) { continue; }
      var names = [];
      for (j = 0; j < inputs[i].files.length; j++) { names.push(inputs[i].files[j].name); }
      out[inputs[i].name] = names;
    }
    return out;
  }

  /* The visitor's own timezone, shown next to the best time question so the
     answer means something. */
  function showTimezone(form) {
    var slots = form.querySelectorAll('[data-timezone]');
    if (!slots.length) { return; }
    var zone = '';
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (err) {
      zone = '';
    }
    var i;
    for (i = 0; i < slots.length; i++) {
      slots[i].textContent = zone || 'your local time';
    }
    var hidden = form.querySelector('input[name="timezone"]');
    if (hidden) { hidden.value = zone; }
  }

  function validate(form, scope) {
    var within = scope || form;
    var controls = within.querySelectorAll('input, select, textarea');
    var firstInvalid = null;
    var seenGroups = {};
    var i;

    /* A checkbox group marked data-require-one needs at least one tick. */
    var groups = within.querySelectorAll('[data-require-one]');
    for (i = 0; i < groups.length; i++) {
      var groupName = groups[i].getAttribute('data-require-one');
      var boxes = checkboxGroup(form, groupName);
      if (!boxes.length || isInactive(boxes[0])) { continue; }
      if (!checkedValues(form, groupName).length) {
        groups[i].classList.add('is-invalid');
        if (!firstInvalid) { firstInvalid = boxes[0]; }
      } else {
        groups[i].classList.remove('is-invalid');
      }
    }

    for (i = 0; i < controls.length; i++) {
      var control = controls[i];
      if (!control.required || isInactive(control)) { continue; }
      var bad = false;

      if (control.type === 'radio') {
        if (seenGroups[control.name]) { continue; }
        seenGroups[control.name] = true;
        bad = !groupValue(form, control.name);
      } else if (control.type === 'checkbox') {
        bad = !control.checked;
      } else {
        var value = (control.value || '').trim();
        bad = !value;
        if (!bad && control.type === 'email') { bad = !EMAIL_PATTERN.test(value); }
        if (!bad && control.getAttribute('inputmode') === 'url') { bad = !SITE_PATTERN.test(value); }
      }

      if (bad) {
        markError(control);
        if (!firstInvalid) { firstInvalid = control; }
      } else {
        clearError(control);
      }
    }

    return firstInvalid;
  }

  function buildPayload(form) {
    var fields = {};
    var controls = form.querySelectorAll('input, select, textarea');
    var i;

    for (i = 0; i < controls.length; i++) {
      var control = controls[i];
      if (!control.name || skipInPayload(control)) { continue; }
      /* file inputs report through the files key, not as a field value */
      if (control.type === 'file') { continue; }
      if (control.type === 'radio') {
        if (control.checked) { fields[control.name] = control.value; }
      } else if (control.type === 'checkbox') {
        if (checkboxGroup(form, control.name).length > 1) {
          fields[control.name] = checkedValues(form, control.name);
        } else {
          fields[control.name] = control.checked;
        }
      } else {
        fields[control.name] = (control.value || '').trim();
      }
    }

    var email = (fields.workEmail || '').toLowerCase();
    var domain = email.indexOf('@') > -1 ? email.split('@')[1] : '';
    var freemail = CONFIG.freemailDomains.indexOf(domain) > -1;

    /* An apply form that picks a category which is not open yet becomes a
       waitlist lead, with the details already on file. */
    var source = form.getAttribute('data-form') || 'form';
    var waitlistRule = form.getAttribute('data-waitlist-when');
    if (waitlistRule && ruleMatches(form, waitlistRule)) { source = 'waitlist'; }

    var vertical = form.getAttribute('data-vertical') || '';
    var categoryField = form.getAttribute('data-vertical-from');
    if (categoryField) { vertical = groupValue(form, categoryField).toLowerCase(); }

    var files = fileNames(form);
    var utm = utmParameters();

    return {
      source: source,
      vertical: vertical,
      submittedAt: new Date().toISOString(),
      /* Rule B: a lead with no processing track record is tagged, never
         declined. Unknown means the question did not apply, for example when
         a merchant's own state switched the rest of the form off. */
      history: processingHistory(form),
      emailType: freemail ? 'freemail' : 'business',
      gate: form.classList.contains('is-gated') ? 'restricted-state' : null,
      utm: utm,
      files: files,
      fields: fields
    };
  }

  function processingHistory(form) {
    var answer = groupValue(form, 'currentlyProcessing');
    if (answer === 'no') { return 'none'; }
    if (answer === 'yes') { return 'active'; }
    return 'unknown';
  }

  function showSuccess(form) {
    var success = document.querySelector('[data-success][data-for="' + form.id + '"]');
    if (!success) { return; }
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ block: 'center' });
    success.focus();
  }

  function setupForms() {
    var forms = document.querySelectorAll('form[data-form]');
    var i;

    for (i = 0; i < forms.length; i++) {
      (function (form) {
        var steps = setupSteps(form);
        setupFileInputs(form);
        showTimezone(form);
        applyPreselect(form);
        syncConditionals(form);

        form.addEventListener('change', function (event) {
          /* clear on change as well as input, so a radio, a checkbox or a
             select drops its error as soon as the answer is given */
          if (event.target && event.target.name) { clearError(event.target); }
          syncConditionals(form);
        });

        form.addEventListener('input', function (event) {
          if (event.target && event.target.name) { clearError(event.target); }
        });

        /* The private application has its own submit handler in section 10,
           with a redacted payload and its own extra checks. Without this guard
           both handlers would run, and the second would read a form the first
           had already hidden. */
        if (form.getAttribute('data-form') === 'application') { return; }

        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var firstInvalid = steps ? steps.validateAll() : validate(form);
          if (firstInvalid) {
            firstInvalid.focus();
            return;
          }
          /* a blocker on the last step holds the submit too */
          if (steps) {
            var held = steps.blocked();
            if (held) {
              held.scrollIntoView({ block: 'center' });
              return;
            }
          }

          var isLead = form.getAttribute('data-form') === 'lead';
          var payload = isLead ? buildLeadPayload(form) : buildPayload(form);

          /* FORM_ENDPOINT is empty on purpose. The team wires the POST here,
             and nothing leaves the page until they do. */
          if (!CONFIG.FORM_ENDPOINT) {
            console.log(CONFIG.BRAND_NAME + ' form payload', payload);
            console.log(JSON.stringify(payload, null, 2));
          }

          if (isLead) { sendLead(form); } else { showSuccess(form); }
        });
      }(forms[i]));
    }
  }

  /* ------------------------------------------------------------------------
     9. Structured data
     Built here rather than hand written into each page, so the brand name
     comes from CONFIG and the FAQ blocks are read from the visible text, word
     for word. In production the same objects should be rendered server side.

     The base URL is a placeholder. Replace SITE_BASE and the addresses in one
     place when the domain lands.
     ------------------------------------------------------------------------ */

  var SITE_BASE = 'https://[PLACEHOLDER: domain]';

  /* Service blocks, one per category page. Kratom is United States only. */
  var SERVICE_BY_PAGE = {
    'nutra.html': { name: 'Nutra and supplement payment processing', areas: ['US', 'CA'] },
    'peptides.html': { name: 'Peptide payment processing', areas: ['US', 'CA'] },
    'kratom.html': { name: 'Kratom payment processing', areas: ['US'] }
  };

  /* Breadcrumb names, so the trail reads like the navigation rather than the
     meta title. */
  var BREADCRUMB_NAMES = {
    'nutra.html': 'Nutra',
    'peptides.html': 'Peptides',
    'kratom.html': 'Kratom',
    'apply.html': 'Get my custom rate',
    'contact.html': 'Talk to underwriting',
    'terms.html': 'Terms',
    'privacy.html': 'Privacy',
    'acceptable-use.html': 'Acceptable use and restricted products',
    'restricted-regions.html': 'Restricted regions'
  };

  function pageUrl() {
    var file = currentPage();
    var path = window.location.pathname;
    var inLegal = path.indexOf('/legal/') > -1;
    return SITE_BASE + '/' + (inLegal ? 'legal/' : '') + file;
  }

  function organizationNode() {
    return {
      '@type': 'Organization',
      'name': CONFIG.BRAND_NAME,
      'url': SITE_BASE + '/',
      'contactPoint': [{
        '@type': 'ContactPoint',
        'contactType': 'underwriting',
        'email': 'underwriting@[PLACEHOLDER: domain]',
        'areaServed': ['US', 'CA'],
        'availableLanguage': 'en'
      }]
    };
  }

  function serviceNode() {
    var service = SERVICE_BY_PAGE[currentPage()];
    if (!service) { return null; }
    var areas = [];
    var i;
    for (i = 0; i < service.areas.length; i++) {
      areas.push({ '@type': 'Country', 'name': service.areas[i] });
    }
    return {
      '@type': 'Service',
      'name': service.name,
      'serviceType': 'Payment processing',
      'areaServed': areas,
      'url': pageUrl(),
      'provider': {
        '@type': 'Organization',
        'name': CONFIG.BRAND_NAME,
        'url': SITE_BASE + '/'
      }
    };
  }

  /* Read the questions and answers off the page, so the markup and the
     structured data can never say different things. A placeholder inside an
     answer appears here too, on purpose: it shows up in testing rather than
     going live unnoticed. */
  function faqNode() {
    var items = document.querySelectorAll('.faq__item');
    if (!items.length) { return null; }
    var questions = [];
    var i;
    for (i = 0; i < items.length; i++) {
      var summary = items[i].querySelector('summary');
      var body = items[i].querySelector('.faq__body');
      if (!summary || !body) { continue; }
      questions.push({
        '@type': 'Question',
        'name': summary.textContent.replace(/\s+/g, ' ').trim(),
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': body.textContent.replace(/\s+/g, ' ').trim()
        }
      });
    }
    if (!questions.length) { return null; }

    /* A marker that is still in an answer would be published as structured
       data, so it is called out in the console rather than slipping through. */
    var unresolved = [];
    for (i = 0; i < questions.length; i++) {
      if (/\[(PLACEHOLDER|CONFIRM):/.test(questions[i].acceptedAnswer.text)) {
        unresolved.push(questions[i].name);
      }
    }
    if (unresolved.length) {
      console.warn(CONFIG.BRAND_NAME + ' FAQ structured data still contains placeholders', unresolved);
    }

    return { '@type': 'FAQPage', 'mainEntity': questions };
  }

  function breadcrumbNode() {
    var file = currentPage();
    if (file === 'index.html') { return null; }
    var name = BREADCRUMB_NAMES[file];
    if (!name) { return null; }
    return {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_BASE + '/' },
        { '@type': 'ListItem', 'position': 2, 'name': name, 'item': pageUrl() }
      ]
    };
  }

  function renderStructuredData() {
    /* A private page is noindex and nofollow, so it carries no structured data. */
    if (document.body.hasAttribute('data-private')) { return; }
    var nodes = [organizationNode(), serviceNode(), faqNode(), breadcrumbNode()];
    var graph = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i]) { graph.push(nodes[i]); }
    }
    if (!graph.length) { return; }

    var payload = { '@context': 'https://schema.org', '@graph': graph };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-generated', 'js/main.js');
    /* textContent, never innerHTML, so nothing in the page copy can break out
       of the script element */
    script.textContent = JSON.stringify(payload, null, 2);
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------------
     10. Private onboarding pages
     /onboarding/application.html and /onboarding/invite.html. Never linked
     from a public page. The application opens only with a ref in the URL, and
     the masked fields never reach a draft or a log.
     ------------------------------------------------------------------------ */

  var REF_PATTERN = /^PL-[A-Z0-9]{6}$/i;
  var DRAFT_PREFIX = 'plp.application.';

  function countryByCode(code) {
    var list = CONFIG.supportedCountries || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].code === code) { return list[i]; }
    }
    return null;
  }

  function fillCountrySelect(select, firstLabel) {
    if (!select || select.options.length > 1) { return; }
    var list = CONFIG.supportedCountries || [];
    var i;
    select.innerHTML = '<option value="">' + (firstLabel || 'Select a country') + '</option>';
    for (i = 0; i < list.length; i++) {
      select.innerHTML += '<option value="' + list[i].code + '">' + list[i].label + '</option>';
    }
  }

  /* Swap the labels that change with the country. Scope is the form for the
     business country, or a single owner card for an owner's country. */
  function applyCountryLabels(scope, code, keys) {
    var country = countryByCode(code);
    var i;
    for (i = 0; i < keys.length; i++) {
      var slot = scope.querySelector('[data-label="' + keys[i] + '"]');
      if (slot) {
        slot.textContent = country ? country[keys[i]] : slot.getAttribute('data-label-default') || slot.textContent;
      }
    }
  }

  /* ---------------------------------------------------- owners and repeaters */

  var ownerCount = 0;

  function ownerCardMarkup(index) {
    var n = index;
    var id = function (name) { return 'owner-' + n + '-' + name; };
    return '' +
      '<div class="owner-card" data-owner>' +
        '<div class="owner-card__head">' +
          '<h3 class="card__title">Owner ' + n + '</h3>' +
          '<button class="btn btn--ghost btn--compact" type="button" data-owner-remove>Remove</button>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="' + id('role') + '">Role</label>' +
          '<select class="select" id="' + id('role') + '" name="owners[' + n + '][role]" required>' +
            '<option value="">Select a role</option>' +
            '<option value="Owner">Owner</option>' +
            '<option value="Officer or director">Officer or director</option>' +
            '<option value="Controls the business day to day">Controls the business day to day</option>' +
          '</select>' +
          '<p class="field__error">Select this person\'s role.</p>' +
        '</div>' +

        '<div class="field"><label class="field__label" for="' + id('first') + '">First name</label>' +
          '<input class="input" type="text" id="' + id('first') + '" name="owners[' + n + '][firstName]" required>' +
          '<p class="field__error">Enter their first name.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('last') + '">Last name</label>' +
          '<input class="input" type="text" id="' + id('last') + '" name="owners[' + n + '][lastName]" required>' +
          '<p class="field__error">Enter their last name.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('country') + '">Home country</label>' +
          '<select class="select" id="' + id('country') + '" name="owners[' + n + '][country]" required data-owner-country>' +
            '<option value="">Select a country</option>' +
          '</select>' +
          '<p class="field__error">Select their home country.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('street') + '">Home address</label>' +
          '<input class="input" type="text" id="' + id('street') + '" name="owners[' + n + '][street]" required>' +
          '<p class="field__error">Enter their home address.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('city') + '">City</label>' +
          '<input class="input" type="text" id="' + id('city') + '" name="owners[' + n + '][city]" required>' +
          '<p class="field__error">Enter the city.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('region') + '"><span data-label="region">State or region</span></label>' +
          '<input class="input" type="text" id="' + id('region') + '" name="owners[' + n + '][region]" required>' +
          '<p class="field__error">Enter the state, province or region.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('postcode') + '"><span data-label="postcode">Postal code</span></label>' +
          '<input class="input" type="text" id="' + id('postcode') + '" name="owners[' + n + '][postcode]" required>' +
          '<p class="field__error">Enter the postal code.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('dob') + '">Date of birth</label>' +
          '<input class="input" type="date" id="' + id('dob') + '" name="owners[' + n + '][dateOfBirth]" required data-sensitive>' +
          '<p class="field__hint">Never saved in a draft and never logged by this wireframe.</p>' +
          '<p class="field__error">Enter their date of birth.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('pid') + '"><span data-label="personalId">National ID</span></label>' +
          '<input class="input" type="password" id="' + id('pid') + '" name="owners[' + n + '][personalId]" autocomplete="off" required data-sensitive>' +
          '<p class="field__hint">Masked.</p>' +
          '<p class="field__error">Enter their national ID number.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('idtype') + '">ID document type</label>' +
          '<select class="select" id="' + id('idtype') + '" name="owners[' + n + '][idType]" required>' +
            '<option value="">Select a document</option>' +
            '<option value="Passport">Passport</option>' +
            '<option value="Driving licence">Driving licence</option>' +
            '<option value="National ID card">National ID card</option>' +
          '</select>' +
          '<p class="field__error">Select the document you will send.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('idnum') + '">ID document number</label>' +
          '<input class="input" type="password" id="' + id('idnum') + '" name="owners[' + n + '][idNumber]" autocomplete="off" required data-sensitive>' +
          '<p class="field__hint">Masked.</p>' +
          '<p class="field__error">Enter the document number.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('share') + '">Ownership</label>' +
          '<input class="input" type="number" id="' + id('share') + '" name="owners[' + n + '][ownership]" min="0" max="100" required data-owner-share>' +
          '<p class="field__hint">A percentage.</p>' +
          '<p class="field__error">Enter a number between 0 and 100.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('email') + '">Email</label>' +
          '<input class="input" type="email" id="' + id('email') + '" name="owners[' + n + '][email]" required>' +
          '<p class="field__error">Enter an email address for this person.</p></div>' +

        '<div class="field"><label class="field__label" for="' + id('phone') + '">Phone</label>' +
          '<input class="input" type="tel" id="' + id('phone') + '" name="owners[' + n + '][phone]" required>' +
          '<p class="field__error">Enter a phone number for this person.</p></div>' +

        '<div class="field">' +
          '<label class="checkbox"><input type="checkbox" name="owners[' + n + '][guarantor]" value="yes"><span>This person will act as a personal guarantor. <span class="ph-text">[CONFIRM: whether a personal guarantee is required]</span></span></label>' +
        '</div>' +
      '</div>';
  }

  function addOwner(list) {
    ownerCount = ownerCount + 1;
    list.insertAdjacentHTML('beforeend', ownerCardMarkup(ownerCount));
    var card = list.lastElementChild;
    var select = card.querySelector('[data-owner-country]');
    fillCountrySelect(select);
    select.addEventListener('change', function () {
      applyCountryLabels(card, select.value, ['region', 'postcode', 'personalId']);
    });
    return card;
  }

  function updateOwnerTotal(form) {
    var slot = form.querySelector('[data-owner-total]');
    if (!slot) { return; }
    var shares = form.querySelectorAll('[data-owner-share]');
    var total = 0;
    var i;
    for (i = 0; i < shares.length; i++) {
      total += parseFloat(shares[i].value || 0) || 0;
    }
    slot.textContent = 'Ownership listed: ' + total + '%';
    slot.classList.toggle('is-over', total > 100);
  }

  function setupRepeaters(form) {
    var groups = form.querySelectorAll('[data-repeater]');
    var i;
    for (i = 0; i < groups.length; i++) {
      (function (group) {
        var list = group.querySelector('[data-repeater-list]');
        var add = group.querySelector('[data-repeater-add]');
        if (!list || !add) { return; }
        add.addEventListener('click', function () {
          var row = list.firstElementChild.cloneNode(true);
          var input = row.querySelector('input');
          input.value = '';
          input.removeAttribute('id');
          row.insertAdjacentHTML('beforeend', '<button class="btn btn--ghost btn--compact" type="button" data-repeater-remove>Remove</button>');
          list.appendChild(row);
        });
        list.addEventListener('click', function (event) {
          var remove = event.target.closest ? event.target.closest('[data-repeater-remove]') : null;
          if (remove) { remove.parentElement.remove(); }
        });
      }(groups[i]));
    }
  }

  /* ----------------------------------------------------------- percentages */

  function percentTotals(form) {
    var groups = form.querySelectorAll('[data-percent-group]');
    var worst = null;
    var i, j;
    for (i = 0; i < groups.length; i++) {
      var name = groups[i].getAttribute('data-percent-group');
      var inputs = groups[i].querySelectorAll('[data-percent]');
      var total = 0;
      for (j = 0; j < inputs.length; j++) { total += parseFloat(inputs[j].value || 0) || 0; }
      var slot = form.querySelector('[data-percent-total="' + name + '"]');
      if (slot) {
        slot.textContent = 'Total: ' + total;
        slot.classList.toggle('is-over', total !== 100 && total !== 0);
      }
      groups[i].classList.toggle('is-invalid', total !== 100);
      if (total !== 100 && !worst) { worst = inputs[0]; }
    }
    return worst;
  }

  /* ------------------------------------------------- settlement validation */

  function ibanValid(value) {
    var v = String(value).replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(v)) { return false; }
    var moved = v.slice(4) + v.slice(0, 4);
    var digits = '';
    var i;
    for (i = 0; i < moved.length; i++) {
      var c = moved.charAt(i);
      digits += /[0-9]/.test(c) ? c : String(c.charCodeAt(0) - 55);
    }
    /* mod 97 in chunks, because the number is longer than a float can hold */
    var remainder = 0;
    for (i = 0; i < digits.length; i += 7) {
      remainder = parseInt(String(remainder) + digits.substr(i, 7), 10) % 97;
    }
    return remainder === 1;
  }

  var WALLET_PATTERNS = {
    Ethereum: /^0x[a-fA-F0-9]{40}$/,
    Base: /^0x[a-fA-F0-9]{40}$/,
    Polygon: /^0x[a-fA-F0-9]{40}$/,
    Arbitrum: /^0x[a-fA-F0-9]{40}$/,
    Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    Tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/
  };

  /* Checks the application cannot express in markup alone. Returns the first
     control to fix, or null. */
  function applicationExtras(form) {
    var first = null;
    var fail = function (el) { if (el && !first) { first = el; } markError(el); };

    var pct = percentTotals(form);
    if (pct) { fail(pct); }

    var pairs = [['accountNumber', 'accountNumberConfirm'], ['walletAddress', 'walletAddressConfirm']];
    var i;
    for (i = 0; i < pairs.length; i++) {
      var a = form.elements[pairs[i][0]];
      var b = form.elements[pairs[i][1]];
      if (!a || !b || isInactive(a)) { continue; }
      if ((a.value || '').trim() && (a.value || '').trim() !== (b.value || '').trim()) { fail(b); }
    }

    var account = form.elements.accountNumber;
    var bankCountry = form.elements.bankCountry;
    var bankCode = form.elements.bankCode;
    if (account && !isInactive(account) && (account.value || '').trim()) {
      var raw = account.value.replace(/\s+/g, '');
      if (/^[A-Z]{2}[0-9]{2}/i.test(raw) && !ibanValid(raw)) { fail(account); }
    }
    if (bankCode && !isInactive(bankCode) && bankCountry && bankCountry.value === 'US') {
      if (!/^[0-9]{9}$/.test((bankCode.value || '').replace(/\s+/g, ''))) { fail(bankCode); }
    }

    var wallet = form.elements.walletAddress;
    var network = form.elements.network;
    if (wallet && !isInactive(wallet) && (wallet.value || '').trim() && network && network.value) {
      var pattern = WALLET_PATTERNS[network.value];
      if (pattern && !pattern.test(wallet.value.trim())) { fail(wallet); }
    }

    return first;
  }

  /* ------------------------------------------------- progress, draft, review */

  function applicationProgress(form) {
    var controls = form.querySelectorAll('input[required], select[required], textarea[required]');
    var total = 0, done = 0;
    var i;
    for (i = 0; i < controls.length; i++) {
      if (isInactive(controls[i])) { continue; }
      total++;
      var c = controls[i];
      if (c.type === 'checkbox' || c.type === 'radio') {
        if (groupValue(form, c.name) || c.checked) { done++; }
      } else if ((c.value || '').trim()) {
        done++;
      }
    }
    var percent = total ? Math.round((done / total) * 100) : 0;
    var label = form.ownerDocument.querySelector('[data-progress-label]');
    var fill = form.ownerDocument.querySelector('[data-progress-fill]');
    if (label) { label.textContent = percent + '% complete'; }
    if (fill) { fill.style.width = percent + '%'; }
    return percent;
  }

  /* A draft holds the answers someone would hate to retype, and never a masked
     field, a date of birth or a file. */
  function draftKey(ref) { return DRAFT_PREFIX + ref; }

  function saveDraft(form, ref) {
    var data = {};
    var controls = form.querySelectorAll('input, select, textarea');
    var i;
    for (i = 0; i < controls.length; i++) {
      var c = controls[i];
      if (!c.name || c.hasAttribute('data-sensitive') || c.type === 'file' || c.type === 'password') { continue; }
      if (c.type === 'checkbox') { data[c.name] = c.checked; }
      else if (c.type === 'radio') { if (c.checked) { data[c.name] = c.value; } }
      else { data[c.name] = c.value; }
    }
    storeSet(draftKey(ref), JSON.stringify({ savedAt: new Date().toISOString(), fields: data }));
    return Object.keys(data).length;
  }

  function restoreDraft(form, ref) {
    var raw = storeGet(draftKey(ref));
    if (!raw) { return null; }
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (err) { return null; }
    if (!parsed || !parsed.fields) { return null; }
    var name;
    for (name in parsed.fields) {
      if (!Object.prototype.hasOwnProperty.call(parsed.fields, name)) { continue; }
      var node = form.elements[name];
      if (!node) { continue; }
      var value = parsed.fields[name];
      if (node.length && node[0] && node[0].type === 'radio') { node.value = value; }
      else if (node.type === 'checkbox') { node.checked = !!value; }
      else { node.value = value; }
    }
    return parsed.savedAt;
  }

  function buildSummary(form) {
    var box = form.querySelector('[data-summary]');
    if (!box) { return; }
    var sections = form.querySelectorAll('[data-app-section]');
    var html = '';
    var i, j;
    for (i = 0; i < sections.length - 1; i++) {
      var id = sections[i].getAttribute('data-app-section');
      var title = sections[i].querySelector('.app-section__title').textContent.replace(/^[0-9]+/, '').trim();
      var rows = '';
      var controls = sections[i].querySelectorAll('input, select, textarea');
      for (j = 0; j < controls.length; j++) {
        var c = controls[j];
        if (!c.name || isInactive(c)) { continue; }
        if (c.type === 'radio' && !c.checked) { continue; }
        var label = '';
        var wrap = c.closest('.field') || c.closest('fieldset');
        if (wrap) {
          var lab = wrap.querySelector('.field__label, legend');
          if (lab) { label = lab.textContent.trim(); }
        }
        var value = c.hasAttribute('data-sensitive') || c.type === 'password' ? 'Provided, masked'
          : c.type === 'checkbox' ? (c.checked ? 'Yes' : 'No')
          : c.type === 'file' ? (c.files.length + ' file(s)')
          : (c.value || '').trim();
        if (!value) { continue; }
        rows += '<div class="app-summary__row"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
      }
      html += '<div class="app-summary__block">' +
        '<p class="app-summary__head">' + title +
        ' <a href="#' + id + '">Edit</a></p>' +
        (rows ? '<dl class="app-summary__list">' + rows + '</dl>' : '<p class="meta-line">Nothing filled in yet.</p>') +
        '</div>';
    }
    box.innerHTML = html;
  }

  /* The payload a production endpoint would receive, with every masked field
     replaced before it is logged. Flags carry only what underwriting sorts on. */
  function buildApplicationPayload(form, ref) {
    var fields = {};
    var controls = form.querySelectorAll('input, select, textarea');
    var i;
    for (i = 0; i < controls.length; i++) {
      var c = controls[i];
      if (!c.name || isInactive(c)) { continue; }
      if (c.hasAttribute('data-sensitive') || c.type === 'password') { fields[c.name] = '[redacted]'; continue; }
      if (c.type === 'file') { fields[c.name] = c.files.length ? c.files.length + ' file(s)' : ''; continue; }
      if (c.type === 'radio') { if (c.checked) { fields[c.name] = c.value; } continue; }
      if (c.type === 'checkbox') { fields[c.name] = c.checked; continue; }
      fields[c.name] = (c.value || '').trim();
    }
    return {
      source: 'application',
      ref: ref,
      submittedAt: new Date().toISOString(),
      flags: {
        priorTermination: groupValue(form, 'priorTermination') === 'yes',
        noHistory: groupValue(form, 'currentlyProcessing') === 'no'
      },
      fields: fields
    };
  }

  /* ------------------------------------------------------------- the page */

  function setupApplication() {
    var gate = document.querySelector('[data-private-gate]');
    var app = document.querySelector('[data-private-app]');
    if (!gate || !app) { return; }

    var ref = (params().get('ref') || '').toUpperCase();
    if (!REF_PATTERN.test(ref)) {
      gate.hidden = false;
      return;
    }
    app.hidden = false;

    var label = document.querySelector('[data-ref-label]');
    if (label) { label.textContent = 'Application ' + ref; }

    var form = document.getElementById('application-form');
    if (!form) { return; }

    /* countries, and the labels that follow from them */
    var countrySelect = form.querySelector('[data-country-select]');
    var bankCountry = form.querySelector('[data-bank-country]');
    fillCountrySelect(countrySelect);
    fillCountrySelect(bankCountry);
    if (countrySelect) {
      countrySelect.addEventListener('change', function () {
        applyCountryLabels(form, countrySelect.value, ['region', 'postcode', 'taxId']);
      });
    }
    if (bankCountry) {
      bankCountry.addEventListener('change', function () {
        applyCountryLabels(form, bankCountry.value, ['bankCode']);
      });
    }

    /* the lead, as it arrived with the invite */
    var lead = CONFIG.DEMO_LEAD || {};
    if (form.elements.legalName && !form.elements.legalName.value) { form.elements.legalName.value = lead.name ? lead.name + ' Ltd' : ''; }
    if (form.elements.supportEmail) { form.elements.supportEmail.value = lead.email || ''; }
    if (form.elements['websites[]']) {
      var first = form.querySelectorAll('input[name="websites[]"]')[0];
      if (first) { first.value = lead.website || ''; }
    }
    if (form.elements.volumeBand) { form.elements.volumeBand.value = lead.volumeBand || ''; }

    /* owners, repeaters and totals */
    var ownerList = form.querySelector('[data-owner-list]');
    if (ownerList) {
      addOwner(ownerList);
      var addButton = form.querySelector('[data-owner-add]');
      if (addButton) { addButton.addEventListener('click', function () { addOwner(ownerList); updateOwnerTotal(form); }); }
      ownerList.addEventListener('click', function (event) {
        var remove = event.target.closest ? event.target.closest('[data-owner-remove]') : null;
        if (remove && form.querySelectorAll('[data-owner]').length > 1) {
          remove.closest('[data-owner]').remove();
          updateOwnerTotal(form);
        }
      });
    }
    setupRepeaters(form);

    /* trading name toggle */
    var same = form.querySelector('[data-same-as-legal]');
    var tradingField = form.querySelector('[data-trading-field]');
    if (same && tradingField) {
      var trading = tradingField.querySelector('input');
      same.addEventListener('change', function () {
        trading.disabled = same.checked;
        if (same.checked) { trading.value = ''; clearError(trading); }
        tradingField.classList.toggle('is-muted', same.checked);
      });
    }

    /* draft, progress and the running summary */
    var savedAt = restoreDraft(form, ref);
    var status = document.querySelector('[data-save-status]');
    if (savedAt && status) { status.textContent = 'Draft restored from this browser.'; }

    var refresh = function () {
      updateOwnerTotal(form);
      percentTotals(form);
      applicationProgress(form);
      buildSummary(form);
    };
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    var saveButton = document.querySelector('[data-save-draft]');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        var saved = saveDraft(form, ref);
        if (status) {
          status.textContent = saved + ' answers saved in this browser. Masked fields are never saved.';
        }
      });
    }

    var emailButton = document.querySelector('[data-email-link]');
    if (emailButton) {
      emailButton.addEventListener('click', function () {
        if (status) {
          status.textContent = 'We would email this link to ' + (lead.email || 'your address') + '. Nothing is sent from the wireframe.';
        }
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var firstInvalid = validate(form);
      var extra = applicationExtras(form);
      if (!firstInvalid) { firstInvalid = extra; }
      if (firstInvalid) {
        var section = firstInvalid.closest('[data-app-section]');
        if (section) { section.scrollIntoView({ block: 'start' }); }
        firstInvalid.focus();
        return;
      }
      var payload = buildApplicationPayload(form, ref);
      if (!CONFIG.FORM_ENDPOINT) {
        console.log(CONFIG.BRAND_NAME + ' application payload', payload);
        console.log(JSON.stringify(payload, null, 2));
      }
      showSuccess(form);
    });
  }

  /* ------------------------------------------------------- the invite page */

  function setupInvite() {
    var table = document.querySelector('[data-lead-table]');
    if (!table) { return; }
    var panel = document.querySelector('[data-invite-panel]');
    var linkField = document.querySelector('[data-invite-link]');
    var preview = document.querySelector('[data-invite-preview]');
    var copy = document.querySelector('[data-invite-copy]');
    var status = document.querySelector('[data-invite-status]');

    table.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('[data-create-link]') : null;
      if (!button) { return; }
      var row = button.closest('tr');
      var name = row.getAttribute('data-lead-name') || '';
      var firstName = name.split(' ')[0];
      var ref = newLeadId();
      var base = window.location.href.split('/invite.html')[0];
      var link = base + '/application.html?ref=' + ref;

      panel.hidden = false;
      linkField.value = link;
      preview.textContent = 'Hi ' + firstName + ', thanks for your interest in ' + CONFIG.BRAND_NAME + '. ' +
        'We\'ve reviewed your details and we\'d like to move you to the next step. ' +
        'Here\'s your private link to the full application: ' + link + '. ' +
        'You can save and come back at any time. It helps to have your business registration, owner ID, ' +
        'recent processing statements and settlement details to hand. Any questions, just reply to this email. ' +
        '[Underwriter name], ' + CONFIG.BRAND_NAME;
      var cell = row.querySelector('[data-lead-status]');
      if (cell) { cell.textContent = 'Invited'; }
      if (status) { status.textContent = 'Link created for ' + name + '. Nothing is emailed from the wireframe.'; }
      panel.scrollIntoView({ block: 'center' });
    });

    if (copy) {
      copy.addEventListener('click', function () {
        linkField.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        if (status) { status.textContent = ok ? 'Link copied.' : 'Select the link and copy it.'; }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Mount everything
     ------------------------------------------------------------------------ */

  function renderChrome() {
    var head = document.getElementById('site-header');
    if (head) {
      head.insertAdjacentHTML('afterbegin', headerMarkup());
      markCurrent(head);
    }

    var foot = document.getElementById('site-footer');
    if (foot) {
      foot.insertAdjacentHTML('afterbegin', footerMarkup());
      markCurrent(foot);
    }

    var blocks = document.querySelectorAll('[data-block]');
    var i;
    for (i = 0; i < blocks.length; i++) {
      var mount = blocks[i];
      var kind = mount.getAttribute('data-block');
      if (kind === 'final-cta') {
        mount.insertAdjacentHTML('afterbegin', finalCtaMarkup(mount));
      } else if (kind === 'trust-strip') {
        mount.insertAdjacentHTML('afterbegin', trustStripMarkup());
      } else if (kind === 'how-it-works') {
        mount.insertAdjacentHTML('afterbegin', howItWorksMarkup(mount));
      } else if (kind === 'lead-form') {
        mount.insertAdjacentHTML('afterbegin', leadFormMarkup(mount));
      } else if (kind === 'kratom-states') {
        mount.insertAdjacentHTML('afterbegin', kratomStatesMarkup());
      }
    }
  }

  /* ------------------------------------------------------------------------
     7. Review bar, injected on every page
     ------------------------------------------------------------------------ */

  var bar = null;

  function barButton(label, attr, value) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review-bar__btn';
    btn.textContent = label;
    btn.setAttribute(attr, value);
    btn.setAttribute('aria-pressed', 'false');
    return btn;
  }

  function barRow(label, buttons) {
    var row = document.createElement('div');
    row.className = 'review-bar__row';
    var span = document.createElement('span');
    span.className = 'review-bar__label';
    span.textContent = label;
    row.appendChild(span);
    var group = document.createElement('div');
    group.className = 'review-bar__group';
    var i;
    for (i = 0; i < buttons.length; i++) { group.appendChild(buttons[i]); }
    row.appendChild(group);
    return row;
  }

  var STORE_BAR = 'plp.reviewBar';

  function buildReviewBar() {
    bar = document.createElement('div');
    bar.className = 'review-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Review controls');

    /* The bar floats over the page, so it has to be possible to tuck it away:
       on a narrow screen it would otherwise sit over a call to action. */
    var collapse = document.createElement('button');
    collapse.type = 'button';
    collapse.className = 'review-bar__collapse';
    collapse.setAttribute('aria-expanded', 'true');
    collapse.innerHTML = '<span class="review-bar__collapse-label">Review</span><span class="review-bar__caret" aria-hidden="true"></span>';
    collapse.addEventListener('click', function () {
      var collapsed = bar.classList.toggle('is-collapsed');
      collapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      storeSet(STORE_BAR, collapsed ? 'collapsed' : 'open');
    });
    bar.appendChild(collapse);

    bar.appendChild(barRow('View', [
      barButton('Wireframe', 'data-set-mode', 'wireframe'),
      barButton('Mockup', 'data-set-mode', 'mockup')
    ]));

    bar.appendChild(barRow('Notes', [
      barButton('On', 'data-set-notes', '1'),
      barButton('Off', 'data-set-notes', '0')
    ]));

    bar.addEventListener('click', function (event) {
      var btn = event.target.closest ? event.target.closest('button') : null;
      if (!btn) { return; }
      if (btn.hasAttribute('data-set-mode')) {
        applyMode(btn.getAttribute('data-set-mode'), true);
      } else if (btn.hasAttribute('data-set-notes')) {
        applyNotes(btn.getAttribute('data-set-notes') === '1', true);
      }
      if (!storageOk) { decorateLinks(); }
    });

    if (storeGet(STORE_BAR) === 'collapsed') {
      bar.classList.add('is-collapsed');
      bar.querySelector('.review-bar__collapse').setAttribute('aria-expanded', 'false');
    }

    document.body.appendChild(bar);
  }

  function syncReviewBar() {
    if (!bar) { return; }
    var mode = document.body.getAttribute('data-mode') || DEFAULT_MODE;
    var notes = document.body.getAttribute('data-notes') === '1' ? '1' : '0';
    var btns = bar.querySelectorAll('button');
    var i;
    for (i = 0; i < btns.length; i++) {
      var btn = btns[i];
      if (btn.hasAttribute('data-set-mode')) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-set-mode') === mode ? 'true' : 'false');
      } else if (btn.hasAttribute('data-set-notes')) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-set-notes') === notes ? 'true' : 'false');
      }
    }
  }

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */

  /* A deep link can point at a section that is rendered from a block, for
     example index.html#how-it-works. The browser tries to scroll before that
     block exists, so the jump is repeated once the page is assembled. */
  function honourHash() {
    if (!window.location.hash) { return; }
    try {
      var target = document.querySelector(window.location.hash);
      if (target) { target.scrollIntoView(); }
    } catch (err) {
      /* an unusual hash is not a selector, nothing to do */
    }
  }

  function init() {
    applyMode(resolveMode(), true);
    applyNotes(resolveNotes(), true);
    /* chrome first: the annotation layer and the brand name both read markup
       that does not exist until the header, footer and blocks are mounted */
    renderChrome();
    setupMenus();
    applyBrandName();
    applyTestimonialSwitch();
    buildNoteTags();
    setupForms();
    setupApplication();
    setupInvite();
    /* after the chrome and the blocks, so an injected FAQ or footer is in the
       document before the structured data reads it */
    renderStructuredData();
    buildReviewBar();
    syncReviewBar();
    if (!storageOk) { decorateLinks(); }
    honourHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
