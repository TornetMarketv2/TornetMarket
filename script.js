'use strict';
const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = v => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(v);
const btc = v => (v / MARKET.btcRate).toFixed(6);
const paths = {
 eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 'eye-off':'m3 3 18 18 M10 5a12 12 0 0 1 12 7 17 17 0 0 1-4 5 M6 6a17 17 0 0 0-4 6s3 7 10 7c2 0 4-.6 5-1.5 M10 10a3 3 0 0 0 4 4',
 copy:'M9 9h12v12H9z M15 5V3H3v12h2',
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', code:'m8 7-5 5 5 5 m8-10 5 5-5 5 m-3-14-2 18', cart:'M2 3h3l3 12h11l3-9H6 M9 20h.01 M18 20h.01', wallet:'M20 7V4H4a2 2 0 0 0 0 4h17v12H4a2 2 0 0 1-2-2V6 M21 11h-6v5h6', box:'m12 3 9 5-9 5-9-5 9-5Z M3 8v10l9 5 9-5V8 M12 13v10 M7 5l10 5', shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z m-4 10 3 3 5-6', arrow:'M4 12h16 m-6-6 6 6-6 6', search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3', heart:'M12 21S2 14 2 7a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 14-10 14Z', help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', logout:'M9 3H3v18h6 M9 12h13 m-5-5 5 5-5 5', plus:'M12 5v14 M5 12h14', close:'m6 6 12 12 M6 18 18 6', check:'m4 12 5 5L20 6', bolt:'m13 2-9 12h7l-1 8 10-13h-7l0-7Z', menu:'M3 6h18 M3 12h18 M3 18h18', bell:'M5 16h14l-2-3V8a5 5 0 0 0-10 0v5l-2 3Z M10 20h4', download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5'
};
const icon = n => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.code}"/></svg>`;
const fresh = () => ({cart:{},saved:[],orders:[],balance:MARKET.startingBalance,transactions:[],walletLabel:''});
let state;
try { const v = JSON.parse(localStorage.getItem('tornet-v2')); state = v && v.cart && Array.isArray(v.orders) && Array.isArray(v.saved) && Array.isArray(v.transactions) && Number.isFinite(v.balance) ? v : fresh(); } catch { state = fresh(); }
state.profile = {displayName:'swiping.cc',bio:'Independent builder. Market owner.',avatar:'',earningsOffset:0,spendingOffset:0,...(state.profile||{})};
if (!state.profile.address) { const bytes=crypto.getRandomValues(new Uint8Array(12)); state.profile.address='TN-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(); try {localStorage.setItem('tornet-v2',JSON.stringify(state));} catch {} }
state.transactions.forEach(t=>{const labels={'Test wallet top-up':'Wallet credit','Demo wallet top-up':'Wallet credit','Test product sale':'Product sale','Demo product sale':'Product sale'};if(labels[t.label])t.label=labels[t.label];});
state.autoshopSchedules=Array.isArray(state.autoshopSchedules)?state.autoshopSchedules:[];
let authenticated = false;
try { authenticated = sessionStorage.getItem('tornet-session') === 'owner'; } catch {}
let search = '', category = 'All products', sort = 'featured', savedOnly = false, returnTo = '#/home';
let toastTimer, installPrompt;
let categoryScrollPending=false;
let walletAddressRevealed=false;
const product = id => MARKET.products.find(p => p.id === id);
for (const [id,q] of Object.entries(state.cart)) if (!product(id) || !Number.isInteger(q) || q < 1 || q > 99) delete state.cart[id];
const cartCount = () => Object.values(state.cart).reduce((a,b) => a+b,0);
const total = () => Object.entries(state.cart).reduce((a,[id,q]) => a + product(id).price*q,0);
function persist() { try { localStorage.setItem('tornet-v2',JSON.stringify(state)); return true; } catch { toast('Storage is unavailable. Changes last for this visit only.'); return false; } }
function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3500); }
function go(path) { if(location.hash === path) {render();scrollToCategoryResults();} else location.hash=path; }
const brand = () => `<a class="brand" href="#/home" aria-label="Tornet Market home"><picture class="brand-oni" aria-hidden="true"><source media="(prefers-reduced-motion: reduce)" srcset="assets/oni-still.png"><img src="assets/oni-motion.gif" alt="" decoding="async"></picture><img src="assets/logo.png" alt="Tornet Market"><span class="brand-fallback">TORNET<span>MARKET</span></span></a>`;
function shell(content, page='home') {
 const nav = (p,n,i) => `<a href="#/${p}" class="nav-link ${page===p?'active':''}" ${page===p?'aria-current="page"':''}>${icon(i)}${n}${p==='orders'&&state.orders.length?`<span class="count">${state.orders.length}</span>`:''}</a>`;
 return `<div class="topline"><span><i class="dot"></i> ALL SYSTEMS OPERATIONAL</span><span>Developed By UnknownBlackHat <b>//</b> EST. 2011</span><span class="topline-badge">Hack The World</span></div>
 <header class="header">${brand()}<nav class="desktop-nav" aria-label="Main">${nav('home','Home','grid')}${nav('orders','Orders','box')}${nav('wallet','Wallet','wallet')}${nav('autoshop','Autoshop','code')}${nav('support','Contact','help')}<button class="nav-link header-login" data-action="${authenticated?'logout':'login'}">${authenticated?'[Logout]':'[Login]'}</button></nav><div class="header-actions"><button class="icon-button" data-action="announcements" aria-label="Announcements">${icon('bell')}<i class="notification-dot"></i></button><a class="cart-button" href="#/cart">${icon('cart')}<span>Cart</span><b id="cart-count">${authenticated?cartCount():0}</b></a><button class="avatar" data-action="account" aria-label="Account">${authenticated?profileAvatar():'?'}</button><button class="icon-button mobile-menu" data-action="menu" aria-label="Toggle categories" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button></div></header>
 <div class="session-strip"><span>Welcome, <b>${authenticated?'swiping.cc':'explorer'}</b></span><a href="#/orders">Total orders <b>${authenticated?state.orders.length.toString().padStart(2,'0'):'—'}</b></a><a href="#/wallet">Balance <b>${authenticated?money(state.balance):'—'}</b></a><button data-action="account">Trust level <b class="green">${authenticated?'MAX':'GUEST'}</b></button></div><div class="layout"><aside class="sidebar" id="sidebar"><div class="side-label category-label">CATEGORIES</div><nav class="categories" aria-label="Categories" tabindex="0">${categoryNavigation(page)}</nav><div class="side-bottom"><div class="owner-card"><div class="owner-top">${icon('shield')}<span>${authenticated?'OWNER ACCESS':'EXPLORER ACCESS'}</span><span class="live-square"></span></div><strong>${authenticated?'Trust without limits.':'Enter the inner circle.'}</strong><p>${authenticated?'Every corner of the market. Unlocked.':'Sign in to raise your trust level.'}</p><div class="trust-meter"><span style="width:${authenticated?100:20}%"></span></div><small>${authenticated?'TRUST LEVEL <b>MAX / 100</b>':'STATUS <b>GUEST</b>'}</small></div>${nav('support','Help & support','help')}<button class="nav-link" data-action="${authenticated?'logout':'login'}">${icon(authenticated?'logout':'user')}${authenticated?'Log out':'Sign in'}</button><div class="version"><i class="dot"></i> TORNET v2.0 <span>●</span></div></div></aside>
 <main id="main" tabindex="-1">${content}<footer><span>© ${new Date().getFullYear()} Tornet Market <span class="muted">/ Built for the ones who build.</span></span><div><a href="#/support">Support</a><button data-action="terms">Market rules</button><a href="#/manifesto">Manifesto</a></div></footer></main></div>`;
}
function art(p, large=false) {
 if(p.image) return `<div class="product-art custom-art ${large?'large':''}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></div>`;
 const visuals = {
 terminal:`<div class="mini-terminal"><div class="terminal-bar"><i></i><i></i><i></i><span>ghost — zsh</span></div><div class="terminal-body"><span>~/workspace</span><br><b>❯</b> ghost init<span class="cursor">_</span><br><small>✓ environment ready<br>✓ make something different</small></div></div>`,
 orbit:`<div class="orbit-object"><i></i><i></i><i></i><i></i><b>o</b></div>`,
 grid:`<div class="network-art"><div></div><i class="node n1"></i><i class="node n2"></i><i class="node n3"></i><i class="node n4"></i><b>${icon('shield')}</b></div>`,
 wave:`<div class="wave-art">${Array.from({length:29},(_,i)=>`<i style="height:${20+Math.sin(i*.55)**2*90}px"></i>`).join('')}</div>`,
 cube:`<div class="cube-art"><i></i><i></i><i></i><b>V</b></div>`,
 code:`<div class="code-art"><span>01 <em>const</em> midnight = {</span><span>02 &nbsp; theme: <b>'after-hours'</b>,</span><span>03 &nbsp; inspiration: <b>Infinity</b>,</span><span>04 &nbsp; build: <b>true</b></span><span>05 }<i>_</i></span>`
 };
 return `<div class="product-art art-${p.art} ${large?'large':''}" style="--art:${esc(p.accent)}"><span class="art-id">TM / ${esc(p.id).toUpperCase()}</span>${visuals[p.art]||visuals.terminal}${p.art==='code'?'</div>':''}<span class="art-bottom">${esc(p.category).toUpperCase()}<span>↗</span></span></div>`;
}
function card(p) { return `<article class="product-card"><div class="card-visual"><a href="#/product/${p.id}" aria-label="View ${esc(p.name)}">${art(p)}</a>${p.badge?`<span class="product-badge">${esc(p.badge)}</span>`:''}<button class="save-button ${state.saved.includes(p.id)?'is-saved':''}" data-save="${p.id}" aria-label="${state.saved.includes(p.id)?'Unsave':'Save'} ${esc(p.name)}" aria-pressed="${state.saved.includes(p.id)}">${icon('heart')}</button></div><div class="card-content"><div class="card-meta"><span>${esc(p.category)}</span><span class="rating">MEMBER LISTING</span></div><a class="product-title" href="#/product/${p.id}">${esc(p.name)}</a><p>${esc(p.subtitle)}</p><div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="card-price"><div><strong>${money(p.price)}</strong><small>≈ ${btc(p.price)} BTC</small></div><button class="add-button" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart">${icon('plus')}<span>Add to cart</span></button></div></div></article>`; }
function filteredProducts() {
 let list=MARKET.products.filter(p=>(category==='All products'||p.category===category)&&(!savedOnly||state.saved.includes(p.id))&&`${p.name} ${p.category} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
 if(sort==='low')list.sort((a,b)=>a.price-b.price); if(sort==='high')list.sort((a,b)=>b.price-a.price); if(sort==='rating')list.sort((a,b)=>Number(b.rating)-Number(a.rating)); return list;
}
function catalogResults() { const list=filteredProducts(); return list.length?list.map(card).join(''):`<div class="empty-state">${icon('search')}<h3>No signals found.</h3><p>Try another search or explore all products.</p><button class="button" data-action="clear-filters">Clear filters</button></div>`; }

function home() {return `<div class="home-topline"><span><i class="dot"></i> MARKET ONLINE</span><span>session.connected[proxy]</span></div><section class="welcome-panel"><div class="welcome-heading"><span class="eyebrow">THE ORIGINAL SILKROAD MARKETPLACE</span><h1>Welcome, <span>${authenticated?'swiping.cc':'explorer'}</span></h1><div class="welcome-rule"></div></div><div class="welcome-body"><p class="welcome-lead">The doors are open. The rest is earned.</p><p>Welcome to Tornet Market — Tech Solutions and Marketplace for Hackers ©</p><p>Dont want to miss out on product? Enter the <a href="#/market">Autoshop</a> to schedule and secure products while your away.</p><p> At Tornet Market, we continue to operate with the same high standards and values that made us a key player in the industry. Our administration remains experienced and committed, ensuring top-notch security, 24/7 support from professional staff, and a clear vision for the future of tech solutions and the marketplace.</p><p>Need a direct line? The <a href="#/support">Support Center</a> holds the essentials. Leave a signal or consult the <button class="inline-link" data-action="announcements">latest dispatch</button> before you proceed.</p><p><a href="#/manifesto">Read the Tornet Manifesto ↗</a></p><p class="welcome-signoff">Welcome back to Tornet Market.<br><strong>Keep your standards high. Keep your signal clear.</strong></p></div><div class="welcome-actions"><a class="button primary" href="#/market">Enter the Autoshop ${icon('arrow')}</a><button class="button" data-action="${authenticated?'account':'login'}">${icon(authenticated?'shield':'user')} ${authenticated?'Owner workspace':'Sign in'}</button></div><div class="welcome-footer"><span>${icon('shield')} OWNER OPERATED</span><span>${icon('bolt')} MEMBERS-ONLY CATALOG</span><span>${icon('code')} BUILT FOR BUILDERS</span></div></section><div class="home-info-grid"><a href="#/market" class="home-info-card"><div>${icon('box')}<span>THE AUTOSHOP</span>${icon('arrow')}</div><strong>The collection awaits.</strong><p>Sign in to discover the collection.</p></a><a href="#/wallet" class="home-info-card"><div>${icon('wallet')}<span>YOUR PERSONAL VAULT</span>${icon('arrow')}</div><strong>Every entry leaves a trace.</strong><p>Balance, earnings, and spending. All in one place.</p></a></div><div class="home-disclaimer"><i class="dot"></i> HACK THE WORLD <span>/ Curiosity is where it begins.</span></div>`;}

function market() { return `<div class="page-kicker"><span>THE ORIGINAL SILKROAD MARKETPLACE</span><span>WELCOME BACK, <b>${authenticated?'SWIPING.CC':'EXPLORER'}</b> ${authenticated?'<em>OWNER</em>':''}</span></div><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> INDEPENDENT EXCHANGE / RESTRICTED MARKETPLACE</div><h1>Beyond the surface.<br>Inside the <span>network.</span></h1><p>Independent releases. Original code. Uncommon tools.<br>The collection is open to those on the inside.</p><div class="hero-actions"><a href="#catalog" class="button primary" data-action="browse">Explore the market ${icon('arrow')}</a><button class="text-button" data-action="about">The Tornet manifesto ↗</button></div><div class="hero-foot"><span>${icon('shield')} Member access</span><span>${icon('bolt')} Independent creators</span><span>${icon('code')} Made for builders</span></div></div><div class="hero-visual" aria-hidden="true"><div class="coordinate coord-top">TM — NETWORK / 001<br>35° 41′ 22.2″ N</div><svg class="wire-globe" viewBox="0 0 360 360"><defs><radialGradient id="glow"><stop stop-color="#78d8f0" stop-opacity=".15"/><stop offset="1" stop-color="#78d8f0" stop-opacity="0"/></radialGradient></defs><circle cx="180" cy="180" r="175" fill="url(#glow)"/><g fill="none" stroke="#78d8f0" stroke-width=".7" opacity=".65" transform="rotate(-24 180 180)"><circle cx="180" cy="180" r="133"/>${[22,48,78,108,128].map(rx=>`<ellipse cx="180" cy="180" rx="${rx}" ry="133"/>`).join('')}${[-105,-75,-40,0,40,75,105].map(y=>`<ellipse cx="180" cy="${180+y}" rx="${Math.sqrt(133**2-y**2)}" ry="${Math.max(8,30*(1-Math.abs(y)/150))}"/>`).join('')}</g><g fill="#78d8f0"><circle cx="96" cy="79" r="4"/><circle cx="287" cy="262" r="3"/><circle cx="73" cy="261" r="2"/></g></svg><span class="globe-label">NO BORDERS.<br>JUST POSSIBILITIES.</span><span class="visual-cross cross-one">+</span><span class="visual-cross cross-two">+</span></div></section><div class="market-strip"><div><i class="dot"></i><b>THE MARKET IS OPEN</b><span>A fresh start. The same independent spirit.</span></div><button data-action="announcements">Read the dispatch ${icon('arrow')}</button></div><section id="catalog"><div class="section-heading"><div><div class="eyebrow muted">FIND YOUR NEXT ADVANTAGE</div><h2>${savedOnly?'Your collection':category==='All products'?'Explore the market':esc(category)}<span id="result-count">${filteredProducts().length}</span></h2></div><span class="collection-note">HANDPICKED. READY TO BUILD.</span></div><div class="catalog-toolbar"><label class="search-box">${icon('search')}<input id="search" type="search" placeholder="Search the underground..." value="${esc(search)}" aria-label="Search products"><kbd>/</kbd></label><label class="sort-label"><span>Sort by</span><select id="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label></div><div class="filter-chips">${catalogCategories().map(c=>`<button class="chip ${category===c?'selected':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('')}${savedOnly?'<button class="chip selected" data-action="saved">Saved only ×</button>':''}</div><div class="product-grid" id="products">${catalogResults()}</div></section><section class="bottom-banner"><div>${icon('code')}<div><h3>Follow the signal.</h3><p>Independent tools for independent minds.</p></div></div><a href="#/support">Need a hand? Let's talk ${icon('arrow')}</a></section>`; }
function pageHead(kicker,title,description) { return `<div class="page-heading"><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>`; }
function productPage(id) { const p=product(id); if(!p)return notFound(); return `<div class="breadcrumbs"><a href="#/market">Marketplace</a><span>/</span><span>${esc(p.category)}</span><span>/</span>${esc(p.name)}</div><section class="product-detail"><div>${art(p,true)}<div class="detail-note">${icon('code')} Editable product preview / ${esc(p.format)}</div></div><div class="detail-copy"><div class="eyebrow">${esc(p.category)} <span class="badge">MEMBER LISTING</span></div><h1>${esc(p.name)}</h1><p class="detail-subtitle">${esc(p.subtitle)}</p><div class="rating"><span>Community reviews coming soon</span></div><p>${esc(p.description)}</p><div class="tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="detail-price">${money(p.price)}<small>≈ ${btc(p.price)} BTC · reference rate</small></div><div class="detail-actions"><button class="button primary" data-add="${p.id}">${icon('cart')} Add to cart</button><button class="button" data-save="${p.id}">${icon('heart')} ${state.saved.includes(p.id)?'Saved':'Save'}</button></div><div class="feature-list"><span>${icon('bolt')} Live fulfillment coming soon</span><span>${icon('shield')} Owner access · maximum trust</span><span>${icon('box')} Version ${esc(p.version)} · ${esc(p.format)}</span></div></div></section><section class="panel"><h2>What's inside</h2><p>${esc(p.description)}</p><p class="muted">Product content is being prepared. Checkout currently creates an order receipt; live fulfillment is not connected.</p></section><div class="section-heading"><h2>Keep exploring</h2><a href="#/market">View all ${icon('arrow')}</a></div><div class="product-grid">${MARKET.products.filter(x=>x.id!==p.id).slice(0,3).map(card).join('')}</div>`; }
function cartPage() { return `${pageHead('YOUR NEXT BUILD STARTS HERE','Your cart.',`${cartCount()} item${cartCount()===1?'':'s'} in your collection. Ready when you are.`)}${cartCount()?`<div class="checkout-layout"><section class="panel cart-items">${Object.entries(state.cart).map(([id,q])=>{const p=product(id);return `<article class="cart-row"><a href="#/product/${id}" class="cart-art">${art(p)}</a><div class="cart-product"><small>${esc(p.category)}</small><a href="#/product/${id}">${esc(p.name)}</a><span>${money(p.price)} each</span><button class="text-button" data-remove="${id}">Remove</button></div><div class="quantity"><button data-qty="${id}" data-delta="-1" aria-label="Decrease ${esc(p.name)} quantity">−</button><span>${q}</span><button data-qty="${id}" data-delta="1" aria-label="Increase ${esc(p.name)} quantity" ${q>=99?'disabled':''}>+</button></div><strong>${money(p.price*q)}</strong></article>`;}).join('')}<a href="#/market" class="text-button">← Continue exploring</a></section><aside class="panel order-summary"><div class="eyebrow">THE DETAILS</div><h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><span>${money(total())}</span></div><div class="summary-line"><span>Platform fee</span><span class="green">$0.00</span></div><div class="summary-total"><span>Total</span><strong>${money(total())}</strong></div><div class="muted mono">≈ ${btc(total())} BTC</div><button class="button primary full" data-action="checkout">Proceed to checkout ${icon('arrow')}</button><p class="small muted">Payment services are not connected. Checkout records activity in your device ledger; no cryptocurrency is transferred.</p></aside></div>`:empty('cart','A little empty. A lot of potential.','Find something for your next project.','Explore the market','#/market')}`; }
function empty(i,h,p,cta,href) {return `<section class="empty-state panel">${icon(i)}<h2>${h}</h2><p>${p}</p><a class="button primary" href="${href}">${cta} ${icon('arrow')}</a></section>`;}
function ordersPage() { return ordersView(); }
function walletPage() { return walletView(); }
function supportPage() { return `${pageHead('DIRECT LINE / MARKET OPERATIONS','Support center.','Read the essentials. Contact the market.')}<div class="support-grid"><section class="panel"><h2>Before you proceed.</h2>${[['Why is the catalog blurred?','Product names, images, prices, descriptions, and categories are visible after sign-in. Our home page, manifesto, and support center are public.'],['Where are my downloads?','Open My orders and view an order to download an order receipt. If you purchased software or an item it will be accessed via link on your receipt.'],['Is my wallet connected to crypto?','Yes. Your wallet is connected so that you can recieve payments from other customers or vendors. Your Tornet Market wallet shows the funds that you have collected which can then be deposited to your connected wallet address.'],['How do I get access?','Sign in with your existing account. If you do not have one, contact the market to register.'],['What does member access unlock?','Having a member login allows you to earn trust in the market. You also gain access to a wallet, order history, and other featuress as you progress your trust level.'],['How do I install the app?','On iPhone, use Safari. Open the marketplace then click Share → Add to Home Screen. For pc on supported desktop browsers, use the browser install icon.']].map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section><section class="panel"><div class="eyebrow">DROP A SIGNAL</div><h2>Contact the market</h2><form id="support-form"><label>Subject<select name="subject"><option>Order Support</option><option>General Question/Inquiry</option><option>Website bug</option></select></label><label>Your message<textarea name="message" required minlength="5" maxlength="2000" rows="5" aria-describedby="feedback-notice" placeholder=" "></textarea></label><button class="button primary" type="submit">Send message ${icon('arrow')}</button><p class="small muted" id="feedback-notice">Send a message to a Admin. Staff can then send your message to the Owner of Tornet Market.</p><p class="small" data-feedback-status role="status" aria-live="polite"></p></form><button class="text-button" data-action="install">Install Tornet app ↗</button></section></div>`; }
function loginPage() { return `<div class="login-page"><div class="login-top">${brand()}<a href="#/market">Back to marketplace ↗</a></div><div class="login-layout"><section class="login-intro"><div class="eyebrow"><i class="dot"></i> THE ORIGINAL SILKROAD MARKTPLACE</div><h1>You know<br>where to<br><span>find us.</span></h1><p>"The higher the tower, the greater the fall thereof.” - Horace</p><div class="login-art" aria-hidden="true">${icon('shield')}</div><small>Tech Solutions and Marketplace for Hackers ©</small></section><section class="login-panel panel"><span class="login-lock">${icon('user')}</span><div class="eyebrow">MEMBER TERMINAL / 01</div><h2>Access your account</h2><p class="muted">Enter your credentials to access Tornet Market.</p><form id="login-form"><label>Username<input name="username" autocomplete="username" required placeholder="Your username" autocapitalize="none" spellcheck="false"></label><label>Password<div class="password-field"><input name="password" type="password" autocomplete="current-password" required placeholder="Your password"><button type="button" data-action="show-password" aria-label="Show password">Show</button></div></label><div id="login-error" role="alert"></div><button type="submit" class="button primary full">Enter the market ${icon('arrow')}</button></form><div class="login-note">${icon('shield')} Members-only Marketplace · Sign in to continue</div><p class="small muted">The more trust you earn, the more you access.</p></section></div><div class="login-footer"><span>© ${new Date().getFullYear()} Tornet Market</span><span><i class="dot"></i> HACK THE WORLD</span></div></div>`; }
function notFound(){return empty('search','Off the grid.','This page or product could not be found.','Back to market','#/market');}
function render() {
 walletAddressRevealed=false;
 const parts=(location.hash||'#/home').slice(2).split('/'); let page=parts[0]||'home';
 if(['orders','wallet'].includes(page)&&!authenticated){returnTo=location.hash;go('#/login');return;}
 if($('#modal').open)$('#modal').close();
 $('#app').innerHTML=page==='login'?loginPage():shell(!authenticated&&['market','product','cart'].includes(page)?lockedMarket(page):({home,manifesto,market,autoshop:autoshopPage,cart:cartPage,orders:ordersPage,wallet:walletPage,support:supportPage}[page]||(()=>page==='product'?productPage(parts[1]):notFound()))(),page);
 document.title=`${({home:'Home',market:'Marketplace',autoshop:'Autoshop',cart:'Your cart',orders:'My orders',wallet:'My wallet',support:'Support',manifesto:'The Tornet Manifesto',login:'Sign in',product:authenticated?product(parts[1])?.name:'Members-only listing'}[page]||'Page not found')} / Tornet Market`;
 if($('#sort'))$('#sort').value=sort; observeLockedMotion();
 document.querySelectorAll('.brand > img').forEach(img=>{img.onerror=()=>img.parentElement.classList.add('logo-failed');});
 document.querySelectorAll('.custom-art img').forEach(img=>{img.onerror=()=>{img.parentElement.innerHTML='<span class="image-missing">Image placeholder</span>';};});
}
function openModal(title,body) { const el=$('#modal');el.innerHTML=`<div class="modal-head"><div><div class="eyebrow">TORNET MARKET</div><h2 id="modal-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Close dialog">${icon('close')}</button></div>${body}`; if(!el.open)el.showModal(); }
function requireLogin(target) {if(authenticated)return true;returnTo=target||location.hash;go('#/login');toast('Sign in to open your workspace.');return false;}
function checkout(){if(!requireLogin('#/cart')||!cartCount())return;openModal('One step from your next build.',`<p class="muted">Review your order. This order uses your device ledger balance.</p><div class="checkout-review">${Object.entries(state.cart).map(([id,q])=>`<div class="summary-line"><span>${esc(product(id).name)} × ${q}</span><b>${money(product(id).price*q)}</b></div>`).join('')}<div class="summary-total"><span>Total</span><strong>${money(total())}</strong></div><div class="summary-line"><span>Available balance</span><span>${money(state.balance)}</span></div></div>${state.balance<total()?'<p class="error-text">Insufficient balance. Add funds in your wallet first.</p><a class="button primary full" href="#/wallet">Open wallet</a>':`<button class="button primary full" data-action="place-order">Place order ${icon('arrow')}</button>`}<p class="small muted">Payment accepted. Product purchased.</p>`);}
function placeOrder(){if(!authenticated||!cartCount())return;if(total()>state.balance){checkout();return;}const amount=Math.round(total()*100)/100;const order={id:'TM-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString(),total:amount,items:Object.entries(state.cart).map(([id,q])=>({id,name:product(id).name,price:product(id).price,quantity:q}))};state.balance=Math.round((state.balance-amount)*100)/100;state.orders.unshift(order);state.transactions.unshift({label:'Order '+order.id,amount:-amount,type:'purchase',date:order.date});state.cart={};persist();render();openModal('You’re all set.',`<div class="success-icon">${icon('check')}</div><p>Your order <b>${order.id}</b> has been placed. ${orderStatusBadge(order)}</p><div class="summary-total"><span>Recorded against wallet balance</span><strong>${money(amount)}</strong></div><a class="button primary full" href="#/orders">View my orders ${icon('arrow')}</a>`);}
function receipt(id){if(!requireLogin('#/orders'))return;const o=state.orders.find(o=>o.id===id);if(!o)return;const text=`TORNET MARKET — ORDER RECEIPT\n${o.id}\n${o.date}\n\n${o.items.map(p=>`${p.name} x ${p.quantity}: ${money(p.price*p.quantity)}`).join('\n')}\n\nStatus: ${orderStatus(o)}\nTotal: ${money(o.total)}\n\nDevice ledger receipt. No payment network or software fulfillment is connected.`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=o.id+'-receipt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function updateCatalog(){if(!authenticated||!$('#products'))return; $('#products').innerHTML=catalogResults();$('#result-count').textContent=filteredProducts().length; }
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;updateCatalog();}});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sort=e.target.value;updateCatalog();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a[data-action]');if(!b)return;
 if(b.dataset.add){if(!requireLogin(location.hash||'#/market'))return;const id=b.dataset.add;if(!product(id))return;state.cart[id]=Math.min(99,(state.cart[id]||0)+1);persist();if($('#cart-count'))$('#cart-count').textContent=cartCount();toast(`${product(id).name} added to cart.`);return;}
 if(b.dataset.save){if(!requireLogin(location.hash||'#/market'))return;const id=b.dataset.save;state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;}
 if(b.dataset.category){if(authenticated){category=b.dataset.category;savedOnly=false;}categoryScrollPending=true;closeMobileNavigation();go('#/market');return;}
 if(b.dataset.qty){if(!requireLogin('#/cart'))return;const id=b.dataset.qty;state.cart[id]=Math.min(99,state.cart[id]+Number(b.dataset.delta));if(state.cart[id]<=0)delete state.cart[id];persist();render();return;}
 if(b.dataset.remove){if(!requireLogin('#/cart'))return;delete state.cart[b.dataset.remove];persist();render();return;}
 if(b.dataset.order){if(!requireLogin('#/orders'))return;const o=state.orders.find(o=>o.id===b.dataset.order);if(o)openModal(esc(o.id),`${orderStatusBadge(o)}<p class="muted">${new Date(o.date).toLocaleString()}</p>${o.items.map(p=>`<div class="summary-line"><span>${esc(p.name)} × ${p.quantity}</span><b>${money(p.price*p.quantity)}</b></div>`).join('')}<div class="summary-total"><span>Order total</span><strong>${money(o.total)}</strong></div><button class="button primary full" data-receipt="${esc(o.id)}">${icon('download')} Download receipt</button>`);return;}
 if(b.dataset.receipt){receipt(b.dataset.receipt);return;}
 const action=b.dataset.action;if(!action)return;
 const actions={
 'toggle-address':()=>{if(!authenticated)return;walletAddressRevealed=!walletAddressRevealed;$('#wallet-address-panel').innerHTML=walletAddressControls();$('#wallet-address-panel [data-action="toggle-address"]').focus();},
 'copy-address':()=>copyWalletAddress(),
 close:()=>$('#modal').close(),menu:()=>{const on=$('#sidebar').classList.toggle('open');b.setAttribute('aria-expanded',on);if(on)positionMobileNavigation();},
 'locked-catalog':()=>{categoryScrollPending=true;closeMobileNavigation();go('#/market');},
 login:()=>{returnTo=location.hash||'#/home';go('#/login');},logout:()=>{authenticated=false;try{sessionStorage.removeItem('tornet-session');}catch{}go('#/login');toast('You have signed out.');},
 account:()=>isProfileOwner()?showProfile():go('#/login'),
 'edit-profile':()=>editProfile(),
 saved:()=>{if(!requireLogin('#/market'))return;savedOnly=!savedOnly;category='All products';go('#/market');},
 'clear-filters':()=>{search='';category='All products';savedOnly=false;sort='featured';render();},
 browse:()=>{e.preventDefault();$('#catalog').scrollIntoView({behavior:'smooth'});},
 checkout, 'place-order':placeOrder,
 about:()=>go('#/manifesto'),
 announcements:()=>openModal('A new chapter.',`<div class="eyebrow">TORNET DISPATCH / 001</div><p>A market for people who make things happen.</p><p class="muted">We are building Tornet around independent software, original code, and the people behind it. The catalog is reserved for signed-in members. Our story, manifesto, and support center are open to everyone.</p><a class="button primary full" href="#/manifesto">Read the manifesto ${icon('arrow')}</a>`),
 terms:()=>openModal('Market principles.',`<p>Make useful things. Describe them honestly. Respect the people who build and use them.</p><p class="muted">Publish only work you own or are authorized to distribute. Keep security research within authorized environments. Respect privacy, licenses, and other members. Trust is earned through transparent work and accountable conduct.</p><a class="button full" href="#/support">Visit the support center ${icon('arrow')}</a>`),
 deposit:()=>openModal('Fuel your next project.',`<form id="funds-form"><label>Amount (USD)<input name="amount" type="number" min="1" max="100000" step="0.01" value="250" required></label><button class="button primary full" type="submit">Add funds ${icon('plus')}</button><p class="small muted">Simulation only. No payment or wallet signature required.</p></form>`),
 earning:()=>openModal('Record a sale.',`<form id="earning-form"><label>Sale amount (USD)<input name="amount" type="number" min="1" max="100000" step="0.01" value="79" required></label><button class="button primary full" type="submit">Record earning ${icon('plus')}</button><p class="small muted">Adds fictional revenue to your owner wallet and earnings history.</p></form>`),
 'wallet-link':()=>openModal('Wallet settings.',`<form id="wallet-form"><label>Wallet label<input name="label" maxlength="50" placeholder="e.g. My cold wallet" value="${esc(state.walletLabel)}" required></label><p class="small muted">A local display label. This does not connect to a real wallet. Do not enter a recovery phrase or private key.</p><button class="button primary full" type="submit">Save wallet ${icon('check')}</button>${state.walletLabel?'<button class="text-button" type="button" data-action="unlink">Remove wallet label</button>':''}</form>`),
 unlink:()=>{state.walletLabel='';persist();render();toast('Wallet label removed.');},
 'show-password':()=>{const input=$('input[name="password"]');input.type=input.type==='password'?'text':'password';b.textContent=input.type==='password'?'Show':'Hide';b.setAttribute('aria-label',b.textContent+' password');},
 install:async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else openModal('Take Tornet with you.',`<p>On iPhone: open this site in Safari, tap Share, then <b>Add to Home Screen</b>.</p><p class="muted">On desktop or Android, use the browser's install option when available. Installation requires serving the site on localhost or HTTPS.</p>`);}
 };if(actions[action])actions[action]();
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!['login-form','funds-form','earning-form','wallet-form','support-form'].includes(form.id))return;e.preventDefault();const data=new FormData(form);
 if(form.id==='login-form'){
  const button=$('button[type="submit"]',form);button.disabled=true;button.textContent='Authenticating…';
  try { if(!crypto.subtle)throw new Error('Open this site on localhost or HTTPS to sign in.');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(data.get('password')),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode('tornet-owner-v1'),iterations:120000,hash:'SHA-256'},key,256);const hash=Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,'0')).join('');if(data.get('username')!=='swiping.cc'||hash!=='73d7712e82c35a26540dfd7de0f2acd1bd6d9e51c84e706ab5f3b3b727f09336')throw new Error('Username or password is incorrect.');authenticated=true;try{sessionStorage.setItem('tornet-session','owner');}catch{}go(returnTo==='#/login'?'#/home':returnTo);toast('Welcome back, swiping.cc. Owner access unlocked.');}
  catch(error){$('#login-error').textContent=error.message;button.disabled=false;button.innerHTML=`Enter the market ${icon('arrow')}`;}return;
 }
 if(form.id==='support-form'){await sendPropFeedback(form);return;}
 if(!authenticated){go('#/login');return;}
 if(form.id==='wallet-form'){const label=String(data.get('label')).trim();if(!label)return;state.walletLabel=label;persist();render();toast('Wallet settings saved.');return;}
 const amount=Number(data.get('amount'));if(!Number.isFinite(amount)||amount<1||amount>100000)return;const isEarning=form.id==='earning-form';state.balance=Math.round((state.balance+amount)*100)/100;state.transactions.unshift({label:isEarning?'Product sale':'Wallet credit',amount:Math.round(amount*100)/100,type:isEarning?'earning':'deposit',date:new Date().toISOString()});persist();render();toast(isEarning?'Earning recorded.':'Balance updated.');
});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#modal').open&&$('#search')){e.preventDefault();$('#search').focus();}});
window.addEventListener('hashchange',()=>{render();$('#main')?.focus({preventScroll:true});if(!scrollToCategoryResults())window.scrollTo(0,0);});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
if('serviceWorker' in navigator && ['http:','https:'].includes(location.protocol)) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();

// Close the phone navigation when revisiting its current page or tapping outside it.
function closeMobileNavigation() {
 const sidebar = $('#sidebar');
 if (sidebar) sidebar.classList.remove('open');
 document.querySelector('[data-action="menu"]')?.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', event => {
 const sidebar = $('#sidebar');
 if (!sidebar?.classList.contains('open')) return;
 if (event.target.closest('#sidebar a') || (!sidebar.contains(event.target) && !event.target.closest('[data-action="menu"]'))) closeMobileNavigation();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileNavigation(); });

// Guest previews contain only synthetic shapes, never real listing content.
// This is a presentation gate. Production catalog authorization must live on a server.
function categoryNavigation(page) {
 if (!authenticated) return Array.from({length:catalogCategories().length},(_,i)=>`<button class="category-link locked-category" data-action="locked-catalog" aria-label="Members-only category. Sign in to view."><span class="category-obscured" aria-hidden="true"><span class="skeleton category-line" style="width:${65+i%3*13}px"></span><span class="skeleton category-count"></span></span>${icon('shield')}</button>`).join('');
 return catalogCategories().map((c,i)=>`<button class="category-link ${category===c&&page==='market'?'selected':''}" data-category="${esc(c)}"><span>${icon(['grid','code','box','shield','bolt'][i])}${esc(c)}</span><small>${c==='All products'?MARKET.products.length:MARKET.products.filter(p=>p.category===c).length}</small></button>`).join('');
}
function lockedMarket(page) {
 const single = page === 'product';
 return `<div class="page-kicker"><span>THE ORIGINAL SILKROAD MARKETPLACE</span><span>MEMBER ACCESS REQUIRED</span></div><section class="member-gate panel"><div class="gate-symbol">${icon('shield')}</div><div><div class="eyebrow">Some things aren’t meant to be seen  </div><h1>Access is<br><span>meritorious.</span></h1><p>Categories, listings, images, prices, and descriptions are reserved for members. Sign in to see what's inside.</p><div class="gate-actions"><button class="button primary" data-action="login">Sign in to unlock ${icon('arrow')}</button><a class="text-button" href="#/manifesto">Read our manifesto ↗</a></div><p class="gate-access-note">Already have an account? You're one step away.</p></div></section><section class="locked-catalog ${single?'locked-detail':''}" aria-label="Locked catalog preview"><div class="locked-preview-grid">${Array.from({length:single?1:6},(_,i)=>`<button class="locked-product" data-action="login" aria-label="Sign in to reveal this listing"><span class="locked-product-shapes" aria-hidden="true"><span class="locked-art" style="--locked-hue:${90+i*44}"><span></span></span><span class="locked-copy"><span class="skeleton locked-meta"></span><span class="skeleton locked-name"></span><span class="skeleton locked-description"></span><span class="skeleton locked-description short"></span><span class="locked-price-row"><span class="skeleton locked-price"></span><span class="skeleton locked-buy"></span></span></span></span><span class="locked-card-label">${icon('shield')} MEMBERS ONLY</span></button>`).join('')}</div></section><div class="public-access-note">The story stays open. <a href="#/home">About Tornet</a><span>/</span><a href="#/support">Help & support</a></div>`;
}
function manifesto() {
 const chapters = [
  ['01','2011 / Before Tornet.','The Silk Road emerged in 2011, bringing an underground marketplace into the wider conversation about the internet, anonymity, and digital money. Its trade in illegal goods also put it in the sights of law enforcement. That history belongs to Silk Road; it provides the backdrop to this story, not a claim that Tornet operated it.'],
  ['02','2013 / An abrupt ending.','In October 2013, law enforcement shut Silk Road down. Its founder, Ross Ulbricht, was arrested in San Francisco on October 1. A marketplace that had attracted worldwide attention was suddenly a seized website and a criminal case. The shutdown became part of internet history. Some of the top vendors/developers of Silk Road went into hiding.'],
  ['03','2019 / The Tornet chapter.','In our brand story, 2019 marks the return under a new name: Tornet Marketplace. The setting is the Bay Area, with roots in the heart of San Francisco and a later move to Silicon Valley. The focus is to re-build what was lost. Tornet aims on providing tech solutions and creating a marketplace for hackers.'],
  ['04','2024 / Off the grid.','Around 2024, the site gets seized by FBI and Tornet goes offline. The familiar pages fall quiet. After everything thas was worked on, a place where people can buy, sell, trade anonymously. That pause leaves room to rethink the market from the ground up.'],
  ['05','2026 / Tornet Market, version 2.','The next chapter is Tornet Market v2, launching in 2026 under UnknownBlackHat. A return with the same Bay Area identity and a renewed focus on the work: creating a platform for hackers where they can buy, sell, and trade anonymously.'],
  ['06','What belongs here.','Developers. Coders. Makers. Security researchers working with permission. People with something original to share and the curiosity to take it further. Our standard is straightforward: respect ownership, describe the work honestly, and earn your reputation through what you build.']
 ];
 return `<section class="manifesto-hero panel"><div class="eyebrow">THE TORNET STORY / VERSION 2 / LAUNCHING 2026</div><h1>Started from the bay,<br><span>Now we here!</span></h1><p class="manifesto-intro">San Francisco roots. A Silicon Valley chapter. A return in 2026.</p><div class="manifesto-signature">DEVELOPED BY UNKNOWNBLACKHAT <span>// SAN FRANCISCO → SILICON VALLEY</span></div></section><section class="manifesto-body panel"><p class="manifesto-opening">Every market has an origin.<br>Ours starts in San Francisco.</p><p>The Bay Area is the setting for Tornet’s brand lore: a city of restless ideas, a move to Silicon Valley, a marketplace that goes quiet, and a second version taking shape. The thread through it is the people who keep building after a project ends.</p><p>The timeline begins with the documented history of the infamous Silkroad Marketplace, then follows Tornet’s own story: a 2019 return as Tornet Marketplace, an offline chapter around 2024, and the launch of Tornet Market v2 in 2026.</p><div class="manifesto-principles">${chapters.map(([n,t,p])=>`<article><span>${n}</span><div><h2>${t}</h2><p>${p}</p></div></article>`).join('')}</div><p class="manifesto-history-source">Historical context: <a href="https://www.justice.gov/archive/usao/nys/pressreleases/February14/RossUlbrichtIndictmentPR.php?print=1" target="_blank" rel="noopener noreferrer">U.S. Department of Justice — Silk Road’s 2011–2013 timeline</a>.</p><div class="manifesto-closing"><span class="eyebrow">TORNET MARKET V2 / LAUNCHING 2026</span><h2>The story continues.<br><span>The work starts here.</span></h2><p>San Francisco → Silicon Valley. Developed by UnknownBlackHat.</p><div class="gate-actions"><a href="#/market" class="button primary">${authenticated?'Explore the market':'Step inside'} ${icon('arrow')}</a><a href="#/support" class="button">Contact the market</a></div></div></section>`;
}

// Animate only visible locked previews; no continuous JavaScript animation loop.
function observeLockedMotion() {
 observeLockedMotion.observer?.disconnect();
 const cards = document.querySelectorAll('.locked-product,.locked-category');
 if (!('IntersectionObserver' in window)) { cards.forEach(card=>card.classList.add('motion-visible')); return; }
 observeLockedMotion.observer = new IntersectionObserver(entries => {
  entries.forEach(entry=>entry.target.classList.toggle('motion-visible',entry.isIntersecting));
 }, {threshold:0.05});
 cards.forEach(card=>observeLockedMotion.observer.observe(card));
}
const lockedMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const lockedFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
let lockedTiltFrame = 0;
function resetLockedTilt(card) {
 if (!card) return;
 ['--tilt-x','--tilt-y','--light-x','--light-y'].forEach(name=>card.style.removeProperty(name));
}
document.addEventListener('pointermove',event=>{
 if (lockedMotionPreference.matches || !lockedFinePointer.matches || event.pointerType==='touch') return;
 const card=event.target.closest('.locked-product');
 if (!card) return;
 cancelAnimationFrame(lockedTiltFrame);
 const {clientX,clientY}=event;
 lockedTiltFrame=requestAnimationFrame(()=>{
  if (!card.isConnected || lockedMotionPreference.matches) return;
  const rect=card.getBoundingClientRect();
  const x=Math.min(1,Math.max(0,(clientX-rect.left)/rect.width));
  const y=Math.min(1,Math.max(0,(clientY-rect.top)/rect.height));
  card.style.setProperty('--tilt-x',`${(0.5-y)*7}deg`);
  card.style.setProperty('--tilt-y',`${(x-0.5)*9}deg`);
  card.style.setProperty('--light-x',`${x*100}%`);
  card.style.setProperty('--light-y',`${y*100}%`);
 });
});
document.addEventListener('pointerout',event=>{
 const card=event.target.closest('.locked-product');
 if(card && !card.contains(event.relatedTarget)) {cancelAnimationFrame(lockedTiltFrame);resetLockedTilt(card);}
});
lockedMotionPreference.addEventListener('change',()=>{
 cancelAnimationFrame(lockedTiltFrame);
 document.querySelectorAll('.locked-product').forEach(resetLockedTilt);
});
document.addEventListener('visibilitychange',()=>{
 document.documentElement.classList.toggle('page-idle',document.hidden);
 if(document.hidden) cancelAnimationFrame(lockedTiltFrame);
});


function catalogCategories() {
 return ['All products', ...new Set([...(MARKET.categories || []), ...MARKET.products.map(item=>item.category)]
  .filter(name=>typeof name==='string' && name.trim() && name!=='All products'))];
}
function positionMobileNavigation() {
 const sidebar=$('#sidebar'), header=$('.header');
 if (!sidebar?.classList.contains('open') || !header) return;
 const top=Math.max(8,header.getBoundingClientRect().bottom+8);
 sidebar.style.setProperty('--mobile-menu-top', `${top}px`);
 const bottom=(window.visualViewport?.height||innerHeight)+(window.visualViewport?.offsetTop||0);
 sidebar.style.setProperty('--mobile-menu-space', `${Math.max(0,bottom-top)}px`);
}
window.addEventListener('resize',positionMobileNavigation);
window.visualViewport?.addEventListener('resize',positionMobileNavigation);

function isProfileOwner() { return authenticated; } // The only authenticated identity is swiping.cc.
function profileAvatar(large=false) {
 const avatar=state.profile.avatar;
 return typeof avatar==='string' && /^data:image\/(png|jpeg|webp);base64,/.test(avatar)
  ? `<img class="profile-photo ${large?'large':''}" src="${esc(avatar)}" alt="Profile photo">`
  : `<span class="profile-initial">${esc((state.profile.displayName||'S').slice(0,1).toUpperCase())}</span>`;
}
function earningsTotal() { return Math.round((Number(state.profile.earningsOffset||0)+state.transactions.filter(t=>t.type==='earning').reduce((sum,t)=>sum+t.amount,0))*100)/100; }
function spendingTotal() { return Math.round((Number(state.profile.spendingOffset||0)+state.orders.reduce((sum,o)=>sum+o.total,0))*100)/100; }
function showProfile() {
 if(!isProfileOwner())return;
 openModal('Your profile',`<div class="account-card"><div class="profile-avatar-large">${profileAvatar(true)}</div><h3>${esc(state.profile.displayName)}</h3><p class="profile-handle">@swiping.cc · Market owner</p><span class="status-pill">TRUST LEVEL MAX / 100</span><p>${esc(state.profile.bio)}</p><div class="profile-mini-stats"><span>Balance<strong>${money(state.balance)}</strong></span><span>Earnings<strong>${money(earningsTotal())}</strong></span></div><button class="button full profile-saved" data-action="saved">${icon('heart')} Saved items <span>${state.saved.length}</span></button><button class="button primary full" data-action="edit-profile">${icon('user')} Edit profile</button><button class="button full profile-signout" data-action="logout">Sign out ${icon('logout')}</button></div>`);
}
function walletView() {
 const transactions=state.transactions;
 return `${pageHead('YOUR PERSONAL VAULT','My wallet.','Your balance. Your activity. You Future.')}<section class="wallet-hero"><div><div class="eyebrow">AVAILABLE BALANCE <span class="badge">BTC</span></div><h2>${btc(state.balance)} <span>BTC</span></h2><p>≈ ${money(state.balance)} USD <span>· Reference conversion</span></p><div class="wallet-address" id="wallet-address-panel">${walletAddressControls()}</div><div class="hero-actions"><button class="button primary" data-action="deposit">${icon('plus')} Add funds</button><button class="button" data-action="edit-profile">${icon('user')} Edit account</button><button class="text-button" data-action="wallet-link">Wallet settings</button></div></div><div class="wallet-insignia">₿</div></section><div class="stat-grid"><div class="panel"><span>${icon('arrow')} Earnings</span><strong class="green">${money(earningsTotal())}</strong><small>Owner ledger</small></div><div class="panel"><span>${icon('cart')} Spending</span><strong>${money(spendingTotal())}</strong><small>${state.orders.length} orders in your archive</small></div><div class="panel"><span>${icon('shield')} Account</span><strong>${esc(state.profile.displayName)}</strong><small>${esc(state.walletLabel||'Personal wallet')}</small></div></div><section class="panel"><div class="section-heading"><h2>Transaction history</h2><button class="text-button" data-action="earning">Record a sale +</button></div>${transactions.length?transactions.map(t=>`<div class="transaction-row"><div class="transaction-icon">${icon(t.amount>=0?'plus':'cart')}</div><div><strong>${esc(t.label)}</strong><small>${new Date(t.date).toLocaleString()}</small></div><span class="status-pill">Recorded</span><strong class="${t.amount>=0?'green':''}">${t.amount>=0?'+':'−'}${money(Math.abs(t.amount))}<small>${btc(Math.abs(t.amount))} BTC</small></strong></div>`).join(''):'<div class="quiet-empty">Your ledger is clear. Add an entry from Edit profile to get started.</div>'}</section><p class="small muted wallet-disclosure">Device ledger · Manually managed figures, not verified funds. This address cannot receive crypto. No wallet or payment network is connected.</p>`;
}
let profileDraft=null;
function historyEditorRow(t={label:'',amount:0,type:'deposit',date:new Date().toISOString()}) {
 const date=new Date(t.date);const localDate=Number.isNaN(date.valueOf())?'':new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const type=t.type==='earning'?'earning':t.amount<0?'purchase':'deposit';
 return `<div class="history-edit-row"><label>Description<input data-field="label" value="${esc(t.label)}" maxlength="120" required placeholder="Payment or sale description"></label><div class="history-edit-fields"><label>Type<select data-field="type"><option value="deposit" ${type==='deposit'?'selected':''}>Credit</option><option value="earning" ${type==='earning'?'selected':''}>Earning</option><option value="purchase" ${type==='purchase'?'selected':''}>Spending</option></select></label><label>Amount (USD)<input data-field="amount" type="number" min="0.01" max="1000000000" step="0.01" value="${Math.abs(t.amount)||''}" required></label><label>Date & time<input data-field="date" type="datetime-local" value="${localDate}" required></label></div><button type="button" class="text-button" data-profile-action="remove-entry">Remove entry</button></div>`;
}
function editProfile() {
 if(!isProfileOwner()){go('#/login');return;}
 profileDraft={avatar:state.profile.avatar,uploading:false,token:0};
 openModal('Edit your profile',`<form id="profile-form"><div class="profile-photo-editor"><div class="profile-avatar-large" id="profile-preview">${profileAvatar(true)}</div><div><label class="button photo-upload">Upload photo<input type="file" id="profile-file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Upload profile photo"></label><button type="button" class="text-button" data-profile-action="remove-photo">Remove photo</button><p class="small muted">JPG, PNG, WebP or GIF · up to 5 MB</p></div></div><p id="photo-error" class="error-text" role="alert"></p><div class="profile-fields"><label>Display name<input name="displayName" value="${esc(state.profile.displayName)}" maxlength="40" required></label><label>Account username<input value="swiping.cc" readonly aria-label="Account username (cannot be changed)"></label></div><label>About you<textarea name="bio" rows="2" maxlength="240">${esc(state.profile.bio)}</textarea></label><label>Wallet name<input name="walletLabel" value="${esc(state.walletLabel)}" placeholder="Personal wallet" maxlength="50"></label><div class="editor-section-title"><h3>Your wallet</h3><span>USD</span></div><div class="profile-totals"><label>Balance<input name="balance" type="number" min="0" max="1000000000" step="0.01" value="${state.balance.toFixed(2)}" required></label><label>Total earnings<input name="earnings" type="number" min="0" max="1000000000" step="0.01" value="${earningsTotal().toFixed(2)}" required></label><label>Total spending<input name="spending" type="number" min="0" max="1000000000" step="0.01" value="${spendingTotal().toFixed(2)}" required></label></div><div class="editor-section-title"><h3>Transaction history</h3><button type="button" class="text-button" data-profile-action="add-entry">${icon('plus')} Add entry</button></div><p class="small muted">Set totals independently from the entries below. History edits do not change existing orders. Future purchases and sales update your totals normally.</p><div id="history-editor">${state.transactions.map(historyEditorRow).join('')}</div><p class="small muted">Saved only in this browser on this device. These are editable records, not verified funds.</p><p id="profile-error" class="error-text" role="alert"></p><div class="profile-form-actions"><button type="button" class="button" data-action="close">Cancel</button><button class="button primary" type="submit">Save changes ${icon('check')}</button></div></form>`);
 $('#modal').classList.add('profile-editor-modal');
}
$('#modal').addEventListener('close',()=>{$('#modal').classList.remove('profile-editor-modal');profileDraft=null;});
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-profile-action]');if(!button||!isProfileOwner()||!profileDraft)return;
 const action=button.dataset.profileAction;
 if(action==='add-entry') {if($('#history-editor').children.length>=200){$('#profile-error').textContent='Keep your ledger to 200 entries for this editor.';return;}$('#history-editor').insertAdjacentHTML('beforeend',historyEditorRow());$('#history-editor').lastElementChild.querySelector('input').focus();}
 if(action==='remove-entry')button.closest('.history-edit-row').remove();
 if(action==='remove-photo'){profileDraft.token++;profileDraft.avatar='';profileDraft.uploading=false;$('#profile-preview').textContent='S';$('#profile-file').value='';$('#photo-error').textContent='';}
});
document.addEventListener('change',async event=>{
 if(event.target.id!=='profile-file'||!isProfileOwner()||!profileDraft)return;
 const file=event.target.files[0];if(!file)return;
 const draft=profileDraft,token=++draft.token;draft.uploading=true;$('#photo-error').textContent='';
 try {
  if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a JPG, PNG, WebP, or GIF image.');
  if(file.size>5*1024*1024)throw Error('Choose an image smaller than 5 MB.');
  const url=URL.createObjectURL(file),img=new Image();
  try {await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('This image could not be opened. Choose another file.'));img.src=url;});
   if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>40000000)throw Error('Choose an image smaller than 40 megapixels.');
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');const side=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,256,256);const avatar=canvas.toDataURL('image/webp',.85);
   if(profileDraft!==draft||draft.token!==token)return;draft.avatar=avatar;$('#profile-preview').innerHTML=`<img class="profile-photo large" src="${avatar}" alt="New profile photo preview">`;
  } finally {URL.revokeObjectURL(url);}
 } catch(error){if(profileDraft===draft&&draft.token===token){$('#photo-error').textContent=error.message;event.target.value='';}}
 finally {if(profileDraft===draft&&draft.token===token)draft.uploading=false;}
});
document.addEventListener('submit',event=>{
 if(event.target.id!=='profile-form')return;event.preventDefault();
 if(!isProfileOwner()||!profileDraft)return;
 const error=$('#profile-error');error.textContent='';
 if(profileDraft.uploading){error.textContent='Wait for your photo to finish loading.';return;}
 try {
  const data=new FormData(event.target),displayName=String(data.get('displayName')).trim();if(!displayName)throw Error('Enter a display name.');
  const readMoney=name=>{const n=Number(data.get(name));if(!Number.isFinite(n)||n<0||n>1000000000)throw Error('Enter amounts between 0 and 1,000,000,000.');return Math.round(n*100)/100;};
  const balance=readMoney('balance'),earnings=readMoney('earnings'),spending=readMoney('spending');
  const transactions=Array.from(document.querySelectorAll('.history-edit-row'),row=>{
   const field=n=>row.querySelector(`[data-field="${n}"]`).value;const label=field('label').trim(),amount=Number(field('amount')),date=new Date(field('date')),type=field('type');
   if(!label||!Number.isFinite(amount)||amount<=0||amount>1000000000||Number.isNaN(date.valueOf())||!['deposit','earning','purchase'].includes(type))throw Error('Complete every transaction with a description, amount, and date.');
   return {label,amount:Math.round(amount*100)/100*(type==='purchase'?-1:1),type,date:date.toISOString()};
  }).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const candidate={...state,balance,transactions,walletLabel:String(data.get('walletLabel')).trim(),profile:{...state.profile,displayName,bio:String(data.get('bio')).trim(),avatar:profileDraft.avatar,earningsOffset:earnings-transactions.filter(t=>t.type==='earning').reduce((sum,t)=>sum+t.amount,0),spendingOffset:spending-state.orders.reduce((sum,o)=>sum+o.total,0)}};
  try{localStorage.setItem('tornet-v2',JSON.stringify(candidate));}catch{throw Error('Your browser could not save these changes. Free some site storage or try a smaller photo.');}
  state=candidate;$('#modal').close();render();toast('Profile saved on this device.');
 }catch(problem){error.textContent=problem.message;}
});

function walletAddressControls() {
 const address=String(state.profile.address);
 const masked=`${esc(address.slice(0,6))}<span class="address-blur" aria-hidden="true">•••• •••• ••••</span>${esc(address.slice(-4))}`;
 return `<span>WALLET ADDRESS</span><div class="wallet-address-row"><button class="wallet-address-copy ${walletAddressRevealed?'revealed':'masked'}" data-action="copy-address" ${walletAddressRevealed?'':'disabled'} aria-label="${walletAddressRevealed?'Copy wallet address to clipboard':'Wallet address hidden, ending in '+esc(address.slice(-4))}"><code>${walletAddressRevealed?esc(address):masked}</code>${walletAddressRevealed?icon('copy'):''}</button><button class="icon-button address-eye" data-action="toggle-address" aria-label="${walletAddressRevealed?'Hide':'Reveal'} wallet address" aria-pressed="${walletAddressRevealed}">${icon(walletAddressRevealed?'eye-off':'eye')}</button></div><small>${walletAddressRevealed?'Click the address to copy to clipboard.':'Address hidden. Use the eye to reveal.'}</small>`;
}
async function copyWalletAddress() {
 if(!authenticated||!walletAddressRevealed)return;
 const address=String(state.profile.address);
 try {
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(address);
  else {
   const active=document.activeElement,field=document.createElement('textarea');field.value=address;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);field.select();let copied=false;
   try{copied=document.execCommand('copy');}finally{field.remove();active?.focus();}
   if(!copied)throw Error('Copy unavailable');
  }
  toast('Wallet address copied to clipboard.');
 }catch{toast('Clipboard access was blocked. Select the revealed address to copy it manually.');}
}
// Timestamps persist in the device ledger. These stages describe the interface workflow,
// not an external payment confirmation or real fulfillment event.
function orderStatus(order,now=Date.now()) {
 const created=new Date(order.date).getTime();
 if(!Number.isFinite(created))return 'Idle';
 const age=Math.max(0,now-created);
 return age<8000?'Pending':age<20000?'Idle':'Completed';
}
function overallOrderStatus() {
 const statuses=state.orders.map(o=>orderStatus(o));
 return statuses.includes('Pending')?'Pending':statuses.includes('Idle')?'Idle':statuses.length?'Completed':'Idle';
}
function orderStatusBadge(order) {const status=orderStatus(order);return `<span class="status-pill order-status status-${status.toLowerCase()}" data-order-status="${esc(order.id)}" role="status">${status}</span>`;}
function ordersView() {
 const status=overallOrderStatus();
 return `${pageHead('YOUR PERSONAL ARCHIVE','My orders.','Every tool. Every new possibility. All in one place.')}<div class="stat-grid"><div class="panel"><span>Total orders</span><strong>${state.orders.length.toString().padStart(2,'0')}</strong></div><div class="panel"><span>Total spent</span><strong>${money(state.orders.reduce((sum,o)=>sum+o.total,0))}</strong></div><div class="panel"><span>Delivery status</span><strong id="delivery-status" class="status-text-${status.toLowerCase()}" role="status">${status}</strong><small>Pending → Idle → Completed</small></div></div>${state.orders.length?`<section class="panel"><div class="section-heading"><h2>Order history</h2><span class="badge">${state.orders.length} ORDERS</span></div>${state.orders.map(o=>`<article class="order-row"><div class="order-symbol">${icon('box')}</div><div><strong>${esc(o.id)}</strong><p>${o.items.map(p=>`${esc(p.name)} × ${p.quantity}`).join(' · ')}</p><small class="muted">${new Date(o.date).toLocaleString()}</small></div>${orderStatusBadge(o)}<strong>${money(o.total)}</strong><button class="button" data-order="${esc(o.id)}">View order ${icon('arrow')}</button></article>`).join('')}</section><p class="small muted">Status tracks this device's order workflow. Payment and live fulfillment are not connected.</p>`:empty('box','Your story starts with a first order.','Your purchases will appear here.','Find your first tool','#/market')}`;
}
function refreshOrderStatuses() {
 if(!authenticated||document.hidden)return;
 document.querySelectorAll('[data-order-status]').forEach(node=>{
  const order=state.orders.find(o=>o.id===node.dataset.orderStatus);if(!order)return;
  const status=orderStatus(order);
  if(node.textContent!==status){node.textContent=status;node.className=`status-pill order-status status-${status.toLowerCase()}`;}
 });
 const summary=$('#delivery-status');if(summary){const status=overallOrderStatus();if(summary.textContent!==status){summary.textContent=status;summary.className=`status-text-${status.toLowerCase()}`;}}
}
setInterval(refreshOrderStatuses,1000);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){walletAddressRevealed=false;const panel=$('#wallet-address-panel');if(panel)panel.innerHTML=walletAddressControls();}
 else refreshOrderStatuses();
});

window.addEventListener('scroll',positionMobileNavigation,{passive:true});
window.visualViewport?.addEventListener('scroll',positionMobileNavigation);

// Category links land at results on either a route change or an in-place filter change.
function scrollToCategoryResults() {
 if(!categoryScrollPending)return false;
 categoryScrollPending=false;
 const results=$('#catalog')||$('.locked-catalog');
 if(!results)return false;
 requestAnimationFrame(()=>{
  if(!results.isConnected)return;
  const header=$('.header');
  const clearance=header?header.getBoundingClientRect().height+(parseFloat(getComputedStyle(header).top)||0)+16:16;
  const top=Math.max(0,window.scrollY+results.getBoundingClientRect().top-clearance);
  results.setAttribute('tabindex','-1');results.focus({preventScroll:true});
  window.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
 return true;
}
