# Tornet Market — fictional movie prop

> **FICTIONAL MOVIE PROP — NOT A REAL MARKETPLACE.** This project is a front-end set piece created for a film. It does not sell or deliver anything. All listings, prices, reviews, account statistics, wallet balances, earnings, transactions, orders, and market backstory are fictional presentation elements, not real offers or verified activity.

The interface is interactive for filming: buttons, navigation, carts, profile editing, and simulated order statuses work inside the browser. No money moves, no cryptocurrency wallet is connected, no payment or escrow is processed, and no goods or services are provided. Autoshop plans do not execute purchases. Support forms do not send messages. Saved changes stay in browser storage on the device.

The sign-in screen is a client-side prop control, not secure account authentication. Do not enter real credentials, payment details, wallet recovery phrases, or personal information. References to historical marketplaces are background context and do not imply affiliation with their operators. Fictional listings do not offer access to real accounts, identity records, documents, or other goods.

Everything below documents the development of the prop. Earlier launch language describes the fictional story, not a real commercial launch.

---

﻿# Tornet Market

A marketplace front end for independent developers, hackers, coders, and innovators. No build step, external fonts, runtime packages, or payment services.

## Open it

Run `node server.js` in this folder and visit http://localhost:4173. You can also open index.html directly for a quick preview. Localhost or HTTPS is required for PWA installation and recommended for login and storage.

The owner username is `swiping.cc`; use the password requested in the project conversation. Sign in via the avatar or Sign in. Authentication uses a salted PBKDF2-SHA-256 hash (120,000 iterations). No plaintext password is stored in the site. This client-side login controls the interface only. Server-side authentication and catalog authorization are required before a public launch.

## Customize

- **products.js**: all product names, categories, prices, descriptions, tags, placeholder ratings, starting balance, and the fixed BTC conversion rate. Each product needs a unique id. To use your image, put it in assets/ and set the product's `image` to `assets/your-image.png`.
- **styles.css**: colors are in the first `:root` block; all layouts and mobile styles are here.
- **script.js**: page content, navigation, demo login, cart, orders, and wallet behavior. Pages use hash routes, so browser back/forward and links work without hosting rewrites.
- **index.html**: page metadata, favicon, and entry scripts.
- **assets/**: generated Tornet logo, compact T icon, browser favicon, and PWA/iPhone icons. Originals are retained.
- **manifest.webmanifest / sw.js**: installation metadata and offline app shell. Network-first caching makes content edits visible when online. If changing the shell's file list, increment the service worker cache version.

## Demo features

Search, category filters, sorting, saved products, product pages, cart quantities, review modal, checkout confirmation, order history, downloadable demo receipts, wallet top-ups, owner sale simulation, wallet labels, FAQ and demo support tickets. Wallets, purchases, ratings, reviews, and delivery are simulated. No real wallet provider is contacted and no real product is downloaded.

Cart, saved items, orders, and wallet state are stored in this browser under localStorage key `tornet-v2`. Login lasts for the tab session. Starting balance changes only affect fresh demo state. To reset, remove `tornet-v2` in browser developer tools → Application → Local Storage, then refresh.

On iPhone: serve on HTTPS, open in Safari, then Share → Add to Home Screen. Desktop/Android browsers offer installation when supported. Offline use works after one successful online visit.

## Original site

The previous index.html, styles.css, and script.js are preserved in original-backup/. The hand-drawn LgooReference.png is untouched.

## Development checks

`test-tools/` contains local Playwright testing dependencies; it is not needed to run or deploy the site. Only deploy index.html, styles.css, script.js, products.js, manifest.webmanifest, sw.js, and assets/.

## Reference styling and background

The Home page follows MarketplaceReference.png: a floating header, owner stats strip, boxed categories, and centered welcome panel. Autoshop opens the product catalog. Your supplied TornetMarketBacgrkoundRefernece image is used as assets/background.jpg, with a dark overlay for readability. Replace that file to change the backdrop. Your original reference files are untouched.

The generated wordmark is assets/logo.png. The compact T artwork is exported to favicon.png, apple-touch-icon.png, icon-192.png, and icon-512.png. Full generated source PNGs are retained in assets/.

Verified with Chromium and WebKit: responsive routes from 320px to desktop, dialogs, and page rendering. The Chromium end-to-end check covers login rejection/success, search/sort, saved items, cart persistence and quantities, checkout, order receipts, wallet top-ups and earnings, insufficient balance, support tickets, logout, navigation, and offline loading.

## Members-only catalog

Signed-out visitors see blurred synthetic category and product previews. Real listing text, images, prices, and descriptions are not rendered into guest page markup, titles, or accessible labels. Home, the public manifesto, and support remain open. Direct product URLs and cart routes use the same gate, and logging out restores it. Public registration has not been implemented.

This is a front-end presentation gate, not protection against source inspection: products.js is still publicly served, local session state is editable, and existing offline caches may contain assets. Before production, move catalog data and authorization to server APIs, implement secure accounts/sessions, and keep protected responses out of shared/offline caches.

Public demo branding has been replaced with Tornet branding. Wallet and checkout retain explicit test labels because payment, fulfillment, and wallet integrations are not live; the support form is a message preview until a delivery service is connected.

Run test-tools/membership.cjs with TORNET_TEST_PASSWORD set in the environment to check guest gating, sign-in, logout, public routes, and mobile layouts in Chromium and WebKit. No password is saved in the test file.

## Adding categories

Edit `MARKET.categories` in products.js to add named categories, including ones without products. Categories used by products are also picked up automatically. The sidebar and catalog filters use the same list. On mobile, only the category section scrolls; workspace navigation and support/sign-in links remain visible. Guest category names remain blurred.

## Owner profile and wallet customization

Sign in as `swiping.cc`, open the profile avatar, then choose **Edit profile** above Sign out. Change your display name, bio, photo, wallet label, balance, earnings, spending, and transaction history. The sign-in username remains fixed. JPG/PNG/WebP/GIF photos are converted to a 256px image before storage. Cancel discards staged changes. Save writes the complete profile to `tornet-v2` on this browser/device; a storage failure keeps the editor open with an error.

Totals are edited independently from transaction history. Later purchases and sale entries update the chosen balances and totals. Editing history does not rewrite order records. The persistent `TN-` address is a display identifier, not a blockchain deposit address; the wallet remains a manually managed device ledger with a notice explaining this. Owner-only controls are enforced by the current front-end session; production enforcement still requires server authentication.

Interface accents now use icy blue (#78D8F0). The displayed wordmark is color-adjusted through CSS; original image files are retained. Public copy follows the reference's more reserved underground-market tone.

## Wallet privacy and order stages

Wallet address is masked on every page render, refresh, and when the tab is hidden. The eye toggles reveal/hide; clicking the revealed address copies it, with confirmation or an explicit clipboard error. The wallet identifier remains a non-payable device-ledger address.

Order status derives from the saved order timestamp: Pending for the first 8 seconds, Idle until 20 seconds, then Completed. Summary cards, order rows, open order dialogs, and receipts agree on the current stage. These stages describe the device's workflow, not live delivery or network confirmations. Empty order history shows Idle. Receipt filenames end in `-receipt.txt`.

The interface and generated receipts no longer use the word “test.” Development checks remain in the non-public test-tools folder.

## Oni glass theme and iPhone layout

The supplied TornetMarketOniGif.gif is copied to assets/oni-motion.gif and displayed as a non-interactive background layer behind the header, session strip, and upper panels. A reduced-motion media query swaps it for assets/oni-still.png, copied from the supplied TornetMarketOniLogo.png. Both are cached for offline use. Glass opacity and blur are controlled in the final 'Floating glass and Oni identity layer' section of styles.css.

The left sidebar now contains Categories and the existing owner/support/sign-in area. Saved items are available in the profile modal. On mobile, primary page links remain available in a horizontally scrolling row within the top header. Categories retain their independently scrolling drawer.

The viewport uses viewport-fit=cover, with safe-area insets applied to page edges, sticky navigation, dialogs, and toasts. The drawer is positioned below the measured header and sized against the visual viewport. Chromium/WebKit checks covered simulated portrait/landscape safe-area insets and 30 additional categories. Physical iPhone testing is still recommended; browser emulation does not reproduce the hardware Dynamic Island.

## Autoshop prop planner

The Autoshop header link opens #/autoshop, independently of the category catalog at #/market. Signed-in owners can create, edit, pause/resume, remove, and preview locally saved plans. A plan contains fictional items, quantities, a future starting time, a repeat preference, and a per-run spending limit. The estimated total must fit within that limit.

The separate placeholder inventory is `MARKET.autoshopProps` at the bottom of products.js. Plans are stored in `tornet-v2.autoshopSchedules`. This is an explicitly labeled prop preview: there is no scheduler/worker, inventory reservation, external request, wallet deduction, or order creation. Passing dates display 'Window passed'; repeat preferences do not execute. Chromium and WebKit checks verified state persistence and that planning never mutates cart, wallet, orders, or transactions.

## Autoshop recovery

The restored scheduling feature lives in **autoshop.js**. index.html loads it after products.js and before script.js. Include autoshop.js when deploying the static site; the local server and offline cache include it. The inventory remains in MARKET.autoshopProps in products.js. A recovery copy is kept at original-backup/autoshop-restored.js, alongside the timestamped script snapshot from before restoration.

Autoshop's selection now reads MARKET.products directly, so catalog additions, names, and prices automatically appear in its picker. MARKET.autoshopProps is retained for reference but is no longer read. Saved plans keep item snapshots; when editing a plan whose item was removed, the selector marks that item unavailable and requires a replacement. Planning remains non-executing and never changes wallet balances or orders.

## Oni browser and installed-app icons

Browser tabs now use assets/oni-favicon-32.png and oni-favicon-48.png. Safari Home Screen uses oni-apple-touch-180.png. The manifest uses oni-icon-192.png, oni-icon-512.png, and a separately padded oni-maskable-512.png. These are size exports of the supplied TornetMarketOniLogo.png, with no AI redraw. App icons use an opaque dark-blue background; the maskable version keeps the artwork inside the safe area. Versioned filenames and service-worker cache v6 replace the old T icons. Existing installed shortcuts may need to be removed and added again after deployment.
