(function () {
    'use strict';

    var TL = (window.TacosLocos = window.TacosLocos || {});

    /* Business hours (Africa/Johannesburg time). Keep in sync with Contact page.
       days: 0 = Sunday ... 6 = Saturday.  Times are 24-hour "HH:MM". */
    TL.HOURS = [
        { days: [1, 2], open: '12:00', close: '20:00' },
        { days: [3], open: '12:00', close: '20:15' },
        { days: [4], open: '12:00', close: '20:00' },
        { days: [5, 6], open: '12:00', close: '20:30' }
        /* Sunday (0) is closed */
    ];
    TL.TIMEZONE = 'Africa/Johannesburg';

    /* ---------- Small DOM helpers ---------- */
    TL.qs = function (sel, root) { return (root || document).querySelector(sel); };
    TL.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* el('div', {class:'x', text:'hi', 'data-a':'1'}, [child, 'text']) -> element.
       Uses textContent (never innerHTML) so user-supplied text can't inject markup. */
    TL.el = function (tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            var val = attrs[key];
            if (val === null || val === undefined || val === false) { return; }
            if (key === 'text') { node.textContent = val; }
            else if (key === 'class') { node.className = val; }
            else { node.setAttribute(key, val === true ? '' : val); }
        });
        (children || []).forEach(function (child) {
            if (child === null || child === undefined) { return; }
            node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
        return node;
    };

    TL.icon = function (name) {
        return TL.el('i', { class: 'fa-solid ' + name, 'aria-hidden': 'true' });
    };

    TL.formatPrice = function (n) { return 'R ' + Number(n).toFixed(2); };

    /* ---------- Toast notification ---------- */
    var toastTimer;
    TL.toast = function (message) {
        var toast = TL.qs('.toast');
        if (!toast) {
            toast = TL.el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3500);
    };

    /* ---------- Time helpers (South African time) ---------- */
    function toMinutes(hhmm) {
        var p = hhmm.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    }

    TL.nowInSA = function () {
        var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        try {
            var parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: TL.TIMEZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
            }).formatToParts(new Date());
            var out = {};
            parts.forEach(function (p) { out[p.type] = p.value; });
            return { day: map[out.weekday], minutes: (parseInt(out.hour, 10) % 24) * 60 + parseInt(out.minute, 10) };
        } catch (e) {
            var d = new Date();
            return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
        }
    };

    TL.hoursForDay = function (day) {
        for (var i = 0; i < TL.HOURS.length; i++) {
            if (TL.HOURS[i].days.indexOf(day) !== -1) { return TL.HOURS[i]; }
        }
        return null;
    };

    TL.getOpenStatus = function () {
        var now = TL.nowInSA();
        var today = TL.hoursForDay(now.day);
        if (today && now.minutes >= toMinutes(today.open) && now.minutes < toMinutes(today.close)) {
            return { open: true, text: "We're open now until " + today.close };
        }
        if (today && now.minutes < toMinutes(today.open)) {
            return { open: false, text: 'Closed now. We open today at ' + today.open };
        }
        for (var i = 1; i <= 7; i++) {
            var nextDay = (now.day + i) % 7;
            var h = TL.hoursForDay(nextDay);
            if (h) {
                var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return { open: false, text: 'Closed now. We open ' + (i === 1 ? 'tomorrow' : names[nextDay]) + ' at ' + h.open };
            }
        }
        return { open: false, text: 'Currently closed' };
    };

    function initOpenStatus() {
        var badges = TL.qsa('[data-open-status]');
        if (!badges.length) { return; }
        function update() {
            var status = TL.getOpenStatus();
            badges.forEach(function (badge) {
                badge.textContent = '';
                badge.appendChild(TL.icon(status.open ? 'fa-circle-check' : 'fa-clock'));
                badge.appendChild(document.createTextNode(' ' + status.text));
                badge.classList.toggle('is-open', status.open);
                badge.classList.toggle('is-closed', !status.open);
            });
        }
        update();
        setInterval(update, 60000);
    }

    /* ---------- Footer year ---------- */
    function initYear() {
        TL.qsa('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
    }

    /* ---------- Highlight the current page in the nav ---------- */
    function initNav() {
        var current = location.pathname.split('/').pop() || 'index.html';
        TL.qsa('header nav a[href]').forEach(function (a) {
            var target = a.getAttribute('href').split('#')[0];
            if (target.toLowerCase() === current.toLowerCase()) {
                a.setAttribute('aria-current', 'page');
            }
        });
    }

    /* ---------- Scroll reveal + back-to-top ---------- */
    function initReveal() {
        var items = TL.qsa('main h2, main h3, main .reveal, main > p, .accordion, .link-card, .gallery-item');
        items.forEach(function (n) { n.classList.add('reveal'); });
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (n) { n.classList.add('is-visible'); });
            return;
        }
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        items.forEach(function (n) { obs.observe(n); });
    }

    function initBackToTop() {
        var btn = TL.el('button', { type: 'button', class: 'back-to-top', 'aria-label': 'Back to top' }, [TL.icon('fa-arrow-up')]);
        document.body.appendChild(btn);
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) { return; }
            ticking = true;
            window.requestAnimationFrame(function () {
                btn.classList.toggle('is-visible', window.scrollY > 500);
                ticking = false;
            });
        }, { passive: true });
        btn.addEventListener('click', function () {
            var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        });
    }

    /* ---------- Accordion ----------
       Markup: .accordion > .accordion-item > button.accordion-trigger + .accordion-panel */
    function initAccordions() {
        TL.qsa('[data-accordion]').forEach(function (acc) {
            var triggers = TL.qsa('.accordion-trigger', acc);

            function setOpen(trigger, open) {
                var panel = document.getElementById(trigger.getAttribute('aria-controls'));
                trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (panel) {
                    panel.classList.toggle('is-open', open);
                    if (open) { panel.removeAttribute('inert'); } else { panel.setAttribute('inert', ''); }
                }
                trigger.closest('.accordion-item').classList.toggle('is-open', open);
            }

            triggers.forEach(function (trigger, i) {
                setOpen(trigger, trigger.getAttribute('aria-expanded') === 'true');

                trigger.addEventListener('click', function () {
                    setOpen(trigger, trigger.getAttribute('aria-expanded') !== 'true');
                });

                trigger.addEventListener('keydown', function (e) {
                    var next = null;
                    if (e.key === 'ArrowDown') { next = triggers[(i + 1) % triggers.length]; }
                    else if (e.key === 'ArrowUp') { next = triggers[(i - 1 + triggers.length) % triggers.length]; }
                    else if (e.key === 'Home') { next = triggers[0]; }
                    else if (e.key === 'End') { next = triggers[triggers.length - 1]; }
                    if (next) { e.preventDefault(); next.focus(); }
                });
            });

            var expandAll = TL.qs('[data-accordion-toggle-all]', acc.parentNode);
            if (expandAll) {
                expandAll.addEventListener('click', function () {
                    var anyClosed = triggers.some(function (t) { return t.getAttribute('aria-expanded') !== 'true'; });
                    triggers.forEach(function (t) { setOpen(t, anyClosed); });
                    expandAll.textContent = anyClosed ? 'Collapse all' : 'Expand all';
                });
            }
        });
    }

    /* ---------- Reusable modal dialog ----------
       TL.openModal({ title: 'Heading', content: Node, className: 'x' }) */
    var activeModal = null;

    TL.closeModal = function () {
        if (!activeModal) { return; }
        var m = activeModal;
        activeModal = null;
        document.removeEventListener('keydown', m.onKey, true);
        m.overlay.classList.remove('is-visible');
        document.body.classList.remove('modal-open');
        setTimeout(function () {
            if (m.overlay.parentNode) { m.overlay.parentNode.removeChild(m.overlay); }
            if (m.returnFocus && m.returnFocus.focus) { m.returnFocus.focus(); }
        }, 200);
    };

    TL.openModal = function (opts) {
        TL.closeModal();
        var titleId = 'modal-title-' + Date.now();
        var closeBtn = TL.el('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close dialog' }, [TL.icon('fa-xmark')]);
        var dialog = TL.el('div', {
            class: 'modal ' + (opts.className || ''), role: 'dialog', 'aria-modal': 'true',
            'aria-labelledby': titleId, tabindex: '-1'
        }, [
            closeBtn,
            TL.el('h2', { id: titleId, class: 'modal-title', text: opts.title || '' }),
            opts.content
        ]);
        var overlay = TL.el('div', { class: 'modal-overlay' }, [dialog]);
        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');

        function focusables() {
            return TL.qsa('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog);
        }

        var state = {
            overlay: overlay,
            returnFocus: opts.returnFocus || document.activeElement,
            onKey: function (e) {
                if (e.key === 'Escape') { e.preventDefault(); TL.closeModal(); return; }
                if (e.key === 'Tab') {
                    var f = focusables();
                    if (!f.length) { e.preventDefault(); return; }
                    var first = f[0], last = f[f.length - 1];
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
            }
        };
        activeModal = state;
        document.addEventListener('keydown', state.onKey, true);

        closeBtn.addEventListener('click', TL.closeModal);
        overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) { TL.closeModal(); } });

        requestAnimationFrame(function () {
            overlay.classList.add('is-visible');
            closeBtn.focus();
        });
        return dialog;
    };

    /* ---------- Social share buttons ----------
       <div data-share></div> is filled with share links for the current page. */
    function initShare() {
        TL.qsa('[data-share]').forEach(function (box) {
            var canonical = TL.qs('link[rel="canonical"]');
            var url = canonical ? canonical.href : location.href;
            var text = document.title;
            var enc = encodeURIComponent;
            var links = [
                { label: 'Share on WhatsApp', icon: 'fa-brands fa-whatsapp', href: 'https://wa.me/?text=' + enc(text + ' ' + url) },
                { label: 'Share on Facebook', icon: 'fa-brands fa-facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url) },
                { label: 'Share on X', icon: 'fa-brands fa-x-twitter', href: 'https://twitter.com/intent/tweet?text=' + enc(text) + '&url=' + enc(url) }
            ];
            box.appendChild(TL.el('span', { class: 'share-label', text: 'Share this page:' }));
            links.forEach(function (l) {
                var a = TL.el('a', {
                    href: l.href, class: 'share-link', target: '_blank', rel: 'noopener noreferrer',
                    'aria-label': l.label, title: l.label
                }, [TL.el('i', { class: l.icon, 'aria-hidden': 'true' })]);
                box.appendChild(a);
            });
            if (navigator.share) {
                var nativeBtn = TL.el('button', { type: 'button', class: 'share-link share-native', 'aria-label': 'Share using your device', title: 'Share' }, [TL.icon('fa-share-nodes')]);
                nativeBtn.addEventListener('click', function () {
                    navigator.share({ title: text, url: url }).catch(function () { /* user cancelled */ });
                });
                box.appendChild(nativeBtn);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initYear();
        initNav();
        initOpenStatus();
        initAccordions();
        initShare();
        initReveal();
        initBackToTop();
    });
})();


/* ==================== products-data.js ==================== */

/* Tacos Locos - product data
   Edit this file to add, remove or re-price menu items; the Products page,
   the Enquiry quote and the SEO menu data all read from here. */
window.TACOS_CATEGORIES = [
  {
    "id": "tacos",
    "label": "Tacos",
    "icon": "fa-pepper-hot",
    "intro": "Our signature Tacos are made with the freshest ingredients and served with your choice of salsas."
  },
  {
    "id": "burritos",
    "label": "Burritos",
    "icon": "fa-bowl-food",
    "intro": "Fill your Burrito with our delicious meats, beans, and vegetables for a hearty meal."
  },
  {
    "id": "samosas",
    "label": "Samosas",
    "icon": "fa-cookie-bite",
    "intro": "Our Samosas are made with melted cheese and your choice of fillings, perfect for a quick snack."
  },
  {
    "id": "wings",
    "label": "Wings",
    "icon": "fa-drumstick-bite",
    "intro": "Crispy, saucy chicken wings - the perfect side to any order."
  }
];

window.TACOS_PRODUCTS = [
  {
    "id": "cheese-tacos",
    "name": "Cheese Tacos",
    "category": "tacos",
    "price": 45,
    "image": "images/cheese-tacos.webp",
    "width": 533,
    "height": 800,
    "alt": "Crispy cheese tacos with salsa, shredded lettuce and sour cream on a wooden board",
    "description": "A soft corn tortilla loaded with melted cheddar and mozzarella cheese. Made with fire-grilled chicken, fresh salsa and a squeeze of lime."
  },
  {
    "id": "beef-tacos",
    "name": "Beef Tacos",
    "category": "tacos",
    "price": 52,
    "image": "images/beef-tacos.webp",
    "width": 640,
    "height": 800,
    "alt": "Takeaway box of cheesy beef tacos on a bed of shredded lettuce",
    "description": "Seasoned minced beef wrapped in a warm flour tortilla. Topped with shredded lettuce, diced tomato and sour cream."
  },
  {
    "id": "cheddar-tacos",
    "name": "Cheddar Tacos",
    "category": "tacos",
    "price": 48,
    "image": "images/cheddar-tacos.webp",
    "width": 533,
    "height": 800,
    "alt": "Two crunchy cheddar tacos topped with melted cheese, tomato and coriander",
    "description": "Crunchy taco shell filled with grilled chicken and rich cheddar sauce. Finished with jalapenos, red onion and fresh coriander."
  },
  {
    "id": "loaded-meat-tacos",
    "name": "Loaded Meat Tacos",
    "category": "tacos",
    "price": 60,
    "image": "images/loaded-meat-tacos.webp",
    "width": 640,
    "height": 800,
    "alt": "Three loaded meat tacos with cheese sauce and diced tomato on a blue plate",
    "description": "A hearty double-stacked taco packed with beef and spicy chorizo. Layered with beans, cheese and smoky chipotle salsa."
  },
  {
    "id": "fried-chicken-tacos",
    "name": "Fried Chicken Tacos",
    "category": "tacos",
    "price": 55,
    "image": "images/fried-chicken-tacos.webp",
    "width": 600,
    "height": 800,
    "alt": "Hand holding a fried chicken taco with lettuce, tomato and creamy sauce",
    "description": "Crispy fried chicken strips folded into a soft tortilla. Served with lettuce, tomato and creamy chipotle mayonnaise."
  },
  {
    "id": "italian-style-tacos",
    "name": "Italian Style Tacos",
    "category": "tacos",
    "price": 58,
    "image": "images/italian-style-tacos.webp",
    "width": 800,
    "height": 800,
    "alt": "Italian style taco filled with beef, tomato, basil and herbs in a toasted tortilla",
    "description": "A Mexican-Italian twist with beef, basil and mozzarella. Drizzled with garlic herb oil inside a toasted tortilla."
  },
  {
    "id": "cheesy-burrito",
    "name": "Cheesy Burrito",
    "category": "burritos",
    "price": 65,
    "image": "images/cheesy-burrito.webp",
    "width": 450,
    "height": 800,
    "alt": "Grilled cheesy burrito cut in half on a wooden board",
    "description": "A soft flour tortilla stuffed with seasoned chicken and rice. Smothered in melted cheese sauce and pico de gallo."
  },
  {
    "id": "beef-burrito",
    "name": "Beef Burrito",
    "category": "burritos",
    "price": 72,
    "image": "images/beef-burrito.webp",
    "width": 736,
    "height": 736,
    "alt": "Grilled beef burrito cut in half showing minced beef, tomato and cheese filling",
    "description": "Slow-cooked shredded beef rolled with black beans and rice. Wrapped warm with guacamole, salsa and sour cream."
  },
  {
    "id": "mexican-beef-burrito",
    "name": "Mexican Beef Burrito",
    "category": "burritos",
    "price": 68,
    "image": "images/mexican-beef-burrito.webp",
    "width": 533,
    "height": 800,
    "alt": "Mexican beef burrito sliced open with steak, chips and guacamole, served with lime and tortilla chips",
    "description": "Minced beef with chipotle peppers and refried beans. Topped with jalapenos, cheddar and fresh coriander."
  },
  {
    "id": "chilli-cheese-samosas",
    "name": "Chilli Cheese Samosas",
    "category": "samosas",
    "price": 30,
    "image": "images/chilli-cheese-samosas.webp",
    "width": 500,
    "height": 667,
    "alt": "Tray of golden crispy chilli cheese samosas",
    "description": "Crispy golden pastry parcels filled with chilli and cheese. Made with potato, green peas and a blend of warm spices."
  },
  {
    "id": "samosa-roll",
    "name": "Samosa Roll",
    "category": "samosas",
    "price": 38,
    "image": "images/samosa-roll.webp",
    "width": 736,
    "height": 769,
    "alt": "Golden fried samosa rolls and samosas piled on foil",
    "description": "A long rolled pastry stuffed with spiced beef and cheese. Deep fried until golden and served with a mint dip."
  },
  {
    "id": "jalapeno-cheese-bombs",
    "name": "Jalapeno Cheese Bombs",
    "category": "samosas",
    "price": 40,
    "image": "images/jalapeno-cheese-bombs.webp",
    "width": 640,
    "height": 800,
    "alt": "Pile of jalapeno cheese bomb samosas garnished with fresh coriander",
    "description": "Bite-sized pastry bombs packed with jalapenos and cheddar. Blended with cream cheese and a hint of garlic."
  },
  {
    "id": "chilli-wings",
    "name": "Chilli Wings",
    "category": "wings",
    "price": 58,
    "image": "images/chilli-wings.webp",
    "width": 500,
    "height": 800,
    "alt": "Plate of glossy chilli glazed chicken wings",
    "description": "Crispy fried chicken wings tossed in a fiery chilli glaze. Coated with red chilli flakes, garlic and spring onion."
  },
  {
    "id": "saucy-wings",
    "name": "Saucy Wings",
    "category": "wings",
    "price": 62,
    "image": "images/saucy-wings.webp",
    "width": 450,
    "height": 800,
    "alt": "Takeaway tub of saucy BBQ chicken wings with a dipping sauce",
    "description": "Deep-fried wings smothered in a sticky BBQ sauce. Made with smoked paprika, honey and a touch of vinegar."
  },
  {
    "id": "roasted-wings",
    "name": "Roasted Wings",
    "category": "wings",
    "price": 55,
    "image": "images/roasted-wings.webp",
    "width": 533,
    "height": 800,
    "alt": "Tray of oven-roasted chicken wings with a dark herb crust",
    "description": "Oven-roasted wings seasoned with herbs and lemon. Brushed with olive oil, thyme and cracked black pepper."
  },
  {
    "id": "peri-peri-chicken-wings",
    "name": "Peri-peri Chicken Wings",
    "category": "wings",
    "price": 64,
    "image": "images/peri-peri-chicken-wings.webp",
    "width": 550,
    "height": 800,
    "alt": "Peri-peri chicken wings on a wooden board with a dipping sauce",
    "description": "Grilled wings basted in a bold peri-peri marinade. Made with bird's eye chilli, garlic and fresh lemon."
  },
  {
    "id": "honey-garlic-chicken-wings",
    "name": "Honey Garlic Chicken Wings",
    "category": "wings",
    "price": 66,
    "image": "images/honey-garlic-chicken-wings.webp",
    "width": 800,
    "height": 600,
    "alt": "Honey garlic chicken wings drizzled with sauce and sprinkled with herbs",
    "description": "Sticky wings glazed in honey and roasted garlic. Finished with sesame seeds and chopped coriander."
  }
];


/* ==================== products.js ==================== */

/* ==========================================================================
   Tacos Locos - products.js  (Products page only)
   Loads the menu from products-data.js and builds the page dynamically:
     - category tabs, live search (with match highlighting) and sorting
     - product cards created with DOM methods (no innerHTML)
     - "View details" modal for each item
   ========================================================================== */
(function () {
    'use strict';

    var TL = window.TacosLocos;
    var PRODUCTS = window.TACOS_PRODUCTS;
    var CATEGORIES = window.TACOS_CATEGORIES;
    var output = document.getElementById('product-output');
    if (!TL || !PRODUCTS || !output) { return; }

    var searchInput = document.getElementById('product-search');
    var sortSelect = document.getElementById('product-sort');
    var clearBtn = document.getElementById('product-clear');
    var status = document.getElementById('product-status');
    var tabs = TL.qsa('[role="tab"]', document.getElementById('product-tabs'));

    var state = { category: 'all', query: '', sort: 'menu' };

    var categoryLabel = {};
    CATEGORIES.forEach(function (c) { categoryLabel[c.id] = c.label; });

    /* ---------- Filtering and sorting ---------- */
    function searchTerms() {
        return state.query.toLowerCase().split(/\s+/).filter(Boolean);
    }

    function matches(product, terms) {
        if (state.category !== 'all' && product.category !== state.category) { return false; }
        if (!terms.length) { return true; }
        var haystack = (product.name + ' ' + product.description + ' ' + categoryLabel[product.category]).toLowerCase();
        return terms.every(function (t) { return haystack.indexOf(t) !== -1; });
    }

    function sortProducts(list) {
        var copy = list.slice();
        var sorters = {
            'menu': function () { return 0; },
            'name-asc': function (a, b) { return a.name.localeCompare(b.name); },
            'name-desc': function (a, b) { return b.name.localeCompare(a.name); },
            'price-asc': function (a, b) { return a.price - b.price || a.name.localeCompare(b.name); },
            'price-desc': function (a, b) { return b.price - a.price || a.name.localeCompare(b.name); }
        };
        return copy.sort(sorters[state.sort] || sorters.menu);   /* sort is stable in modern browsers */
    }

    /* ---------- Highlight search matches (safe: builds text nodes) ---------- */
    function highlight(text, terms) {
        var frag = document.createDocumentFragment();
        if (!terms.length) { frag.appendChild(document.createTextNode(text)); return frag; }
        var escaped = terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
        var re = new RegExp('(' + escaped.join('|') + ')', 'ig');
        text.split(re).forEach(function (part, i) {
            if (i % 2 === 1) { frag.appendChild(TL.el('mark', { text: part })); }
            else if (part) { frag.appendChild(document.createTextNode(part)); }
        });
        return frag;
    }

    /* ---------- Build one product card ---------- */
    function enquiryLink(p) {
        return 'enquiry.html?category=' + encodeURIComponent(p.category) + '&item=' + encodeURIComponent(p.name);
    }

    function createCard(p, terms) {
        var img = TL.el('img', {
            src: p.image, alt: p.alt, width: 250, height: Math.round(250 * p.height / p.width), loading: 'lazy', decoding: 'async'
        });
        var imgBtn = TL.el('button', { type: 'button', class: 'card-image-btn', 'aria-label': 'View details for ' + p.name }, [img]);

        var name = TL.el('p', { class: 'product-name' });
        name.appendChild(highlight(p.name, terms));
        var desc = TL.el('p', { class: 'product-desc' });
        desc.appendChild(highlight(p.description, terms));

        var detailsBtn = TL.el('button', { type: 'button', class: 'btn-small', text: 'Details' });
        var enquire = TL.el('a', { class: 'btn-small btn-outline', href: enquiryLink(p), text: 'Enquire' });

        var card = TL.el('div', { class: 'product-card', 'data-id': p.id }, [
            imgBtn, name, desc,
            TL.el('p', { class: 'product-price', text: TL.formatPrice(p.price) }),
            TL.el('div', { class: 'card-actions' }, [detailsBtn, enquire])
        ]);

        function open(e) { showDetails(p, e.currentTarget); }
        imgBtn.addEventListener('click', open);
        detailsBtn.addEventListener('click', open);
        return card;
    }

    /* ---------- Details modal ---------- */
    function showDetails(p, trigger) {
        var img = TL.el('img', { src: p.image, alt: p.alt, width: p.width, height: p.height, class: 'modal-image' });
        var body = TL.el('div', { class: 'modal-body' }, [
            TL.el('p', { class: 'modal-category', text: categoryLabel[p.category] }),
            TL.el('p', { text: p.description }),
            TL.el('p', { class: 'product-price', text: TL.formatPrice(p.price) }),
            TL.el('div', { class: 'card-actions' }, [
                TL.el('a', { class: 'btn-small', href: enquiryLink(p), text: 'Enquire about this item' })
            ])
        ]);
        TL.openModal({
            title: p.name,
            className: 'product-modal',
            returnFocus: trigger,
            content: TL.el('div', { class: 'modal-layout' }, [img, body])
        });
    }

    /* ---------- Render ---------- */
    function grid(items, terms) {
        var g = TL.el('div', { class: 'product-grid' });
        items.forEach(function (p) { g.appendChild(createCard(p, terms)); });
        return g;
    }

    function render() {
        var terms = searchTerms();
        var results = sortProducts(PRODUCTS.filter(function (p) { return matches(p, terms); }));
        var frag = document.createDocumentFragment();

        var grouped = state.category === 'all' && state.sort === 'menu' && !terms.length;

        if (!results.length) {
            frag.appendChild(TL.el('div', { class: 'empty-state' }, [
                TL.icon('fa-face-frown'),
                TL.el('p', { text: 'No menu items match "' + state.query.trim() + '".' }),
                TL.el('p', { text: 'Try a different word like "chicken", "cheese" or "beef", or clear the search.' })
            ]));
        } else if (grouped) {
            /* Default view: original layout with a heading + intro per category */
            CATEGORIES.forEach(function (cat) {
                var items = results.filter(function (p) { return p.category === cat.id; });
                if (!items.length) { return; }
                frag.appendChild(TL.el('h2', { id: cat.id }, [TL.icon(cat.icon), TL.el('strong', { text: cat.label })]));
                frag.appendChild(TL.el('p', { text: cat.intro }));
                frag.appendChild(grid(items, terms));
                frag.appendChild(TL.el('hr'));
            });
        } else {
            frag.appendChild(grid(results, terms));
        }

        output.textContent = '';
        output.appendChild(frag);

        var total = PRODUCTS.length;
        var msg = 'Showing ' + results.length + ' of ' + total + ' items';
        if (state.category !== 'all') { msg += ' in ' + categoryLabel[state.category]; }
        if (terms.length) { msg += ' matching "' + state.query.trim() + '"'; }
        status.textContent = msg;
        clearBtn.hidden = !(terms.length || state.category !== 'all' || state.sort !== 'menu');
    }

    /* ---------- Tabs ---------- */
    function selectTab(tab, focus) {
        state.category = tab.getAttribute('data-category');
        tabs.forEach(function (t) {
            var active = t === tab;
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.setAttribute('tabindex', active ? '0' : '-1');
            t.classList.toggle('is-active', active);
        });
        output.setAttribute('aria-labelledby', tab.id);
        if (focus) { tab.focus(); }
        render();
    }

    tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { selectTab(tab, false); });
        tab.addEventListener('keydown', function (e) {
            var idx = null;
            if (e.key === 'ArrowRight') { idx = (i + 1) % tabs.length; }
            else if (e.key === 'ArrowLeft') { idx = (i - 1 + tabs.length) % tabs.length; }
            else if (e.key === 'Home') { idx = 0; }
            else if (e.key === 'End') { idx = tabs.length - 1; }
            if (idx !== null) { e.preventDefault(); selectTab(tabs[idx], true); }
        });
    });

    /* ---------- Search, sort, clear ---------- */
    var debounce;
    searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () { state.query = searchInput.value; render(); }, 150);
    });
    sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; render(); });

    clearBtn.addEventListener('click', function () {
        state = { category: 'all', query: '', sort: 'menu' };
        searchInput.value = '';
        sortSelect.value = 'menu';
        selectTab(tabs[0], false);
        searchInput.focus();
    });

    /* Allow links such as products.html#wings to open straight on a category */
    function tabFromHash() {
        var h = location.hash.replace('#', '').toLowerCase();
        return tabs.filter(function (t) { return t.getAttribute('data-category') === h; })[0];
    }
    selectTab(tabFromHash() || tabs[0], false);
    window.addEventListener('hashchange', function () {
        var t = tabFromHash();
        if (t) { selectTab(t, false); }
    });
})();


/* ==================== gallery.js ==================== */

/* ==========================================================================
   Tacos Locos - gallery.js  (Home page)
   Turns every  <a class="gallery-item" href="big-image">  inside a
   [data-gallery] container into a lightbox:
     - click / Enter opens the image large; the link still works without JS
     - previous / next buttons, arrow keys, swipe on touch screens
     - Escape or clicking the dark background closes it
     - focus is trapped inside while open and restored afterwards
   ========================================================================== */
(function () {
    'use strict';

    var TL = window.TacosLocos;
    var galleries = TL ? TL.qsa('[data-gallery]') : [];
    if (!galleries.length) { return; }

    var lightbox = null;      /* the open lightbox state, or null */

    function close() {
        if (!lightbox) { return; }
        var lb = lightbox;
        lightbox = null;
        document.removeEventListener('keydown', lb.onKey, true);
        lb.root.classList.remove('is-visible');
        document.body.classList.remove('modal-open');
        setTimeout(function () {
            if (lb.root.parentNode) { lb.root.parentNode.removeChild(lb.root); }
            if (lb.returnFocus && lb.returnFocus.focus) { lb.returnFocus.focus(); }
        }, 200);
    }

    function open(items, startIndex, returnFocus) {
        if (lightbox) { close(); }
        var index = startIndex;

        var image = TL.el('img', { class: 'lightbox-image', alt: '' });
        var caption = TL.el('figcaption', { class: 'lightbox-caption' });
        var counter = TL.el('span', { class: 'lightbox-counter', 'aria-live': 'polite' });
        var closeBtn = TL.el('button', { type: 'button', class: 'lightbox-btn lightbox-close', 'aria-label': 'Close image viewer' }, [TL.icon('fa-xmark')]);
        var prevBtn = TL.el('button', { type: 'button', class: 'lightbox-btn lightbox-prev', 'aria-label': 'Previous image' }, [TL.icon('fa-chevron-left')]);
        var nextBtn = TL.el('button', { type: 'button', class: 'lightbox-btn lightbox-next', 'aria-label': 'Next image' }, [TL.icon('fa-chevron-right')]);

        var figure = TL.el('figure', { class: 'lightbox-figure' }, [image, caption]);
        var root = TL.el('div', {
            class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Image gallery viewer'
        }, [closeBtn, prevBtn, figure, nextBtn, counter]);

        function show(i) {
            index = (i + items.length) % items.length;
            var item = items[index];
            root.classList.add('is-loading');
            image.onload = function () { root.classList.remove('is-loading'); };
            image.src = item.href;
            image.alt = item.alt;
            caption.textContent = item.caption;
            counter.textContent = (index + 1) + ' / ' + items.length;
            /* Preload the neighbours so next/previous feel instant */
            [index + 1, index - 1].forEach(function (n) {
                var pre = new Image();
                pre.src = items[(n + items.length) % items.length].href;
            });
        }

        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
            else if (e.key === 'Tab') {
                var f = [closeBtn, prevBtn, nextBtn];
                var pos = f.indexOf(document.activeElement);
                e.preventDefault();
                f[(pos + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
            }
        }

        closeBtn.addEventListener('click', close);
        prevBtn.addEventListener('click', function () { show(index - 1); });
        nextBtn.addEventListener('click', function () { show(index + 1); });
        root.addEventListener('mousedown', function (e) {
            if (e.target === root || e.target === figure) { close(); }
        });

        /* Swipe left / right on touch screens */
        var startX = null;
        root.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
        root.addEventListener('touchend', function (e) {
            if (startX === null) { return; }
            var dx = e.changedTouches[0].clientX - startX;
            startX = null;
            if (Math.abs(dx) > 50) { show(index + (dx < 0 ? 1 : -1)); }
        }, { passive: true });

        document.body.appendChild(root);
        document.body.classList.add('modal-open');
        document.addEventListener('keydown', onKey, true);
        lightbox = { root: root, onKey: onKey, returnFocus: returnFocus };
        show(index);
        requestAnimationFrame(function () {
            root.classList.add('is-visible');
            closeBtn.focus();
        });
    }

    galleries.forEach(function (gallery) {
        var links = TL.qsa('a.gallery-item', gallery);
        var items = links.map(function (a) {
            var img = a.querySelector('img');
            return { href: a.getAttribute('href'), alt: img ? img.alt : '', caption: a.getAttribute('data-caption') || (img ? img.alt : '') };
        });
        links.forEach(function (a, i) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                open(items, i, a);
            });
        });
    });
})();


/* ==================== location.js ==================== */

/* ==========================================================================
   Tacos Locos - location.js  (Contact page only)
     - Interactive Leaflet map (OpenStreetMap tiles) with a marker + popup
     - Highlights today's row in the business hours list
     - "How far am I?" button using the browser's geolocation (only when clicked)
   ========================================================================== */
(function () {
    'use strict';

    var TL = window.TacosLocos;
    if (!TL) { return; }

    var SHOP = { lat: -33.9358606, lng: 18.461234 };   /* 364 Victoria Road, Cape Town */

    /* ---------- Highlight today in the hours list ---------- */
    function initHours() {
        var list = document.getElementById('hours-list');
        if (!list) { return; }
        var today = TL.nowInSA().day;
        TL.qsa('li[data-days]', list).forEach(function (li) {
            var days = li.getAttribute('data-days').split(',').map(Number);
            var isToday = days.indexOf(today) !== -1;
            li.classList.toggle('is-today', isToday);
            if (isToday) {
                li.setAttribute('aria-label', li.textContent + ' (today)');
                if (!li.querySelector('.today-tag')) {
                    li.appendChild(TL.el('span', { class: 'today-tag', text: 'Today' }));
                }
            }
        });
    }

    /* ---------- Distance (haversine formula) ---------- */
    function distanceKm(lat1, lng1, lat2, lng2) {
        var R = 6371;
        var rad = Math.PI / 180;
        var dLat = (lat2 - lat1) * rad;
        var dLng = (lng2 - lng1) * rad;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /* ---------- Map ---------- */
    function initMap() {
        var container = document.getElementById('map');
        if (!container) { return; }

        if (!window.L) {
            /* Leaflet failed to load (offline / blocked) - leave the fallback link visible */
            container.classList.add('map-fallback');
            container.textContent = 'The interactive map could not be loaded. Please use the "Open in Google Maps" link below.';
            return;
        }

        var map = L.map(container, { scrollWheelZoom: false }).setView([SHOP.lat, SHOP.lng], 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        /* Popup content built with DOM methods */
        var popup = TL.el('div', { class: 'map-popup' }, [
            TL.el('strong', { text: 'Tacos Locos' }),
            TL.el('br'),
            document.createTextNode('364 Victoria Road, Cape Town'),
            TL.el('br'),
            TL.el('a', {
                href: 'https://www.google.com/maps/dir/?api=1&destination=' + SHOP.lat + ',' + SHOP.lng,
                target: '_blank', rel: 'noopener noreferrer', text: 'Get directions'
            })
        ]);
        var marker = L.marker([SHOP.lat, SHOP.lng], { title: 'Tacos Locos', alt: 'Tacos Locos location marker' })
            .addTo(map)
            .bindPopup(popup)
            .openPopup();

        /* Scroll-wheel zoom only after the visitor clicks the map (stops accidental zooming while scrolling the page) */
        map.on('focus', function () { map.scrollWheelZoom.enable(); });
        map.on('blur', function () { map.scrollWheelZoom.disable(); });

        /* "Show distance from me" */
        var btn = document.getElementById('locate-btn');
        var result = document.getElementById('locate-result');
        var userMarker = null;

        if (btn && 'geolocation' in navigator) {
            btn.hidden = false;
            btn.addEventListener('click', function () {
                result.textContent = 'Finding your location...';
                btn.disabled = true;
                navigator.geolocation.getCurrentPosition(function (pos) {
                    var lat = pos.coords.latitude, lng = pos.coords.longitude;
                    var km = distanceKm(lat, lng, SHOP.lat, SHOP.lng);
                    result.textContent = km < 1
                        ? 'You are about ' + Math.round(km * 1000) + ' m from Tacos Locos.'
                        : 'You are about ' + km.toFixed(1) + ' km from Tacos Locos (in a straight line).';
                    if (userMarker) { map.removeLayer(userMarker); }
                    userMarker = L.circleMarker([lat, lng], { radius: 8, color: '#4b1e82', fillColor: '#ffcce8', fillOpacity: 1, weight: 3 })
                        .addTo(map).bindTooltip('You are here');
                    map.fitBounds(L.latLngBounds([[lat, lng], [SHOP.lat, SHOP.lng]]).pad(0.3));
                    btn.disabled = false;
                }, function () {
                    result.textContent = 'We could not get your location. You can still use the directions link below.';
                    btn.disabled = false;
                }, { timeout: 10000, maximumAge: 60000 });
            });
        }

        return marker;
    }

    document.addEventListener('DOMContentLoaded', function () {
        initHours();
        initMap();
    });
})();


/* ==================== forms.js ==================== */

/* ==========================================================================
   Tacos Locos - forms.js  (Enquiry and Contact pages)

   Client-side validation  - every field is checked in JavaScript on blur and on submit
   Error handling          - a message under each invalid field + a summary at the top
   AJAX submission         - fetch() POSTs the data as JSON without reloading the page

   enquiry.html -> validated data is submitted, then a quote / availability
                   response is shown to the customer.
   contact.html -> validated data is submitted, then a ready-to-send email is
                   compiled for the customer to open in their email app.
   ========================================================================== */
(function () {
    'use strict';

    var TL = window.TacosLocos;
    if (!TL) { return; }

    /* ----------------------------------------------------------------------
       Settings you may want to change
       ---------------------------------------------------------------------- */
    var CONFIG = {
        /* Where AJAX submissions are sent. JSONPlaceholder is a free test API that
           accepts any POST and echoes it back. Swap this for a real form service
           (e.g. https://formspree.io/f/yourID) by editing the form's data-endpoint
           attribute in the HTML. */
        defaultEndpoint: 'https://jsonplaceholder.typicode.com/posts',
        defaultEmail: 'info@tacoslocos.co.za',
        timeoutMs: 10000
    };

    /* Rules used to estimate cost and availability on the Enquiry page. */
    var PRICING = {
        bulkDiscounts: [{ min: 50, rate: 0.10 }, { min: 20, rate: 0.05 }],   /* best match first */
        serviceFee: { standard: 0, catering: 250, custom: 150 },             /* rand */
        leadDays: { standard: 1, catering: 3, custom: 5 },                   /* minimum notice */
        maxQuantity: 500
    };

    var SERVICE_LABEL = { standard: 'Standard order (collection)', catering: 'Catering', custom: 'Custom order' };
    var MESSAGE_TYPE_LABEL = {
        general: 'General question', feedback: 'Feedback', compliment: 'Compliment',
        complaint: 'Complaint', partnership: 'Partnership or collaboration'
    };

    /* ----------------------------------------------------------------------
       Validation rules. Each returns an error message, or '' when valid.
       ---------------------------------------------------------------------- */
    function clean(v) { return (v || '').trim(); }

    var NAME_RE = /^[\p{L}][\p{L} '’-]{1,39}$/u;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var PHONE_RE = /^(?:\+27|0027|0)[1-9]\d{8}$/;      /* South African numbers */

    var validators = {
        name: function (v, f) {
            var label = f.getAttribute('data-label') || 'This field';
            if (!v) { return label + ' is required.'; }
            if (!NAME_RE.test(v)) { return label + ' must be 2-40 letters (spaces, hyphens and apostrophes are fine).'; }
            return '';
        },
        email: function (v) {
            if (!v) { return 'Email address is required.'; }
            if (v.length > 254 || !EMAIL_RE.test(v)) { return 'Enter a valid email address, e.g. name@example.com.'; }
            return '';
        },
        phone: function (v, f, form) {
            var required = f.hasAttribute('data-required-if');
            if (required) {
                var m = form.elements[f.getAttribute('data-required-if')];
                required = m && m.value === 'telephone';
            }
            if (!v) { return required ? 'A telephone number is required when you choose to be contacted by telephone.' : ''; }
            var digits = v.replace(/[\s\-()]/g, '');
            if (!PHONE_RE.test(digits)) { return 'Enter a valid South African number, e.g. 064 535 5494 or +27 64 535 5494.'; }
            return '';
        },
        select: function (v, f) {
            if (!v) { return 'Please choose ' + (f.getAttribute('data-label') || 'an option') + '.'; }
            return '';
        },
        quantity: function (v) {
            if (!v) { return 'Number of items is required.'; }
            if (!/^\d+$/.test(v)) { return 'Enter a whole number (no decimals).'; }
            var n = parseInt(v, 10);
            if (n < 1) { return 'You need to order at least 1 item.'; }
            if (n > PRICING.maxQuantity) { return 'For orders above ' + PRICING.maxQuantity + ' items please contact us directly.'; }
            return '';
        },
        date: function (v) {
            if (!v) { return 'Event date is required.'; }
            var d = parseISODate(v);
            if (!d) { return 'Enter a valid date.'; }
            var today = startOfToday();
            if (d <= today) { return 'The event date must be in the future.'; }
            var limit = new Date(today); limit.setFullYear(limit.getFullYear() + 1);
            if (d > limit) { return 'Please choose a date within the next 12 months.'; }
            return '';
        },
        message: function (v, f) {
            var min = parseInt(f.getAttribute('minlength') || '0', 10);
            var max = parseInt(f.getAttribute('maxlength') || '1000', 10);
            if (f.required && !v) { return 'Please type your message.'; }
            if (v && v.length < min) { return 'Your message is too short - please write at least ' + min + ' characters.'; }
            if (v.length > max) { return 'Your message is too long (maximum ' + max + ' characters).'; }
            return '';
        }
    };

    function parseISODate(str) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
        if (!m) { return null; }
        var d = new Date(+m[1], +m[2] - 1, +m[3]);
        return (d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) ? d : null;
    }
    function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    function toISODate(d) {
        var mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + mm + '-' + dd;
    }

    function validateField(field, form) {
        var kind = field.getAttribute('data-validate');
        if (!kind || !validators[kind]) { return ''; }
        var value = clean(field.value);
        var error = validators[kind](value, field, form);
        var errorBox = document.getElementById(field.id + '-error');

        field.setAttribute('aria-invalid', error ? 'true' : 'false');
        if (errorBox) { errorBox.textContent = error; }
        field.classList.toggle('is-invalid', !!error);
        return error;
    }

    function validateForm(form) {
        var firstBad = null;
        var errors = [];
        TL.qsa('[data-validate]', form).forEach(function (field) {
            var err = validateField(field, form);
            if (err) {
                errors.push(err);
                if (!firstBad) { firstBad = field; }
            }
        });
        return { valid: !errors.length, count: errors.length, firstBad: firstBad };
    }

    /* ----------------------------------------------------------------------
       Status messages and AJAX
       ---------------------------------------------------------------------- */
    function setStatus(box, type, message) {
        box.className = 'form-status ' + (type ? 'is-' + type : '');
        box.textContent = '';
        if (!message) { return; }
        var icons = { error: 'fa-circle-exclamation', success: 'fa-circle-check', info: 'fa-spinner fa-spin' };
        box.appendChild(TL.icon(icons[type] || 'fa-circle-info'));
        box.appendChild(document.createTextNode(' ' + message));
    }

    function postJSON(url, payload) {
        var controller = 'AbortController' in window ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, CONFIG.timeoutMs) : null;
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller ? controller.signal : undefined,
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        }).then(function (res) {
            if (!res.ok) { throw new Error('The server replied with status ' + res.status + '.'); }
            return res.json();
        }).finally(function () { if (timer) { clearTimeout(timer); } });
    }

    function friendlyError(err) {
        if (err && err.name === 'AbortError') { return 'The request took too long. Please check your connection and try again.'; }
        if (err && /status \d+/.test(err.message || '')) { return 'Our server had a problem receiving your form. Please try again in a moment.'; }
        return 'We could not send your form. Please check your internet connection and try again, or call us on 064 535 5494.';
    }

    function referenceNumber() {
        var d = new Date();
        var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        return 'TL-' + stamp + '-' + Math.floor(1000 + Math.random() * 9000);
    }

    /* Shared wiring: validation on blur/input, submit handling, honeypot, busy button */
    function setupForm(form, onValid) {
        var statusBox = TL.qs('.form-status', form);
        var submitBtn = TL.qs('button[type="submit"]', form);
        var submitText = submitBtn.textContent;
        var endpoint = form.getAttribute('data-endpoint') || CONFIG.defaultEndpoint;

        TL.qsa('[data-validate]', form).forEach(function (field) {
            field.addEventListener('blur', function () { if (clean(field.value) || field.hasAttribute('data-touched')) { validateField(field, form); } field.setAttribute('data-touched', ''); });
            field.addEventListener('input', function () { if (field.getAttribute('aria-invalid') === 'true') { validateField(field, form); } });
            field.addEventListener('change', function () { validateField(field, form); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            setStatus(statusBox, '', '');

            /* Honeypot: real visitors never see/fill this field, bots usually do */
            var trap = form.elements['website'];
            if (trap && trap.value) { return; }

            var check = validateForm(form);
            if (!check.valid) {
                setStatus(statusBox, 'error', 'Please fix ' + check.count + (check.count === 1 ? ' field' : ' fields') + ' highlighted below and try again.');
                check.firstBad.focus();
                return;
            }

            var data = {};
            TL.qsa('input, select, textarea', form).forEach(function (f) {
                if (f.name && f.name !== 'website') { data[f.name] = clean(f.value); }
            });

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            setStatus(statusBox, 'info', 'Sending your details...');

            postJSON(endpoint, data).then(function (serverReply) {
                setStatus(statusBox, 'success', 'Thank you! Your details were sent successfully.');
                onValid(data, serverReply);
            }).catch(function (err) {
                setStatus(statusBox, 'error', friendlyError(err));
            }).finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = submitText;
            });
        });

        var resetBtn = TL.qs('button[type="reset"]', form);
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                setStatus(statusBox, '', '');
                TL.qsa('.response-panel').forEach(function (p) { p.hidden = true; });
            });
        }

        form.addEventListener('reset', function () {
            setTimeout(function () {
                TL.qsa('[data-validate]', form).forEach(function (f) {
                    f.setAttribute('aria-invalid', 'false'); f.classList.remove('is-invalid'); f.removeAttribute('data-touched');
                    var box = document.getElementById(f.id + '-error'); if (box) { box.textContent = ''; }
                });
                TL.qsa('[data-counter]', form).forEach(function (t) { updateCounter(t); });
            }, 0);
        });
    }

    function updateCounter(textarea) {
        var out = document.getElementById(textarea.id + '-count');
        if (!out) { return; }
        var max = parseInt(textarea.getAttribute('maxlength'), 10);
        out.textContent = textarea.value.length + ' / ' + max + ' characters';
    }

    function initCounters(form) {
        TL.qsa('[data-counter]', form).forEach(function (t) {
            t.addEventListener('input', function () { updateCounter(t); });
            updateCounter(t);
        });
    }

    /* ======================================================================
       ENQUIRY PAGE
       ====================================================================== */
    function productsInCategory(cat) {
        return (window.TACOS_PRODUCTS || []).filter(function (p) { return p.category === cat; });
    }

    function buildQuote(d) {
        var items = productsInCategory(d.category);
        var prices = items.map(function (p) { return p.price; });
        var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
        var qty = parseInt(d.quantity, 10);
        var service = d.additionalservices;

        var discount = 0;
        for (var i = 0; i < PRICING.bulkDiscounts.length; i++) {
            if (qty >= PRICING.bulkDiscounts[i].min) { discount = PRICING.bulkDiscounts[i].rate; break; }
        }
        var fee = PRICING.serviceFee[service] || 0;
        var low = Math.round(min * qty * (1 - discount) + fee);
        var high = Math.round(max * qty * (1 - discount) + fee);

        /* Availability */
        var eventDate = parseISODate(d.eventdate);
        var earliest = startOfToday();
        earliest.setDate(earliest.getDate() + PRICING.leadDays[service]);
        var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var notes = [];
        var available = true;

        if (eventDate < earliest) {
            available = false;
            notes.push(SERVICE_LABEL[service] + ' needs at least ' + PRICING.leadDays[service] + ' day' + (PRICING.leadDays[service] > 1 ? 's' : '') +
                ' notice. The earliest date we can offer is ' + formatDate(earliest) + '.');
        }
        if (!TL.hoursForDay(eventDate.getDay())) {
            if (service === 'standard') {
                available = false;
                notes.push('We are closed on Sundays, so collection orders are not possible on ' + formatDate(eventDate) + '.');
            } else {
                notes.push('We are closed on Sundays, so a ' + dayNames[0] + ' event will need to be confirmed with our team.');
            }
        }
        if (qty >= 100) {
            notes.push('Large orders are confirmed by our team before we can guarantee availability.');
        }

        return { low: low, high: high, qty: qty, discount: discount, fee: fee, available: available, notes: notes, eventDate: eventDate, itemsCount: items.length };
    }

    function formatDate(d) {
        return d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function showQuote(container, d, quote, reference) {
        container.textContent = '';
        var catLabel = d.category.charAt(0).toUpperCase() + d.category.slice(1);
        var heading = TL.el('h3', { id: 'quote-heading', tabindex: '-1' }, [
            TL.icon(quote.available ? 'fa-circle-check' : 'fa-triangle-exclamation'),
            document.createTextNode(quote.available ? 'Good news, ' + d.firstname + '! We can do that.' : 'Thank you, ' + d.firstname + ' - a small change is needed.')
        ]);

        var rows = [
            ['Reference number', reference],
            ['Order', quote.qty + ' x ' + catLabel + ' (' + SERVICE_LABEL[d.additionalservices] + ')'],
            ['Event date', formatDate(quote.eventDate)],
            ['Estimated cost', 'R ' + quote.low.toLocaleString('en-ZA') + (quote.high !== quote.low ? ' - R ' + quote.high.toLocaleString('en-ZA') : '')],
            ['Availability', quote.available ? 'Available (subject to final confirmation)' : 'Not available on this date']
        ];
        if (quote.discount) { rows.splice(4, 0, ['Bulk discount', Math.round(quote.discount * 100) + '% off the item prices']); }
        if (quote.fee) { rows.splice(4, 0, ['Service fee included', 'R ' + quote.fee]); }

        var dl = TL.el('dl', { class: 'quote-list' });
        rows.forEach(function (r) {
            dl.appendChild(TL.el('dt', { text: r[0] }));
            dl.appendChild(TL.el('dd', { text: r[1] }));
        });

        var parts = [heading, dl];
        if (quote.notes.length) {
            var ul = TL.el('ul', { class: 'quote-notes' });
            quote.notes.forEach(function (n) { ul.appendChild(TL.el('li', { text: n })); });
            parts.push(ul);
        }
        var method = d.contactmethod === 'telephone' ? 'by telephone on ' + d.telephone : 'by email at ' + d.email;
        parts.push(TL.el('p', { class: 'quote-footnote', text: 'The price is an estimate based on our current menu (' + quote.itemsCount + ' ' + catLabel.toLowerCase() +
            ' options, R' + productsInCategory(d.category).reduce(function (a, p) { return Math.min(a, p.price); }, Infinity) + ' - R' +
            productsInCategory(d.category).reduce(function (a, p) { return Math.max(a, p.price); }, 0) + ' each). We will contact you ' + method + ' to confirm the final quote.' }));
        parts.push(TL.el('p', {}, [
            TL.el('a', { class: 'btn-small', href: 'products.html#' + d.category, text: 'Browse the ' + catLabel + ' menu' }),
            document.createTextNode(' '),
            TL.el('a', { class: 'btn-small btn-outline', href: 'contact.html', text: 'Contact us' })
        ]));

        parts.forEach(function (p) { container.appendChild(p); });
        container.classList.toggle('is-unavailable', !quote.available);
        container.hidden = false;
        heading.focus();
        container.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }

    function initEnquiry() {
        var form = document.getElementById('enquiry-form');
        if (!form) { return; }
        var result = document.getElementById('enquiry-result');

        /* Earliest selectable date = tomorrow */
        var date = form.elements.eventdate;
        var tomorrow = startOfToday(); tomorrow.setDate(tomorrow.getDate() + 1);
        date.min = toISODate(tomorrow);
        var max = startOfToday(); max.setFullYear(max.getFullYear() + 1);
        date.max = toISODate(max);

        /* Pre-select a category when arriving from a "Enquire" button on the Products page */
        var params = new URLSearchParams(location.search);
        var cat = (params.get('category') || '').toLowerCase();
        if (cat && TL.qs('option[value="' + cat.replace(/[^a-z]/g, '') + '"]', form.elements.category)) {
            form.elements.category.value = cat.replace(/[^a-z]/g, '');
        }
        var item = params.get('item');
        if (item && item.length <= 60 && !form.elements.comments.value) {
            form.elements.comments.value = 'I am interested in: ' + item + '.';
        }

        /* Re-check the phone number when the preferred contact method changes */
        form.elements.contactmethod.addEventListener('change', function () { validateField(form.elements.telephone, form); });

        initCounters(form);
        setupForm(form, function (data, serverReply) {
            var quote = buildQuote(data);
            var ref = referenceNumber();
            if (serverReply && serverReply.id) { /* the server confirmed receipt */ }
            showQuote(result, data, quote, ref);
            form.reset();
        });
    }

    /* ======================================================================
       CONTACT PAGE
       ====================================================================== */
    function compileEmail(d, recipient) {
        var typeLabel = MESSAGE_TYPE_LABEL[d.messagetype] || d.messagetype;
        var subject = '[' + typeLabel + '] Message from ' + d.contactname;
        var lines = [
            'Hello Tacos Locos team,', '',
            d.contactmessage, '',
            '----------------------------',
            'Name: ' + d.contactname,
            'Email: ' + d.contactemail,
            'Phone: ' + (d.contactphone || 'Not provided'),
            'Message type: ' + typeLabel
        ];
        var body = lines.join('\n');
        return {
            subject: subject,
            body: body,
            href: 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
        };
    }

    function showEmail(container, mail, recipient) {
        container.textContent = '';
        var heading = TL.el('h3', { id: 'email-heading', tabindex: '-1' }, [TL.icon('fa-envelope-circle-check'), document.createTextNode('Your email is ready to send')]);
        var preview = TL.el('dl', { class: 'quote-list' }, [
            TL.el('dt', { text: 'To' }), TL.el('dd', { text: recipient }),
            TL.el('dt', { text: 'Subject' }), TL.el('dd', { text: mail.subject })
        ]);
        var pre = TL.el('pre', { class: 'email-preview', tabindex: '0', 'aria-label': 'Email body preview', text: mail.body });
        var openLink = TL.el('a', { class: 'btn-small', href: mail.href }, [TL.icon('fa-paper-plane'), document.createTextNode(' Open in my email app')]);
        var copyBtn = TL.el('button', { type: 'button', class: 'btn-small btn-outline' }, [TL.icon('fa-copy'), document.createTextNode(' Copy email text')]);

        copyBtn.addEventListener('click', function () {
            var text = 'To: ' + recipient + '\nSubject: ' + mail.subject + '\n\n' + mail.body;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { TL.toast('Email text copied.'); },
                    function () { TL.toast('Could not copy - please select the text manually.'); });
            } else {
                TL.toast('Copying is not supported in this browser - please select the text manually.');
            }
        });

        container.appendChild(heading);
        container.appendChild(TL.el('p', { text: 'We have put your message into an email. Press the button below to open it in your email app, check it, and hit send.' }));
        container.appendChild(preview);
        container.appendChild(pre);
        container.appendChild(TL.el('p', {}, [openLink, document.createTextNode(' '), copyBtn]));
        container.hidden = false;
        heading.focus();
        container.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }

    function initContact() {
        var form = document.getElementById('contact-form');
        if (!form) { return; }
        var result = document.getElementById('contact-result');
        var recipient = form.getAttribute('data-email') || CONFIG.defaultEmail;

        initCounters(form);
        setupForm(form, function (data) {
            var mail = compileEmail(data, recipient);
            showEmail(result, mail, recipient);
            form.reset();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initEnquiry();
        initContact();
    });
})();
