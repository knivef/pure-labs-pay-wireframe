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

  supportedCountries: [
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' }
  ],

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
              '<p class="site-footer__about"><span data-brand>' + BRAND_NAME_IN_MARKUP + '</span> provides card processing for nutra, peptide and kratom brands in the United States and Canada, through partner acquiring banks.</p>' +
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
    var heading = mount.getAttribute('data-heading') || 'From statements to processing in three steps';
    return '' +
      '<section class="section section--bordered" id="how-it-works" data-note="Intent: three steps, and step one is the statements, which is how the history requirement is signalled without ever being stated. | SEO: anchor target for the How it works link in the header and the footer. | Dev: block rendered from js/main.js, used on the home page and on category pages. Horizontal on desktop, stacked on mobile. Override the heading with data-heading. The platform list stays a placeholder until the team confirms it.">' +
        '<div class="container">' +
          '<h2>' + heading + '</h2>' +
          '<ol class="steps steps--row">' +
            step('Share your recent processing statements', 'Tell us about your business and upload your last few months of statements.') +
            step('Get your custom rate', 'Our underwriting team reviews your history and comes back with terms built for you.') +
            step('Switch and start processing', 'We help you connect your store and plan the move from your current processor.') +
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

  /* Reusable closing call to action. A page overrides the heading and the body
     with data-heading and data-text on the mount point. */
  function finalCtaMarkup(mount) {
    var p = prefix();
    var heading = mount.getAttribute('data-heading') || 'Find out what your rate looks like';
    var text = mount.getAttribute('data-text') ||
      'Send us your details and recent statements. Our underwriting team will come back with a custom rate.';
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
      markets: '<path d="M3 12h18"/><path d="M8 7h8"/><path d="M8 17h8"/><circle cx="8" cy="7" r="1.6"/><circle cx="16" cy="17" r="1.6"/>'
    };
    function item(icon, label) {
      return '' +
        '<li class="trust-strip__item">' +
          '<svg class="trust-strip__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + icon + '</svg>' +
          '<span>' + label + '</span>' +
        '</li>';
    }
    return '' +
      '<section class="trust-strip" data-note="Intent: three plain statements, placed under a hero or above a form, to steady a merchant who has been shut down before. | SEO: no keyword target. | Dev: block rendered from js/main.js. Text only with line icons, no logos, no numbers, nothing that needs a source.">' +
        '<div class="container">' +
          '<ul class="trust-strip__list">' +
            item(icons.underwriting, 'Underwriting built for your category') +
            item(icons.shield, 'Dispute and fraud tools included') +
            item(icons.markets, 'US and Canada merchants') +
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

          var payload = buildPayload(form);

          /* FORM_ENDPOINT is empty on purpose. The team wires the POST here,
             and nothing leaves the page until they do. */
          if (!CONFIG.FORM_ENDPOINT) {
            console.log(CONFIG.BRAND_NAME + ' form payload', payload);
            console.log(JSON.stringify(payload, null, 2));
          }

          showSuccess(form);
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
