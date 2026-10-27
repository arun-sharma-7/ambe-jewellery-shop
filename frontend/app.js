/**
 * Ambe Jewellery Shop - Complete Client Application
 * Owner: Kanhaiya Sharma | Phone: 6202805193
 * Bihar 24K Gold Rate: ₹1,42,600 | Gold & Silver Delivery Booking
 */

const API_BASE = window.location.origin + '/api';

// APP STATE
const state = {
  user: null,
  token: localStorage.getItem('ambe_token') || null,
  products: [],
  filteredProducts: [],
  currentCategory: 'All',
  currentMetal: 'All', // 'Gold' | 'Silver' | 'All'
  goldRates: {
    gold24k: 142600,
    gold22k: 130700,
    gold18k: 106950,
    silver1kg: 98500,
    silver10g: 985,
    location: 'Bihar',
    marketStatus: 'LIVE MARKET OPEN (BIHAR)',
    updatedAt: 'Today Bihar Rate'
  },
  cart: {
    items: [],
    pricing: { subtotal: 0, gst: 0, grandTotal: 0, discount: 0 }
  },
  orders: [],
  addresses: [],
  activeCheckoutStep: 1,
  selectedAddress: null,
  selectedPayment: 'UPI',
  appliedCoupon: null,
  chatMessages: [],
  activeModalImageIdx: 0,
  activeModalProduct: null,
  guestId: localStorage.getItem('ambe_guest_id') || ('gst_' + Math.random().toString(36).substring(2, 9))
};

localStorage.setItem('ambe_guest_id', state.guestId);

// WALLPAPER HERO SLIDES
const wallpapers = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1611591475847-a859c2b4e727?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=85'
];
let currentWallpaperIdx = 0;

// INITIALIZE APPLICATION
document.addEventListener('DOMContentLoaded', async () => {
  initHeroWallpaperSlider();
  setupEventListeners();
  initDeliveryDatePicker();
  await loadCurrentUser();
  await loadLiveRates();
  await loadProducts();
  await loadCart();
  await loadChatMessages();
});

function initHeroWallpaperSlider() {
  const heroEl = document.getElementById('heroWallpaper');
  if (!heroEl) return;
  setInterval(() => {
    currentWallpaperIdx = (currentWallpaperIdx + 1) % wallpapers.length;
    heroEl.style.backgroundImage = `linear-gradient(to right, rgba(11, 12, 16, 0.92) 0%, rgba(11, 12, 16, 0.70) 50%, rgba(11, 12, 16, 0.88) 100%), url('${wallpapers[currentWallpaperIdx]}')`;
  }, 6000);
}

function initDeliveryDatePicker() {
  const dateInput = document.getElementById('orderDeliveryDate');
  if (dateInput) {
    // Default to +2 days from today
    const d = new Date(Date.now() + 2 * 86400000);
    dateInput.value = d.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      state.filteredProducts = state.products.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.purity && p.purity.toLowerCase().includes(q)) ||
        (p.carat && p.carat.toLowerCase().includes(q)) ||
        (p.metal && p.metal.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
      renderProductsGrid();
    });
  }
}

// API REQUEST HELPER
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const options = { method, headers };
    if (data && (method === 'POST' || method === 'PUT')) options.body = JSON.stringify(data);
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}:`, err);
    return null;
  }
}

// -------------------------------------------------------------
// LIVE GOLD (BIHAR ₹142600) & SILVER RATES
// -------------------------------------------------------------
async function loadLiveRates() {
  const res = await apiRequest('/gold-rates');
  if (res && res.success && res.rates) {
    state.goldRates = res.rates;
  }
  renderLiveRatesUI();
}

function renderLiveRatesUI() {
  const r = state.goldRates;

  const topRate = document.getElementById('topGoldRate');
  if (topRate) {
    topRate.innerHTML = `
      <span class="text-amber-400 font-bold"><i class="fa-solid fa-bolt"></i> Bihar 24K Gold:</span>
      <span class="font-black text-white">₹${r.gold24k.toLocaleString('en-IN')} / 10g</span>
    `;
  }

  if (document.getElementById('sideRate24k')) {
    document.getElementById('sideRate24k').innerText = `₹${r.gold24k.toLocaleString('en-IN')}`;
    document.getElementById('sideRate22k').innerText = `₹${r.gold22k.toLocaleString('en-IN')}`;
    document.getElementById('sideRate18k').innerText = `₹${r.gold18k.toLocaleString('en-IN')}`;
    document.getElementById('sideRateSilver').innerText = `₹${r.silver1kg.toLocaleString('en-IN')}`;
    document.getElementById('sideMarketStatus').innerText = r.marketStatus || 'LIVE MARKET OPEN (BIHAR)';
  }

  calculateLiveGoldEstimate();
}

function toggleSideRates(forceOpen = null) {
  const dock = document.getElementById('sideRatesDock');
  if (!dock) return;
  if (forceOpen === true) dock.classList.remove('collapsed');
  else if (forceOpen === false) dock.classList.add('collapsed');
  else dock.classList.toggle('collapsed');
}

function calculateLiveGoldEstimate() {
  const gramsInput = document.getElementById('calcGrams');
  const karatInput = document.getElementById('calcKarat');
  const resultEl = document.getElementById('calcResult');
  if (!gramsInput || !karatInput || !resultEl) return;

  const grams = parseFloat(gramsInput.value) || 10;
  const choice = karatInput.value;

  let baseRatePer10g = state.goldRates.gold24k;
  if (choice === '22') baseRatePer10g = state.goldRates.gold22k;
  else if (choice === '18') baseRatePer10g = state.goldRates.gold18k;
  else if (choice === 'silver999') baseRatePer10g = state.goldRates.silver10g || 985;
  else if (choice === 'silver925') baseRatePer10g = 915;

  const rawValue = (baseRatePer10g / 10) * grams;
  const makingCharges = choice.includes('silver') ? Math.round(rawValue * 0.10) : Math.round(rawValue * 0.08);
  const subtotal = rawValue + makingCharges;
  const gst = Math.round(subtotal * 0.03);
  const grandTotal = Math.round(subtotal + gst);

  resultEl.innerText = `₹${grandTotal.toLocaleString('en-IN')}`;
}

// -------------------------------------------------------------
// IMAGE FILE UPLOAD HELPERS (Base64 via FileReader)
// -------------------------------------------------------------
function previewMainImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    // Store base64 in hidden input
    document.getElementById('studioMainImage').value = base64;
    // Show preview
    const preview = document.getElementById('studioMainImagePreview');
    preview.src = base64;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function previewExtraImages(event) {
  const files = Array.from(event.target.files).slice(0, 4);
  const container = document.getElementById('studioExtraImagesPreview');
  container.innerHTML = '';

  const base64List = [];

  files.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      base64List[idx] = e.target.result;
      // Render preview thumbnail
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'w-16 h-16 rounded-xl object-cover border border-gold/40 shadow';
      img.title = file.name;
      container.appendChild(img);
      // Update hidden field after all done (use join on current state)
      document.getElementById('studioExtraImages').value = base64List.filter(Boolean).join('|||');
    };
    reader.readAsDataURL(file);
  });
}

function clearStudioImageInputs() {
  // Clear file inputs (can't pre-fill for security)
  const mainFileInput = document.getElementById('studioMainImageFile');
  if (mainFileInput) mainFileInput.value = '';
  const extraFileInput = document.getElementById('studioExtraImageFiles');
  if (extraFileInput) extraFileInput.value = '';
  // Clear previews
  const mainPreview = document.getElementById('studioMainImagePreview');
  if (mainPreview) { mainPreview.src = ''; mainPreview.classList.add('hidden'); }
  const extraContainer = document.getElementById('studioExtraImagesPreview');
  if (extraContainer) extraContainer.innerHTML = '';
  // Clear hidden fields
  document.getElementById('studioMainImage').value = '';
  document.getElementById('studioExtraImages').value = '';
}

function showExistingImagePreview(imageUrl, extraImages) {
  // Show existing image as preview when editing
  const mainPreview = document.getElementById('studioMainImagePreview');
  if (mainPreview && imageUrl) {
    mainPreview.src = imageUrl;
    mainPreview.classList.remove('hidden');
    document.getElementById('studioMainImage').value = imageUrl;
  }

  const container = document.getElementById('studioExtraImagesPreview');
  if (container && extraImages && extraImages.length > 0) {
    container.innerHTML = extraImages.map(url =>
      `<img src="${url}" class="w-16 h-16 rounded-xl object-cover border border-gold/40 shadow opacity-60" title="Existing photo">`
    ).join('');
    document.getElementById('studioExtraImages').value = extraImages.join('|||');
  }
}

// ADMIN CUSTOMIZE RATES
function openRateEditModal() {
  document.getElementById('editRate24k').value = state.goldRates.gold24k;
  document.getElementById('editRate22k').value = state.goldRates.gold22k;
  document.getElementById('editRate18k').value = state.goldRates.gold18k;
  document.getElementById('editRateSilver').value = state.goldRates.silver1kg;
  document.getElementById('rateEditModal').classList.remove('hidden');
}

function closeRateEditModal() {
  document.getElementById('rateEditModal').classList.add('hidden');
}

async function handleSaveLiveRates(e) {
  e.preventDefault();
  const payload = {
    gold24k: Number(document.getElementById('editRate24k').value),
    gold22k: Number(document.getElementById('editRate22k').value),
    gold18k: Number(document.getElementById('editRate18k').value),
    silver1kg: Number(document.getElementById('editRateSilver').value),
    marketStatus: "LIVE MARKET OPEN (BIHAR)"
  };

  const res = await apiRequest('/gold-rates', 'PUT', payload);
  if (res && res.success) {
    state.goldRates = res.rates;
    alert('Bihar Live Gold & Silver rates updated successfully!');
  } else {
    state.goldRates = { ...state.goldRates, ...payload };
    alert('Rates updated locally.');
  }

  renderLiveRatesUI();
  closeRateEditModal();
}

// -------------------------------------------------------------
// LIVE CUSTOMER CHAT SYSTEM
// -------------------------------------------------------------
function toggleLiveChat(forceOpen = null) {
  const panel = document.getElementById('liveChatPanel');
  if (!panel) return;
  if (forceOpen === true) {
    panel.classList.remove('hidden');
    loadChatMessages();
  } else if (forceOpen === false) {
    panel.classList.add('hidden');
  } else {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) loadChatMessages();
  }
}

async function loadChatMessages() {
  const res = await apiRequest('/chat/messages');
  if (res && res.success && res.messages) {
    state.chatMessages = res.messages;
  } else if (state.chatMessages.length === 0) {
    state.chatMessages = [
      {
        id: 'msg_welcome',
        sender: 'Kanhaiya Sharma (Owner)',
        text: 'Namaste! Bihar me aaj 24K Pure Gold ka rate ₹1,42,600 hai. Gold aur Silver dono ke sabhi designs uplabdh hain. Aap pasand karke delivery date aur time book kar sakte hain. Call: 6202805193',
        time: 'Just now',
        isOwner: true
      }
    ];
  }
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  container.innerHTML = state.chatMessages.map(msg => `
    <div class="flex flex-col ${msg.isOwner ? 'items-start' : 'items-end'}">
      <div class="text-[9px] text-slate-400 mb-0.5 px-1">${msg.sender} • ${msg.time}</div>
      <div class="p-3 max-w-[85%] text-xs leading-relaxed ${msg.isOwner ? 'chat-bubble-owner shadow-md' : 'chat-bubble-user'}">
        ${msg.text}
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

async function handleSendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInputText');
  const text = (input.value || '').trim();
  if (!text) return;

  input.value = '';
  const userName = state.user ? state.user.name : 'Customer';

  state.chatMessages.push({ id: 'msg_' + Date.now(), sender: userName, text, time: 'Now', isOwner: false });
  renderChatMessages();

  const res = await apiRequest('/chat/send', 'POST', { text, userName });
  if (res && res.success && res.ownerReply) {
    state.chatMessages.push(res.ownerReply);
    renderChatMessages();
    if (res.whatsappDirect) document.getElementById('chatDirectWaBtn').href = res.whatsappDirect;
  }
}

function sendQuickPrompt(promptText) {
  document.getElementById('chatInputText').value = promptText;
  handleSendChatMessage(new Event('submit'));
}

// -------------------------------------------------------------
// LOAD PRODUCTS & FILTER BY GOLD / SILVER / CATEGORY
// -------------------------------------------------------------
async function loadProducts() {
  const res = await apiRequest('/products');
  if (res && res.success && res.products) {
    state.products = res.products;
    state.filteredProducts = res.products;
  } else {
    state.products = getFallbackProducts();
    state.filteredProducts = state.products;
  }
  renderProductsGrid();
}

function filterByMetal(metal) {
  state.currentMetal = metal;
  const titleEl = document.getElementById('catalogMainTitle');
  if (titleEl) {
    titleEl.innerText = metal === 'Gold' ? 'Pure 24K & 22K Gold Ornaments' : (metal === 'Silver' ? 'Pure 999 & 925 Silver (Chandi) Ornaments' : 'All Gold & Silver Items');
  }

  if (metal === 'All') {
    state.filteredProducts = state.products;
  } else {
    state.filteredProducts = state.products.filter(p => (p.metal || 'Gold').toLowerCase() === metal.toLowerCase());
  }

  renderProductsGrid();
  scrollToProducts();
}

function filterCategory(cat) {
  state.currentCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    if (btn.innerText.includes(cat) || (cat === 'All' && btn.innerText.includes('All'))) {
      btn.className = 'cat-pill active px-4 py-1.5 rounded-full text-xs font-semibold bg-gold text-royal-950 transition';
    } else {
      btn.className = 'cat-pill px-4 py-1.5 rounded-full text-xs font-semibold bg-royal-800 text-slate-300 hover:text-white border border-gold/20 transition';
    }
  });

  if (cat === 'All') {
    state.filteredProducts = state.products;
  } else {
    state.filteredProducts = state.products.filter(p => p.category.toLowerCase() === cat.toLowerCase());
  }

  renderProductsGrid();
  scrollToProducts();
}

function renderProductsGrid() {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  if (state.filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 bg-royal-800/40 rounded-2xl border border-gold/20">
        <i class="fa-solid fa-gem text-gold/40 text-4xl mb-3"></i>
        <h4 class="text-base font-bold text-white">No Items Found</h4>
        <button onclick="openAddProductModal()" class="mt-3 px-5 py-2 bg-gold text-royal-950 font-bold text-xs rounded-full">
          + Add Gold or Silver Item
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.filteredProducts.map(p => {
    const isGold = (p.metal || 'Gold') === 'Gold';
    const metalBadgeColor = isGold ? 'bg-amber-950/90 text-gold-300 border-gold/40' : 'bg-slate-900/90 text-slate-200 border-slate-500/40';
    const imagesCount = p.images && p.images.length > 0 ? p.images.length : 1;

    return `
      <div class="gold-glass rounded-2xl overflow-hidden border ${isGold ? 'border-gold/25' : 'border-slate-600/30'} gold-glass-hover flex flex-col justify-between group">
        
        <!-- Image & Carat Badge -->
        <div class="relative aspect-square overflow-hidden bg-royal-950 cursor-pointer" onclick="openProductModal('${p.id}')">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-108 transition duration-500">
          
          <div class="absolute top-3 left-3 ${metalBadgeColor} border text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
            <i class="fa-solid ${isGold ? 'fa-crown text-gold' : 'fa-ring text-slate-300'} mr-1"></i>
            ${p.carat || p.purity}
          </div>

          ${p.deliveryDays ? `
            <div class="absolute bottom-3 right-3 bg-emerald-950/90 text-emerald-400 border border-emerald-600/40 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i class="fa-solid fa-truck-fast"></i> ${p.deliveryDays} Days Delivery
            </div>
          ` : ''}

          ${imagesCount > 1 ? `
            <div class="absolute bottom-3 left-3 bg-black/75 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/30">
              <i class="fa-solid fa-images"></i> ${imagesCount} Photos
            </div>
          ` : ''}

          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span class="px-4 py-2 bg-royal-950/90 text-gold border border-gold text-xs font-bold rounded-full">
              View ${imagesCount} Photos & Date
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>${p.metal || 'Gold'} • ${p.category}</span>
              <span class="text-amber-200 font-bold">${p.weightGrams}g</span>
            </div>

            <h4 onclick="openProductModal('${p.id}')" class="text-sm font-bold text-white group-hover:text-gold transition cursor-pointer line-clamp-1 mb-2">
              ${p.title}
            </h4>

            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-black text-gold">₹${p.price.toLocaleString('en-IN')}</span>
              <span class="text-xs text-slate-500 line-through">₹${(p.mrp || p.price * 1.1).toLocaleString('en-IN')}</span>
              <span class="text-[10px] text-slate-400 font-semibold ml-auto">Making: ${p.makingCharge || '₹1,500'}</span>
            </div>
          </div>

          <div class="space-y-2 pt-2 border-t border-gold/15">
            <div class="grid grid-cols-2 gap-2">
              <button onclick="addToCart('${p.id}', 1)" class="w-full py-2 bg-royal-900 hover:bg-royal-950 text-gold-300 border border-gold/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
              </button>
              <button onclick="quickBuyItem('${p.id}')" class="w-full py-2 bg-gradient-to-r from-amber-500 to-gold hover:brightness-110 text-royal-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 uppercase">
                Book Date
              </button>
            </div>

            <button onclick="openEditProductModal('${p.id}')" class="w-full py-1.5 bg-royal-800/80 hover:bg-royal-700 text-gold-400 hover:text-white border border-gold/20 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition">
              <i class="fa-solid fa-pen-to-square text-[10px]"></i> Edit Price / Carat / Making
            </button>
          </div>

        </div>

      </div>
    `;
  }).join('');
}

function scrollToProducts() {
  const el = document.getElementById('productsSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// -------------------------------------------------------------
// MULTI-IMAGE QUICK VIEW MODAL
// -------------------------------------------------------------
function openProductModal(prodId) {
  const prod = state.products.find(p => p.id === prodId);
  if (!prod) return;

  state.activeModalProduct = prod;
  state.activeModalImageIdx = 0;

  const images = (prod.images && prod.images.length > 0) ? prod.images : [prod.image];
  const modal = document.getElementById('productModal');
  const container = document.getElementById('productModalContent');

  container.innerHTML = `
    <button onclick="closeProductModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
      <i class="fa-solid fa-xmark text-lg"></i>
    </button>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div class="space-y-3">
        <div class="aspect-square rounded-2xl overflow-hidden border border-gold/30 bg-royal-950 shadow-xl relative">
          <img id="modalMainImg" src="${images[0]}" alt="${prod.title}" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3 bg-royal-950/90 text-gold-300 border border-gold/30 text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
            ${prod.carat || prod.purity}
          </div>
        </div>

        ${images.length > 1 ? `
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            ${images.map((imgUrl, idx) => `
              <div onclick="switchModalImage(${idx})" id="thumb-${idx}" class="gallery-thumb ${idx === 0 ? 'active' : ''} w-16 h-16 rounded-xl overflow-hidden border border-gold/20 flex-shrink-0 cursor-pointer">
                <img src="${imgUrl}" class="w-full h-full object-cover">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="space-y-4">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold">
          <i class="fa-solid fa-award"></i> ${prod.metal || 'Gold'} • ${prod.carat || '22K'} • ${prod.category}
        </div>

        <h3 class="text-xl font-bold font-serif-luxury text-white">${prod.title}</h3>

        <div class="flex items-baseline gap-3">
          <span class="text-2xl font-black text-gold">₹${prod.price.toLocaleString('en-IN')}</span>
          <span class="text-sm text-slate-500 line-through">₹${(prod.mrp || prod.price * 1.1).toLocaleString('en-IN')}</span>
        </div>

        <div class="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <i class="fa-solid fa-calendar-check text-base"></i>
          <div>
            <strong>Guaranteed Delivery Commitment:</strong>
            <p class="text-[11px] text-slate-300">Choose your delivery date & time slot at checkout. Delivered in ${prod.deliveryDays || 2} days.</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs bg-royal-900/60 p-3.5 rounded-xl border border-gold/20">
          <div><span class="text-slate-400">Weight:</span> <strong class="text-white">${prod.weightGrams}g</strong></div>
          <div><span class="text-slate-400">Making Charges:</span> <strong class="text-white">${prod.makingCharge || '₹3,500'}</strong></div>
          <div><span class="text-slate-400">Carat:</span> <strong class="text-gold font-bold">${prod.carat || '22K'}</strong></div>
          <div><span class="text-slate-400">Hallmark:</span> <strong class="text-emerald-400">100% BIS Certified</strong></div>
        </div>

        <div class="pt-2 flex items-center gap-3">
          <button onclick="addToCart('${prod.id}', 1); closeProductModal();" class="flex-1 py-3 bg-royal-900 text-gold-300 border border-gold/40 rounded-xl text-xs font-bold">
            Add to Cart
          </button>
          <button onclick="quickBuyItem('${prod.id}'); closeProductModal();" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-gold text-royal-950 font-black rounded-xl text-xs uppercase">
            Book Delivery Date
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function switchModalImage(idx) {
  state.activeModalImageIdx = idx;
  const prod = state.activeModalProduct;
  if (!prod) return;
  const images = (prod.images && prod.images.length > 0) ? prod.images : [prod.image];
  const imgEl = document.getElementById('modalMainImg');
  if (imgEl) imgEl.src = images[idx];
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

// -------------------------------------------------------------
// ADMIN STUDIO: ADD / EDIT PRODUCT, CARAT, MAKING CHARGE, METAL
// -------------------------------------------------------------
function openOwnerStudioModal() {
  openAddProductModal();
}

function openAddProductModal(defaultCat = 'Necklaces') {
  document.getElementById('studioProdId').value = '';
  document.getElementById('studioModalTitle').innerText = 'Admin Studio: Add Gold or Silver Item';
  document.getElementById('studioTitle').value = '';
  document.getElementById('studioMetal').value = 'Gold';
  document.getElementById('studioCarat').value = '22K';
  document.getElementById('studioCategory').value = defaultCat;
  document.getElementById('studioWeight').value = '40.0';
  document.getElementById('studioPrice').value = '142600';
  document.getElementById('studioMaking').value = '₹5,500';
  document.getElementById('studioDeliveryDays').value = '2';
  document.getElementById('studioDeleteBtn').classList.add('hidden');

  // Clear image inputs for fresh add
  clearStudioImageInputs();

  adjustStudioCaratOptions();
  document.getElementById('productStudioModal').classList.remove('hidden');
}

function adjustStudioCaratOptions() {
  const metal = document.getElementById('studioMetal').value;
  const caratSelect = document.getElementById('studioCarat');
  if (metal === 'Silver') {
    caratSelect.innerHTML = `
      <option value="999 Silver" selected>999 Pure Silver (Chandi)</option>
      <option value="925 Silver">925 Sterling Silver</option>
    `;
    document.getElementById('studioPrice').value = '18500';
    document.getElementById('studioCategory').value = 'Silver';
  } else {
    caratSelect.innerHTML = `
      <option value="24K">24K Pure Gold (999)</option>
      <option value="22K" selected>22K Standard (916)</option>
      <option value="18K">18K Diamond Gold (750)</option>
    `;
    document.getElementById('studioPrice').value = '142600';
    document.getElementById('studioCategory').value = 'Necklaces';
  }
}

function openEditProductModal(prodId) {
  const prod = state.products.find(p => p.id === prodId);
  if (!prod) return;

  document.getElementById('studioProdId').value = prod.id;
  document.getElementById('studioModalTitle').innerText = `Edit: ${prod.title}`;
  document.getElementById('studioTitle').value = prod.title;
  document.getElementById('studioMetal').value = prod.metal || 'Gold';
  adjustStudioCaratOptions();
  document.getElementById('studioCarat').value = prod.carat || '22K';
  document.getElementById('studioCategory').value = prod.category;
  document.getElementById('studioWeight').value = prod.weightGrams;
  document.getElementById('studioPrice').value = prod.price;
  document.getElementById('studioMaking').value = prod.makingCharge || '₹3,500';
  document.getElementById('studioDeliveryDays').value = prod.deliveryDays || 2;
  document.getElementById('studioDeleteBtn').classList.remove('hidden');

  // Clear file inputs first, then show existing image preview
  clearStudioImageInputs();
  showExistingImagePreview(prod.image, prod.images || []);

  document.getElementById('productStudioModal').classList.remove('hidden');
}

function closeProductStudioModal() {
  document.getElementById('productStudioModal').classList.add('hidden');
}

async function handleSaveProductStudio(e) {
  e.preventDefault();
  const prodId = document.getElementById('studioProdId').value;
  const title = document.getElementById('studioTitle').value.trim();
  const metal = document.getElementById('studioMetal').value;
  const carat = document.getElementById('studioCarat').value;
  const category = document.getElementById('studioCategory').value;
  const weightGrams = parseFloat(document.getElementById('studioWeight').value) || 20;
  const price = parseFloat(document.getElementById('studioPrice').value);
  const makingCharge = document.getElementById('studioMaking').value.trim() || '₹3,500';
  const deliveryDays = parseInt(document.getElementById('studioDeliveryDays').value) || 2;

  // Get image from hidden field (could be base64 uploaded or existing URL)
  const image = document.getElementById('studioMainImage').value.trim() 
    || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';

  // Extra images: stored as ||| separated base64 or URLs
  const extraRaw = document.getElementById('studioExtraImages').value.trim();
  let images = [];
  if (extraRaw) {
    // Support both ||| separator (new file upload) and comma separated (old URLs)
    if (extraRaw.includes('|||')) {
      images = extraRaw.split('|||').map(s => s.trim()).filter(Boolean);
    } else {
      images = extraRaw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!images.includes(image)) images.unshift(image);

  const payload = {
    title,
    metal,
    carat,
    purity: `${carat} Hallmark Certified`,
    category,
    weightGrams,
    price,
    mrp: Math.round(price * 1.1),
    makingCharge,
    deliveryDays,
    image,
    images,
    badge: metal === 'Silver' ? '999 Pure Silver' : (carat === '24K' ? 'Bihar 24K Gold' : '22K Hallmark')
  };

  if (prodId) {
    await apiRequest(`/products/${prodId}`, 'PUT', payload);
    alert(`Updated product "${title}" successfully!`);
  } else {
    await apiRequest('/products', 'POST', payload);
    alert(`Added new ${metal} item "${title}" successfully!`);
  }

  closeProductStudioModal();
  await loadProducts();
}

async function handleDeleteProductStudio() {
  const prodId = document.getElementById('studioProdId').value;
  if (!prodId || !confirm('Delete this item?')) return;
  await apiRequest(`/products/${prodId}`, 'DELETE');
  closeProductStudioModal();
  await loadProducts();
}

// -------------------------------------------------------------
// CART & MULTI-STEP CHECKOUT (DELIVERY DATE COMMITMENT)
// -------------------------------------------------------------
async function loadCart() {
  const res = await apiRequest(`/cart?guestId=${state.guestId}`);
  if (res && res.success) state.cart = res;
  updateCartBadges();
  renderCartDrawer();
}

function updateCartBadges() {
  const count = state.cart.itemCount || (state.cart.items ? state.cart.items.reduce((a, b) => a + b.quantity, 0) : 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = count;
}

async function addToCart(productId, quantity = 1, size = 'Standard') {
  await apiRequest('/cart/add', 'POST', { productId, quantity, selectedSize: size, guestId: state.guestId });
  await loadCart();
  toggleCartDrawer(true);
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (open) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    renderCartDrawer();
  } else {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cartDrawerItems');
  if (!listContainer) return;
  const items = state.cart.items || [];

  if (items.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-16 text-slate-400">
        <i class="fa-solid fa-bag-shopping text-4xl text-gold/30 mb-3"></i>
        <p class="text-sm font-semibold text-white">Your Cart is Empty</p>
      </div>
    `;
    document.getElementById('drawerGrandTotal').innerText = '₹0';
    return;
  }

  listContainer.innerHTML = items.map(item => `
    <div class="flex gap-4 p-3 bg-royal-900/60 rounded-xl border border-gold/20 items-center text-xs">
      <img src="${item.product.image}" class="w-14 h-14 object-cover rounded-lg border border-gold/30">
      <div class="flex-1">
        <div class="font-bold text-white">${item.product.title}</div>
        <div class="text-[10px] text-amber-300">${item.product.carat || item.product.purity} • ${item.quantity} qty</div>
        <div class="font-bold text-gold">₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('drawerGrandTotal').innerText = `₹${(state.cart.pricing.grandTotal || 0).toLocaleString('en-IN')}`;
}

function proceedFromCartToCheckout() {
  if (!state.cart.items || state.cart.items.length === 0) {
    alert('Please add an item to cart first!');
    return;
  }
  toggleCartDrawer(false);
  switchView('checkout');
}

function quickBuyItem(productId) {
  addToCart(productId, 1);
  setTimeout(() => {
    toggleCartDrawer(false);
    switchView('checkout');
  }, 300);
}

function renderCheckout() {
  goToCheckoutStep(1);
  renderCheckoutAddresses();
  renderCheckoutSummary();
}

function goToCheckoutStep(step) {
  state.activeCheckoutStep = step;
  for (let s = 1; s <= 4; s++) {
    const dot = document.getElementById(`stepDot-${s}`);
    const panel = document.getElementById(`checkoutStep-${s}`);
    if (!dot || !panel) continue;

    if (s === step) {
      dot.className = 'w-9 h-9 rounded-full bg-gold text-royal-950 font-bold flex items-center justify-center text-sm shadow ring-4 ring-gold/20';
      panel.classList.remove('hidden');
    } else if (s < step) {
      dot.className = 'w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow';
      dot.innerHTML = '✓';
      panel.classList.add('hidden');
    } else {
      dot.className = 'w-9 h-9 rounded-full bg-royal-800 text-slate-400 border border-gold/30 font-bold flex items-center justify-center text-sm shadow';
      dot.innerHTML = `${s}`;
      panel.classList.add('hidden');
    }
  }

  if (step === 2) renderCheckoutItemsList();
}

function renderCheckoutAddresses() {
  const container = document.getElementById('checkoutAddressChoices');
  if (!container) return;

  const addrs = (state.user && state.user.addresses && state.user.addresses.length > 0)
    ? state.user.addresses
    : [{ id: 'addr_default', name: 'Kanhaiya Sharma', phone: '6202805193', address: 'Ambe Jewellery Showroom, Main Market, Patna, Bihar - 800001' }];

  container.innerHTML = addrs.map((addr, idx) => `
    <label class="flex items-start gap-3 p-4 rounded-xl border ${idx === 0 ? 'border-gold bg-royal-900/90' : 'border-gold/20 bg-royal-950/60'} cursor-pointer text-xs">
      <input type="radio" name="chkAddressOption" value="${addr.id}" ${idx === 0 ? 'checked' : ''} class="mt-1 text-gold">
      <div>
        <strong class="text-white">${addr.name}</strong> (${addr.phone})
        <p class="text-slate-400 mt-1">${addr.address}</p>
      </div>
    </label>
  `).join('');

  state.selectedAddress = addrs[0];
}

function renderCheckoutItemsList() {
  const container = document.getElementById('checkoutItemsList');
  if (!container) return;
  const items = state.cart.items || [];
  container.innerHTML = items.map(item => `
    <div class="flex items-center justify-between p-3 bg-royal-950/70 rounded-xl border border-gold/20 text-xs">
      <div class="flex items-center gap-3">
        <img src="${item.product.image}" class="w-12 h-12 object-cover rounded-lg border border-gold/30">
        <div>
          <h5 class="font-bold text-white">${item.product.title}</h5>
          <div class="text-[10px] text-amber-300">${item.product.carat || item.product.purity} • ${item.product.weightGrams}g</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-black text-gold">₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    </div>
  `).join('');
}

function renderCheckoutSummary() {
  const items = state.cart.items || [];
  const subtotal = items.reduce((acc, cur) => acc + (cur.product.price * cur.quantity), 0);
  const gst = Math.round(subtotal * 0.03);
  const grandTotal = subtotal + gst;

  document.getElementById('chkTotalItems').innerText = items.reduce((a, b) => a + b.quantity, 0);
  document.getElementById('chkSubtotal').innerText = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('chkGst').innerText = `₹${gst.toLocaleString('en-IN')}`;
  document.getElementById('chkGrandTotal').innerText = `₹${grandTotal.toLocaleString('en-IN')}`;

  const payBtnText = document.getElementById('payButtonText');
  if (payBtnText) payBtnText.innerText = `CONFIRM & BOOK DELIVERY (₹${grandTotal.toLocaleString('en-IN')})`;
}

function selectPaymentOption(opt) {
  state.selectedPayment = opt;
  const subpanel = document.getElementById('subpanel-UPI');
  if (subpanel) subpanel.classList.toggle('hidden', opt !== 'UPI');
}

async function executeFinalOrder() {
  const btn = document.getElementById('btnConfirmPay');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Registering Guaranteed Delivery...`;

  const deliveryDateVal = document.getElementById('orderDeliveryDate').value;
  const deliveryTimeVal = document.getElementById('orderDeliveryTimeSlot').value;

  const payload = {
    shippingAddress: state.selectedAddress || { name: 'Kanhaiya Sharma', phone: '6202805193', address: 'Patna, Bihar' },
    paymentMethod: state.selectedPayment,
    deliveryDate: deliveryDateVal,
    deliveryTimeSlot: deliveryTimeVal,
    guestId: state.guestId
  };

  const res = await apiRequest('/orders/checkout', 'POST', payload);
  btn.disabled = false;
  btn.innerHTML = `<span>CONFIRM & BOOK DELIVERY</span>`;

  const orderId = (res && res.order) ? res.order.id : ('OD-AMBE-' + Math.floor(100000 + Math.random() * 900000));
  document.getElementById('confirmedOrderId').innerText = orderId;
  document.getElementById('confirmedDeliveryDate').innerText = `${deliveryDateVal} (${deliveryTimeVal})`;

  if (res && res.whatsappOrderUrl) {
    document.getElementById('btnWhatsAppSync').href = res.whatsappOrderUrl;
  }

  state.cart.items = [];
  updateCartBadges();
  goToCheckoutStep(4);
}

function viewPlacedOrderInFlipkart() {
  switchView('profile');
  switchProfileTab('orders');
}

// -------------------------------------------------------------
// FLIPKART PROFILE & ORDERS (WITH PROMISED DELIVERY DATE)
// -------------------------------------------------------------
function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));

  if (viewName === 'home') {
    document.getElementById('homeView').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'profile') {
    if (!state.user) {
      openAuthModal();
      return;
    }
    document.getElementById('profileView').classList.remove('hidden');
    renderFlipkartProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'checkout') {
    document.getElementById('checkoutView').classList.remove('hidden');
    renderCheckout();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function renderFlipkartProfile() {
  if (!state.user) return;
  document.getElementById('userNameSidebar').innerText = state.user.name;
  document.getElementById('userPhoneSidebar').innerText = state.user.phone ? `+91 ${state.user.phone}` : '+91 6202805193';
  document.getElementById('profName').value = state.user.name;
  document.getElementById('profPhone').value = state.user.phone || '6202805193';
  document.getElementById('profEmail').value = state.user.email || 'kanhaiya.sharma@ambejewellery.com';
  loadOrdersList();
}

function switchProfileTab(tabName) {
  document.querySelectorAll('.fk-sidebar-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.fk-tab-content').forEach(p => p.classList.add('hidden'));
  const activePanel = document.getElementById(`tabContent-${tabName}`);
  if (activePanel) activePanel.classList.remove('hidden');
}

async function loadOrdersList() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;
  const res = await apiRequest('/orders');
  const orders = (res && res.orders) ? res.orders : getFallbackOrders();

  container.innerHTML = orders.map(ord => {
    const delivery = ord.deliveryCommitment || { promisedDate: "28 Oct 2026", promisedTimeSlot: "Evening 04:00 PM - 07:00 PM" };
    return `
      <div class="bg-royal-950/80 rounded-2xl border border-gold/30 p-5 space-y-4 text-xs">
        <div class="flex justify-between items-center pb-3 border-b border-gold/15">
          <div>Order ID: <strong class="text-gold">${ord.id}</strong></div>
          <div class="text-emerald-400 font-bold">Total: ₹${(ord.pricing ? ord.pricing.total : 146878).toLocaleString('en-IN')}</div>
        </div>

        <div class="p-3 bg-royal-900/90 rounded-xl border border-gold/30 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-amber-300 font-bold uppercase">📅 Promised Delivery Commitment:</div>
            <div class="text-sm font-black text-white">${delivery.promisedDate} (${delivery.promisedTimeSlot})</div>
          </div>
          <span class="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
            On-Time Guarantee
          </span>
        </div>

        <div class="space-y-3">
          ${ord.items.map(i => `
            <div class="flex items-center gap-3">
              <img src="${i.image}" class="w-12 h-12 object-cover rounded-lg border border-gold/30">
              <div>
                <div class="font-bold text-white">${i.title}</div>
                <div class="text-[10px] text-amber-300">${i.carat || '24K'} • ₹${i.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// USER NAV & AUTH
// -------------------------------------------------------------
async function loadCurrentUser() {
  if (state.token) {
    const res = await apiRequest('/auth/me');
    if (res && res.success && res.user) {
      state.user = res.user;
      state.addresses = res.user.addresses || [];
    } else {
      state.token = null;
      state.user = null;
      localStorage.removeItem('ambe_token');
    }
  }
  renderUserNav();
}

function renderUserNav() {
  const container = document.getElementById('userNavContainer');
  if (!container) return;

  if (state.user) {
    container.innerHTML = `
      <div class="relative group">
        <button class="flex items-center gap-2 px-3 py-2 bg-royal-800 border border-gold/40 rounded-xl text-xs font-bold text-white">
          <span>${state.user.name.split(' ')[0]}</span>
          <i class="fa-solid fa-chevron-down text-[10px] text-gold"></i>
        </button>
        <div class="absolute right-0 mt-1 w-48 bg-royal-950 border border-gold/30 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50 text-xs">
          <button onclick="switchView('profile'); switchProfileTab('orders');" class="w-full text-left px-4 py-2 hover:bg-royal-800 text-slate-200">
            My Orders & Delivery
          </button>
          <button onclick="openOwnerStudioModal()" class="w-full text-left px-4 py-2 hover:bg-royal-800 text-amber-300 font-bold">
            Admin Studio
          </button>
          <button onclick="handleLogout()" class="w-full text-left px-4 py-2 hover:bg-royal-800 text-red-400">
            Log Out
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="window.location.href='auth.html'" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-gold text-royal-950 font-bold rounded-xl text-xs uppercase">
        Login / Sign Up
      </button>
    `;
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}
function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  const res = await apiRequest('/auth/login', 'POST', { identifier, password });
  if (res && res.success && res.token) {
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('ambe_token', res.token);
    closeAuthModal();
    renderUserNav();
    alert(`Welcome back to Ambe Jewellery, ${res.user.name}!`);
  }
}

function demoLogin() {
  document.getElementById('loginIdentifier').value = '6202805193';
  document.getElementById('loginPassword').value = 'password123';
  handleLoginSubmit(new Event('submit'));
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('ambe_token');
  renderUserNav();
  switchView('home');
}

function getFallbackProducts() {
  return [
    {
      id: "prod_gold_2",
      title: "Lakshmi-Ganesh 24K Pure Gold Coin / Bar (999 Purity)",
      metal: "Gold",
      carat: "24K",
      category: "Coins",
      price: 142600,
      weightGrams: 10,
      image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
      deliveryDays: 1
    }
  ];
}

function getFallbackOrders() {
  return [
    {
      id: "OD-AMBE-98421",
      deliveryCommitment: { promisedDate: "28 Oct 2026", promisedTimeSlot: "Evening 04:00 PM - 07:00 PM" },
      pricing: { total: 146878 },
      items: [{ title: "Lakshmi-Ganesh 24K Gold Bar", price: 142600, carat: "24K", image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80" }]
    }
  ];
}
