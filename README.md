# Tacos Locos - Mexican Street Food Website

A multi-page website for **Tacos Locos**, a Mexican street food business in Cape Town
(tacos, burritos, samosas and wings).

**Live site:** _add your Netlify / GitHub Pages link here after deploying_

## Pages

| Page | File | What it does |
|------|------|--------------|
| Home | `index.html` | Welcome text, open/closed badge, link cards, photo gallery with lightbox |
| About Us | `about.html` | Who we are, mission, vision and values in an accordion |
| Products | `products.html` | Menu loaded with JavaScript: search, category tabs, sorting, details modal |
| Enquiry | `enquiry.html` | Validated enquiry form that returns an estimated price and availability |
| Contact | `contact.html` | Contact details, today's hours, interactive Leaflet map, validated contact form that compiles an email |
| 404 | `404.html` | Friendly "page not found" page |

## Project structure

```
index.html  about.html  products.html  enquiry.html  contact.html  404.html
robots.txt  sitemap.xml  _headers  README.md
css/
  style.css            original styles (Part 2)
  enhancements.css     styles for all Part 3 features
js/
  main.js              shared: nav highlight, animations, accordion, modal, open/closed badge, share buttons
  products-data.js     the menu (17 items) - edit prices/descriptions here
  products.js          Products page: dynamic cards, search, tabs, sorting, modal
  gallery.js           Home page lightbox
  location.js          Contact page: Leaflet map, today's hours, distance button
  forms.js             Enquiry + Contact: validation, AJAX, quote, email
images/                optimised WebP images with descriptive file names
```

## Things to change before you submit

1. **Website address.** The canonical links, Open Graph tags, structured data, `sitemap.xml` and
   `robots.txt` use the placeholder `https://tacos-locos.netlify.app`. After you deploy, use
   find-and-replace across the whole project to swap it for your real address.
2. **Form endpoint.** Forms POST their data (AJAX) to the free test service JSONPlaceholder, which
   accepts and echoes any request but does not store or email anything. To receive real
   submissions, create a free form endpoint (for example Formspree) and replace the
   `data-endpoint` attribute on the two `<form>` tags (and the `action` on the enquiry form).
   If you use another host, also add it to `connect-src` and `form-action` in the
   Content-Security-Policy `<meta>` tag.
3. **Estimate rules.** The enquiry price estimate uses the `PRICING` object at the top of
   `js/forms.js` (bulk discounts, service fees, notice periods). These numbers are examples
   chosen for this project, so adjust them to match the real business.

## Deployment (Netlify)

1. Go to https://app.netlify.com/drop (or connect your GitHub repository).
2. Drag the whole project folder onto the page (or choose the repository and leave the build
   settings empty - there is no build step).
3. Copy the site address Netlify gives you, then do step 1 above and redeploy.

GitHub Pages also works: Settings > Pages > deploy from the `main` branch, root folder.
(`_headers` is only used by Netlify; GitHub Pages ignores it.)

## SEO summary

**Keyword research** (South African / Cape Town search intent, used naturally in titles, headings, body text and alt text):

| Keyword | Where it is used |
|---------|------------------|
| Mexican street food Cape Town | Home title, description, intro text |
| tacos Cape Town / tacos menu | Home, Products |
| burritos, samosas, chicken wings | Products headings, product names, alt text |
| Mexican catering Cape Town / catering quote | Enquiry title, description, headings |
| Tacos Locos contact / 364 Victoria Road | Contact title, description, structured data |

**On-page:** unique title tag and meta description per page; one `<h1>` per page with logical
`h2`/`h3` headings; descriptive lowercase image file names (e.g. `cheese-tacos.webp`) with
descriptive alt text; internal links between pages in the body text; responsive layout; JSON-LD
structured data (Restaurant, opening hours, Menu with prices); Open Graph tags.

**Off-page (to do outside the code):** claim and complete the Google Business Profile (it already
has a Maps listing); add the site to local directories and Cape Town food blogs/Facebook groups for
backlinks; post the site link on the business's social media. Share buttons for WhatsApp,
Facebook and X are included on the pages.

**Technical:** `robots.txt`, `sitemap.xml`, canonical links, lazy-loaded images with width/height set,
images converted to WebP, `defer` on all scripts, long cache times for images via `_headers`.

**Security:** Content-Security-Policy on every page, referrer policy, `rel="noopener noreferrer"` on
external links, `_headers` file (HSTS, no framing, no MIME sniffing, permissions policy), form
input validated and only ever inserted into the page as text (never as HTML), a hidden honeypot field to catch
spam bots, no `innerHTML` with user data, the Leaflet library loaded with an integrity (SRI) hash.

## Testing checklist

- Every page checked in Chromium at desktop (1280px) and phone (375px) widths: no horizontal scrolling and no JavaScript errors.
- Gallery: open, next/previous with arrow keys, close with Escape.
- Accordion: open/close, expand all. Products: 17 cards load, search, tabs, sorting, empty result message, modal, `products.html#wings`.
- Enquiry: empty submit shows errors, bad name/email/phone/quantity rejected, valid submit shows a quote, Sunday and too-soon dates handled.
- Contact: errors shown, short message rejected, valid submit shows the compiled email with a working `mailto:` link.

---

# Changelog

All changes made for **Part 3**, dated 1 November 2026.

> **To complete:** add a section here for each correction you are making from your **Part 2
> feedback**, following the format your lecturer gave you. The entries below describe everything
> that was changed in the project.

## A. Corrections and clean-up of the Part 2 site

| # | File(s) | Change | Reason |
|---|---------|--------|--------|
| A1 | All pages | Renamed `Index.html`, `About.html`, `Products.html`, `Enquiry.html`, `Contact.html` to lowercase (`index.html`, `about.html`, ...) and updated every link. | Clean, consistent URLs. Hosts like Netlify run on case-sensitive servers, where `Index.html` would not load as the home page. |
| A2 | All pages | Replaced the generic titles ("Document") with unique titles and meta descriptions. | SEO - every page needs its own title tag and description. |
| A3 | All pages | Navigation made consistent: every page now uses the same `<ul>` list of links (before, only the home page did). Added `aria-current="page"` highlight, a skip-to-content link, `lang="en-ZA"`, `aria-hidden` on decorative icons. | Consistency, accessibility, SEO. |
| A4 | `enquiry.html` | Fixed broken HTML: the unclosed `</header`, the unclosed `<p>` around the button, the missing footer, and the missing `<form>` element. | Page did not have valid structure and the "form" could not be submitted. |
| A5 | `enquiry.html` | Wrapped fields in a real `<form>`, connected each `<label>` to its field with `for`/`id`, marked required fields, and fixed the service dropdown whose value `"Delivery"` was labelled "Catering" (values are now `standard`, `catering`, `custom`). | Valid form markup, accessibility, correct data. |
| A6 | `contact.html` | Fixed the "Name" label that pointed at a non-existent id (`name`), added the phone number and message type fields, and made the email address and phone number clickable (`mailto:` / `tel:`). | Label linked correctly, form meets the Part 3 brief. |
| A7 | `contact.html` | Corrected opening-hours text from "12:00 AM - 20:00 PM" to "12:00 - 20:00" (and the same for the other days). Noon opening time is assumed - please confirm it is correct. | "12:00 AM" is midnight and "20:00 PM" is not a valid time. |
| A8 | `products.html` | Corrected spelling: "delicous" to "delicious", "Jalepino" to "Jalapeno". Heading "Order any of our delicious Tacos" changed to "...Mexican street food" because the page lists all categories. | Spelling and accuracy. |
| A9 | `css/style.css` | Changed `header nav { width: 110% }` to `width: 100%`. | 110% made every page wider than the screen, causing sideways scrolling on phones. |
| A10 | `css/enhancements.css` | Added rules so lists inside `<main>` display normally (vertical, bulleted, padded). | The navigation styles in `style.css` also matched lists inside `<main>` (because `<main>` sits inside `<nav>`), so the hours, contact details and values lists ran across the page in one row. |
| A11 | All pages | Footer year now fills in automatically (`2015-<current year>`). Inline `style=` attributes were moved into CSS classes. | Stays up to date; supports the Content-Security-Policy. |
| A12 | `images/` | Renamed all images to descriptive lowercase, hyphenated names (e.g. `cheesyburitto.jpeg` to `cheesy-burrito.webp`, `taconobgrnd.png` to `italian-style-tacos.webp`, `backgroundImage.webp` to `tacos-locos-food-truck.webp`) and converted them to WebP, max 800px. Total image size reduced from about 20 MB to 1.3 MB (the one PNG alone was 7.8 MB). | SEO (descriptive file names) and page speed. |
| A13 | All pages | Every image now has a descriptive alt text and `width`/`height` attributes; below-the-fold images use `loading="lazy"`. | SEO, accessibility and page speed (no layout jumping). |

## B. JavaScript functionality (Part 3, section 2)

| # | File(s) | Change |
|---|---------|--------|
| B1 | `about.html`, `js/main.js`, `css/enhancements.css` | **Accordion.** The four About sections (Who We Are, Mission, Vision, Values) are now an accessible accordion with animated open/close, keyboard support (arrow keys, Home, End) and an "Expand all / Collapse all" button. |
| B2 | `products.html`, `js/products.js` | **Tabs.** Category tabs (All, Tacos, Burritos, Samosas, Wings) with ARIA roles, arrow-key navigation, and deep links such as `products.html#wings`. |
| B3 | `js/main.js`, `js/products.js` | **Modal.** Reusable accessible modal dialog (focus trap, Escape to close, click outside to close, focus returns to the button). Used for the product "Details" view with a larger picture, price and an "Enquire" link. |
| B4 | `contact.html`, `js/location.js` | **Interactive map (Leaflet + OpenStreetMap).** Replaces the static Google Maps iframe. Marker and popup at 364 Victoria Road with a "Get directions" link; a "How far am I?" button uses the browser's geolocation (only after clicking) to show the distance and zoom to fit both points; scroll-wheel zoom is enabled only after the map is clicked. A fallback message and a Google Maps link show if the library cannot load. |
| B5 | `css/enhancements.css`, `js/main.js` | **Animations and transitions.** Scroll-reveal fade-ins (IntersectionObserver), floating hero image, animated accordion, modal and lightbox transitions, hover effects on cards, gallery images and buttons, animated back-to-top button and toast messages. All animations are switched off for visitors who set "reduce motion". |
| B6 | `js/*.js` | **Advanced DOM manipulation.** Product cards, modals, the lightbox, quote results, email previews, toasts and share buttons are all created with `createElement`, `DocumentFragment`, event handling and ARIA updates, using `textContent` (never `innerHTML`). Search matches are highlighted by building `<mark>` nodes. |
| B7 | `index.html`, `js/gallery.js` | **Gallery with lightbox.** Eight photos open larger when clicked; previous/next buttons, arrow keys, swipe on touch screens, Escape to close, image counter and captions, preloading of neighbouring images, focus trap. Each thumbnail is still a normal link to the image if JavaScript is off. |
| B8 | `products.html`, `js/products-data.js`, `js/products.js` | **Dynamic content.** The menu is no longer typed into the HTML: it is loaded from `products-data.js` and the cards are built with JavaScript. A `<noscript>` menu is provided for visitors without JavaScript. |
| B9 | `products.html`, `js/products.js` | **Search, filter and sort.** Live search (all words must match, name/description/category, highlighted), category filter, and sorting (menu order, name A-Z/Z-A, price low-high/high-low) with a "Showing X of Y items" message, a "no results" message and a clear button. |
| B10 | `index.html`, `contact.html`, `js/main.js`, `js/location.js` | **Open/closed status and "Today" highlight.** Uses South African time to show "We're open now until 20:00" or when we next open, and highlights today's row in the business hours list. |
| B11 | All pages, `js/main.js` | **Share buttons** (WhatsApp, Facebook, X, plus the device's share sheet where supported) and a **back-to-top** button. |

## C. SEO (Part 3, section 3)

| # | File(s) | Change |
|---|---------|--------|
| C1 | All pages | Keyword research (see table above) and keywords added to titles, descriptions, headings, body text, alt text and file names. Unique title tags (under 60 characters) and meta descriptions (under 160 characters). |
| C2 | All pages | Heading structure checked: one `h1` per page with `h2`/`h3` below it in order. |
| C3 | `images/`, all pages | Descriptive image file names and alt text (see A12, A13). |
| C4 | All pages | Clean lowercase URLs and canonical links. |
| C5 | All pages | Internal links added inside the body text: Home to Menu / About / Enquiry / Contact, About to Menu / Enquiry / Contact, Products to Enquiry, Contact to Enquiry, "Enquire" buttons from each product, link cards on the Home page. |
| C6 | All pages | Mobile-friendly: viewport tag, the horizontal-scroll fix (A9), responsive grids; checked at 375px width. |
| C7 | All pages | Open Graph and Twitter card tags so links look good when shared on social media. |
| C8 | `index.html`, `contact.html`, `products.html` | JSON-LD structured data: Restaurant (address, phone, geo coordinates, opening hours, price range) and Menu (every item with its price in ZAR). Helps with local search. |
| C9 | `robots.txt` | New file: allows crawling, hides the 404 page, points to the sitemap. |
| C10 | `sitemap.xml` | New file listing the five pages with last-modified date, change frequency and priority. |
| C11 | `404.html` | New custom error page (set to `noindex`). |

## D. Page speed and security (Part 3, section 3.3)

| # | File(s) | Change |
|---|---------|--------|
| D1 | `images/` | WebP conversion and resizing (about 20 MB down to 1.3 MB), lazy loading, `fetchpriority="high"` on the hero image, `decoding="async"`. |
| D2 | All pages | `defer` on every script, `preconnect` to the icon CDN, scripts loaded only on the pages that need them (Leaflet only on Contact). |
| D3 | `_headers` | Long browser caching for images, shorter for CSS/JS (Netlify). |
| D4 | All pages | Content-Security-Policy `<meta>` tag that only allows the site's own files plus the specific CDNs used (Font Awesome, Leaflet, OpenStreetMap tiles, the form endpoint); `object-src 'none'`, `base-uri 'self'`. |
| D5 | `_headers` | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` (Netlify). |
| D6 | All pages | `rel="noopener noreferrer"` on links that open in a new tab; Leaflet loaded with a Subresource Integrity hash and `crossorigin`. |
| D7 | `js/forms.js`, forms | Honeypot field to catch spam bots; all user input is trimmed, length-limited (`maxlength`) and only displayed with `textContent`; AJAX requests send no cookies or referrer. |

## E. Forms (Part 3, section 4)

| # | File(s) | Change |
|---|---------|--------|
| E1 | `enquiry.html` | **Enquiry form.** Fields: first name, last name, email, telephone, category, number of items, event date, type of service, preferred contact method, comments. Uses `input`, `select`, `textarea`, `label`, `required`, `maxlength`, `min`/`max`, `autocomplete`. The `action` attribute holds the endpoint URL. |
| E2 | `js/forms.js` | **Client-side validation.** Names (letters only, 2-40 characters), email format, South African phone numbers (`064 535 5494`, `+27 64 535 5494`), whole-number quantity from 1 to 500, event date in the future and within 12 months, required selections, comment length. The telephone becomes required when "Telephone" is the preferred contact method. |
| E3 | `js/forms.js`, `css/enhancements.css` | **Error handling.** A message under each invalid field (`role="alert"`, `aria-invalid`), red highlighting, a summary at the top of the form, focus moved to the first error, errors re-checked while typing and when leaving a field, a live character counter on message boxes. |
| E4 | `js/forms.js` | **AJAX submission.** `fetch()` POSTs the validated data as JSON without reloading the page; button shows "Sending...", 10-second timeout, friendly messages for network and server errors. |
| E5 | `js/forms.js`, `js/products-data.js` | **Enquiry response (cost and availability).** After a successful submit the customer sees a reference number, an estimated price range from the real menu prices (with bulk discount and service fee), and availability: closed on Sundays for collection, minimum notice periods (1 day standard, 3 days catering, 5 days custom), large orders flagged for confirmation. Arriving from a product's "Enquire" button pre-selects the category and mentions the item. |
| E6 | `contact.html` | **Contact form.** Fields: name, email, optional phone, message type (general, feedback, compliment, complaint, partnership), message (10-1000 characters). The form `action` is a `mailto:` link as a no-JavaScript fallback. |
| E7 | `js/forms.js` | **Compiled email.** After validation and AJAX submission, the details are compiled into an email addressed to `info@tacoslocos.co.za` with a subject such as "[Feedback] Message from Anele" and a formatted body; the customer sees a preview, an "Open in my email app" button (`mailto:` link) and a "Copy email text" button. |

## F. Files added or removed

- **Added:** `css/enhancements.css`, `js/main.js`, `js/products-data.js`, `js/products.js`, `js/gallery.js`, `js/location.js`, `js/forms.js`, `robots.txt`, `sitemap.xml`, `_headers`, `404.html`, `README.md`.
- **Renamed:** all five HTML pages (A1) and all images (A12).
- **Removed:** the old image files that were replaced by the optimised WebP versions (including the 7.8 MB `taconobgrnd.png`).
- **Libraries used:** Leaflet 1.9.4 (map), Font Awesome 6.5.1 (icons, already in use). Everything else is plain JavaScript - no jQuery needed.


## Consolidated project structure

- HTML pages are kept in the project root.
- `css/style.css` contains the original styles and enhancements in their original cascade order.
- `js/app.js` contains all six original JavaScript files concatenated in dependency order.
- `images/` contains the site images.
- `sitemap.xml` is retained at the root.

Open `index.html` to run the site locally. The Leaflet map and Font Awesome remain external CDN dependencies as in the original project.

Reference:

Font Awesome (n.d.) Font Awesome icons. Available at: https://fontawesome.com/ (Accessed: 2 November 2026).

GitHub (n.d.) GitHub documentation. Available at: https://docs.github.com/ (Accessed: 2 November 2026).

Leaflet (n.d.) Leaflet: an open-source JavaScript library for interactive maps. Available at: https://leafletjs.com/ (Accessed: 2 November 2026).

MDN Web Docs (n.d.) JavaScript documentation. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript (Accessed: 2 November 2026).

Netlify (n.d.) Netlify documentation. Available at: https://docs.netlify.com/ (Accessed: 2 November 2026).

OpenStreetMap (n.d.) OpenStreetMap: collaborative mapping project. Available at: https://www.openstreetmap.org/ (Accessed: 2 November 2026).