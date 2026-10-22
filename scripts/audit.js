/* Review time audit, pasted into the browser console or loaded with:
     fetch('/scripts/audit.js').then(r => r.text()).then(eval); await plpAudit();
   Checks horizontal overflow, sticky elements covering buttons, WCAG AA text
   contrast, and whether every internal link and anchor resolves. */
window.plpAudit = async function () {
  var lum = function (c) {
    var p = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  };
  var parse = function (s) {
    var m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) { return null; }
    var p = m[1].split(',').map(parseFloat);
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  };
  var bgOf = function (el) {
    var n = el;
    while (n && n !== document.documentElement) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) { return c.rgb; }
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  var ratio = function (fg, bg) {
    var a = lum(fg) + 0.05, b = lum(bg) + 0.05;
    return Math.round((Math.max(a, b) / Math.min(a, b)) * 100) / 100;
  };
  var path = function (el) {
    return el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  };

  var de = document.documentElement;
  var wide = [].slice.call(document.querySelectorAll('body *')).filter(function (el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1);
  }).slice(0, 8).map(path);

  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.review-bar');
  var hr = header ? header.getBoundingClientRect() : null;
  var br = bar ? bar.getBoundingClientRect() : null;
  var overlaps = [];
  [].slice.call(document.querySelectorAll('main .btn, main button[type=submit], main [data-step-next]')).forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (!r.width) { return; }
    var hits = function (x) { return x && !(r.right < x.left || r.left > x.right || r.bottom < x.top || r.top > x.bottom); };
    if (hits(hr)) { overlaps.push('header over ' + path(el)); }
    if (hits(br)) { overlaps.push('review bar over ' + path(el)); }
  });

  var seen = {}, fails = [], checked = 0;
  [].slice.call(document.querySelectorAll('body *')).forEach(function (el) {
    if (el.offsetParent === null && el !== document.body) { return; }
    var text = '';
    [].slice.call(el.childNodes).forEach(function (n) { if (n.nodeType === 3) { text += n.textContent.trim(); } });
    if (text.length < 2) { return; }
    var cs = getComputedStyle(el);
    var fg = parse(cs.color);
    if (!fg) { return; }
    var size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
    var need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
    var r = ratio(fg.rgb, bgOf(el));
    checked++;
    var key = path(el) + '|' + cs.color + '|' + Math.round(size);
    if (seen[key]) { return; }
    seen[key] = 1;
    if (r < need) { fails.push({ el: path(el), ratio: r, need: need, size: Math.round(size), sample: text.slice(0, 28) }); }
  });

  var broken = [], anchors = [];
  var links = [].slice.call(document.querySelectorAll('a[href]'));
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) { continue; }
    if (href.charAt(0) === '#') {
      if (!document.querySelector(href)) { anchors.push(href); }
      continue;
    }
    var url = new URL(href, location.href);
    if (url.hash && url.pathname === location.pathname && !document.querySelector(url.hash)) { anchors.push(href); }
    try {
      var res = await fetch(url.pathname, { method: 'HEAD' });
      if (!res.ok) { broken.push(href + ' -> ' + res.status); }
    } catch (e) { broken.push(href + ' -> ' + e.message); }
  }

  return {
    page: location.pathname,
    mode: document.body.getAttribute('data-mode'),
    width: de.clientWidth,
    overflowPx: de.scrollWidth - de.clientWidth,
    wideElements: wide,
    overlaps: overlaps,
    textChecked: checked,
    contrastFails: fails,
    linksChecked: links.length,
    brokenLinks: broken.filter(function (v, idx, a) { return a.indexOf(v) === idx; }),
    brokenAnchors: anchors.filter(function (v, idx, a) { return a.indexOf(v) === idx; })
  };
};
