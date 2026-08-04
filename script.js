const PRODUCTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0MnVCxHS8wU9pA4laJ45n9_UaV9rrPc-PhadUQ_v71gq0c2ENR2dPp6uqf9fgCSPA-BcEXYe0iMqu/pub?gid=0&single=true&output=csv";
const CAROUSEL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0MnVCxHS8wU9pA4laJ45n9_UaV9rrPc-PhadUQ_v71gq0c2ENR2dPp6uqf9fgCSPA-BcEXYe0iMqu/pub?gid=1445747052&single=true&output=csv"; 

let storeProducts = [];
let carouselItems = [];
let shoppingCart = [];
const STORE_PHONE = "959793155856"; 

const catalogView = document.getElementById('catalog-view');
const cartView = document.getElementById('cart-view');
const mainGrid = document.getElementById('product-grid');

document.addEventListener('DOMContentLoaded', () => {
    renderSkeletons(mainGrid, 8);
    renderSkeletons(document.getElementById('new-arrivals-grid'), 4);
    renderSkeletons(document.getElementById('trending-grid'), 4);
    fetchStoreData();
});

function fetchStoreData() {
    const cacheBuster = "&t=" + new Date().getTime();

    Papa.parse(PRODUCTS_CSV_URL + cacheBuster, {
        download: true,
        header: true,
        complete: function(results) {
            storeProducts = results.data
                .filter(row => row.id && row.name)
                .map(row => {
                    const imgs = [row.image1, row.image2, row.image3].filter(img => img && img.trim() !== '');
                    const tagsArray = row.tags ? row.tags.split(',').map(tag => tag.trim()) : [];
                    return {
                        id: row.id.toString(),
                        category: row.category || 'Uncategorized',
                        subCategory: row.subCategory || '',
                        name: row.name,
                        description: row.description || '',
                        price: parseFloat(row.price) || 0,
                        discountPrice: row.discountPrice ? parseFloat(row.discountPrice) : null,
                        tags: tagsArray,
                        images: imgs.length > 0 ? imgs : ['https://via.placeholder.com/300x400?text=No+Image']
                    };
                });

            renderGrid(storeProducts, mainGrid);
            renderGrid(getSectionProducts('New', storeProducts, 4), document.getElementById('new-arrivals-grid'));
            renderGrid(getSectionProducts('Trending', storeProducts, 4), document.getElementById('trending-grid'));
        }
    });

    if (CAROUSEL_CSV_URL) {
        Papa.parse(CAROUSEL_CSV_URL + cacheBuster, {
            download: true,
            header: true,
            complete: function(results) {
                carouselItems = results.data.filter(row => row.imageUrl);
                renderCarousel();
            }
        });
    }
}

function getSectionProducts(targetTag, allProducts, limit = 4) {
    const tagged = allProducts.filter(p => p.tags.some(t => t.toLowerCase() === targetTag.toLowerCase()));
    if (tagged.length > 0) return tagged.slice(0, limit);

    const fallback = [];
    const seen = new Set();
    for (const p of allProducts) {
        const key = p.subCategory ? p.subCategory.trim() : p.category.trim(); 
        if (!seen.has(key)) { seen.add(key); fallback.push(p); }
        if (fallback.length === limit) break;
    }
    return fallback;
}

function renderSkeletons(container, count = 8) {
    container.innerHTML = '';
    for(let i=0; i<count; i++) {
        container.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-box skeleton-img"></div>
                <div class="skeleton-box skeleton-text"></div>
                <div class="skeleton-box skeleton-text"></div>
            </div>`;
    }
}

function renderGrid(productsArray, container) {
    container.innerHTML = ''; 
    productsArray.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = (e) => openProductInline(product.id, e.currentTarget);

        let badgesHTML = '<div class="badge-container">';
        product.tags.forEach(tag => {
            const isDiscount = tag.toLowerCase().includes('%') || tag.toLowerCase().includes('off');
            badgesHTML += `<span class="product-badge ${isDiscount ? 'badge-discount' : ''}">${tag}</span>`;
        });
        badgesHTML += '</div>';

        let priceHTML = product.discountPrice 
            ? `<p class="product-price"><span class="old-price">$${product.price.toFixed(2)}</span> <span class="sale-price">$${product.discountPrice.toFixed(2)}</span></p>` 
            : `<p class="product-price">$${product.price.toFixed(2)}</p>`;

        card.innerHTML = `
            ${product.tags.length > 0 ? badgesHTML : ''}
            <div class="img-container">
                <img src="${product.images[0]}" class="grid-img" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <p class="product-brand">${product.category}</p>
                <h3 class="product-title">${product.name}</h3>
                ${priceHTML}
            </div>
        `;
        container.appendChild(card);
    });
}

function openProductInline(productId, cardElement) {
    document.querySelectorAll('.inline-detail').forEach(el => el.remove());

    const product = storeProducts.find(p => p.id === productId.toString());
    if (!product) return;

    const activePrice = product.discountPrice ? product.discountPrice : product.price;

    let thumbnailsHTML = '';
    product.images.forEach(imgUrl => {
        thumbnailsHTML += `<img src="${imgUrl}" onclick="document.getElementById('main-img-${product.id}').src='${imgUrl}'" alt="${product.name} thumbnail">`;
    });

    const detailDiv = document.createElement('div');
    detailDiv.className = 'inline-detail';

    detailDiv.innerHTML = `
        <button class="close-inline-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="inline-gallery">
            <div class="inline-main-img-container" onmouseenter="startZoom(this)" onmousemove="zoomImage(event, this)" onmouseleave="resetZoom(this)">
                <img src="${product.images[0]}" class="main-inline-img" id="main-img-${product.id}" alt="${product.name}">
            </div>
            <div class="inline-thumbnails">
                ${thumbnailsHTML}
            </div>
        </div>
        <div class="inline-info-wrapper">
            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; margin: 0 0 0.2rem 0; color: #fff; line-height: 1.2;">${product.name}</h2>
            <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--accent);">$${activePrice.toFixed(2)}</p>
            <p class="inline-desc">${product.description || 'Premium selection from Luxe Elite. Crafted with excellence for the modern aesthetic.'}</p>
            
            <div class="inline-controls">
                <div class="qty-selector">
                    <button onclick="changeQtyInline(-1, this)">-</button>
                    <input type="number" class="inline-qty" value="1" min="1" readonly>
                    <button onclick="changeQtyInline(1, this)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addInlineToCart('${product.id}', this)">
                    ADD <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
        </div>
    `;

    const parentGrid = cardElement.parentElement;
    const allCards = Array.from(parentGrid.children).filter(c => c.classList.contains('product-card'));
    const index = allCards.indexOf(cardElement);
    const cardsPerRow = window.innerWidth >= 768 ? 4 : 2; 
    const insertAfterIndex = Math.min(index + (cardsPerRow - 1 - (index % cardsPerRow)), allCards.length - 1);

    allCards[insertAfterIndex].after(detailDiv);
    detailDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// === BULLETPROOF JS ZOOM MAGNIFIER ===
function startZoom(container) {
    if (window.innerWidth < 768) return; 
    const img = container.querySelector('.main-inline-img');
    if (img) img.style.transform = 'scale(2.5)'; 
}

function zoomImage(e, container) {
    if (window.innerWidth < 768) return;
    const img = container.querySelector('.main-inline-img');
    if (!img) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
}

function resetZoom(container) {
    const img = container.querySelector('.main-inline-img');
    if (img) {
        img.style.transform = 'scale(1)'; 
        setTimeout(() => {
            img.style.transformOrigin = 'center center'; 
        }, 150); 
    }
}

function changeQtyInline(amount, btnElement) {
    const input = btnElement.parentElement.querySelector('.inline-qty');
    let newVal = parseInt(input.value) + amount;
    if (newVal >= 1) input.value = newVal;
}

function addInlineToCart(productId, btnElement) {
    const quantity = parseInt(btnElement.parentElement.querySelector('.inline-qty').value);
    const product = storeProducts.find(p => p.id === productId);
    const existingItem = shoppingCart.find(item => item.id === productId);
    const activePrice = product.discountPrice ? product.discountPrice : product.price;

    if (existingItem) existingItem.quantity += quantity;
    else shoppingCart.push({ id: product.id, name: product.name, price: activePrice, quantity: quantity });

    updateCartBadge();

    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fas fa-check"></i>';
    btnElement.style.background = '#00aa00';
    setTimeout(() => { 
        btnElement.innerHTML = originalText; 
        btnElement.style.background = 'var(--accent)'; 
        btnElement.closest('.inline-detail').remove();
    }, 1000);
}

function renderCarousel() {
    const track = document.getElementById('model-track');
    const container = document.getElementById('model-carousel-container');
    if(carouselItems.length === 0) return;
    container.style.display = 'block';
    const loopItems = [...carouselItems, ...carouselItems]; 
    loopItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'model-item';
        div.onclick = () => filterFromCarousel(item.link);
        div.innerHTML = `<img src="${item.imageUrl}" alt="Model" loading="lazy">`;
        track.appendChild(div);
    });
}

function filterFromCarousel(linkData) {
    if (!linkData || linkData.trim() === "") return;
    const searchTerms = linkData.split(',').map(term => term.trim().toLowerCase());
    const filtered = storeProducts.filter(p => searchTerms.includes(p.id.toLowerCase()) || searchTerms.includes(p.category.toLowerCase()));

    document.getElementById('main-hero').style.display = 'none';
    document.getElementById('home-extra-sections').style.display = 'none';
    closeAllViews();
    renderGrid(filtered, mainGrid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSearch() {
    const searchBar = document.getElementById('search-bar');
    const searchInput = document.getElementById('search-input');
    if(searchBar.style.display === 'flex') {
        searchBar.style.display = 'none';
        searchInput.value = '';
        document.getElementById('main-hero').style.display = 'block';
        document.getElementById('home-extra-sections').style.display = 'block';
        filterProducts('All');
    } else {
        searchBar.style.display = 'flex';
        searchInput.focus();
        window.scrollTo(0, 0);
    }
}

function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.getElementById('main-hero').style.display = 'none';
    document.getElementById('home-extra-sections').style.display = 'none';
    const filtered = storeProducts.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));

    if(catalogView.style.display === 'none') {
        closeAllViews(); 
        document.getElementById('main-hero').style.display = 'none';
        document.getElementById('home-extra-sections').style.display = 'none';
    }
    renderGrid(filtered, mainGrid);
}

function filterProducts(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('main-hero').style.display = 'block';
    document.getElementById('home-extra-sections').style.display = 'block';
    renderGrid(category === 'All' ? storeProducts : storeProducts.filter(p => p.category === category), mainGrid);
}

function closeAllViews() {
    cartView.style.display = 'none';
    catalogView.style.display = 'block';
    document.getElementById('main-hero').style.display = 'block';
    document.getElementById('home-extra-sections').style.display = 'block';
    window.scrollTo(0, 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    badge.innerText = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
}

function openCart() {
    renderCart();
    catalogView.style.display = 'none';
    cartView.style.display = 'block';
    window.scrollTo(0, 0);
}

function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(item => item.id !== productId.toString());
    updateCartBadge();
    renderCart();
}

// === NEW: Image Preview Function ===
function previewReceipt(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('receipt-preview-container');
    const previewImage = document.getElementById('receipt-preview');
    
    if (file) {
        previewImage.src = URL.createObjectURL(file); 
        previewContainer.style.display = 'block';     
    } else {
        previewImage.src = '';
        previewContainer.style.display = 'none';
    }
}

// === NEW: Copy Phone Number Function ===
function copyPhoneNumber(btnElement) {
    const phoneElement = document.getElementById('kbz-phone');
    if (!phoneElement) return;
    
    // Grabs text and removes spaces so it pastes perfectly into the KBZPay app
    const phoneText = phoneElement.innerText.replace(/\s+/g, '');
    
    navigator.clipboard.writeText(phoneText).then(() => {
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-check"></i>';
        btnElement.classList.add('copied');
        
        // Revert back to copy icon after 2 seconds
        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Failed to copy phone number.");
    });
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-price');
    const depositDisplay = document.getElementById('deposit-amount'); 
    container.innerHTML = '';

    if (shoppingCart.length === 0) {
        container.innerHTML = '<p style="color: #aaa;">Your cart is empty.</p>';
        totalDisplay.innerText = '$0.00';
        if(depositDisplay) depositDisplay.innerText = '$0.00';
        return;
    }

    let grandTotal = 0;
    shoppingCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4 style="font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: #fff;">${item.name}</h4>
                    <p>Qty: ${item.quantity} x $${item.price.toFixed(2)}</p>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
                <div class="cart-item-price">
                    <strong style="color: #fff;">$${itemTotal.toFixed(2)}</strong>
                </div>
            </div>`;
    });

    totalDisplay.innerText = `$${grandTotal.toFixed(2)}`;

    if(depositDisplay) {
        const deposit = grandTotal / 2;
        depositDisplay.innerText = `$${deposit.toFixed(2)}`;
    }
}

// === UPDATED: Checkout Logic with Validation ===
function processCheckout(platform) {
    if (shoppingCart.length === 0) return alert("Your cart is empty!");

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const receiptInput = document.getElementById('kbz-receipt');
    const trxInput = document.getElementById('kbz-trx');
    const trx = trxInput ? trxInput.value.trim() : ""; 

    if (!name || !phone || !address) {
        return alert("Please fill out all delivery details.\n(ပို့ဆောင်ရမည့် အချက်အလက်များကို ပြည့်စုံစွာဖြည့်ပေးပါ။)");
    }

    if (!receiptInput || receiptInput.files.length === 0) {
        return alert("⚠️ Please upload your KBZPay transaction screenshot.\n(ငွေလွှဲပြေစာ ဓာတ်ပုံထည့်သွင်းပေးပါ။)");
    }

    if (!/^\d{5}$/.test(trx)) {
        return alert("⚠️ Please enter exactly the last 5 digits of your KBZPay Transaction ID.\n(Transaction ID ၏ နောက်ဆုံးဂဏန်း ၅ လုံးကို မှန်ကန်စွာထည့်ပါ။)");
    }

    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#ff4444', '#ffffff', '#000000'] });

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const hh = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');

    const orderId = `ORD-${yy}${mm}${dd}-${hh}${mins}${ss}`; 

    let grandTotal = 0;
    let itemsText = "";

    shoppingCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        itemsText += `- ${item.quantity}x ${item.name} ($${itemTotal.toFixed(2)})\n`;
    });

    const deposit = grandTotal / 2;

    const orderMessage = `🛍️ NEW ORDER: #${orderId}\n\n🛒 ITEMS:\n${itemsText}\n💰 TOTAL: $${grandTotal.toFixed(2)}\n💸 DEPOSIT PAID: $${deposit.toFixed(2)} (KBZPay)\n🔢 TRX LAST 5 DIGITS: ${trx}\n\n👤 CUSTOMER DETAILS:\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n[ကျွန်တော် ငွေလွှပြေစာပုံကို အောက်တွင် ထပ်တွဲပေးပါမည်။]]`;

    const encodedMessage = encodeURIComponent(orderMessage);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        alert("✅ Order Details Saved!\n\nIMPORTANT: When the chat opens, please click the 'Paperclip' or 'Gallery' icon to attach the screenshot you just took.\n\n(Chat ပွင့်လာပါက သင်၏ ငွေလွှဲပြေစာပုံကို ပူးတွဲပို့ဆောင်ပေးပါ။)");
        if (platform === 'telegram') {
            window.open(`https://t.me/+${STORE_PHONE}?text=${encodedMessage}`, '_blank');
        } else if (platform === 'viber') {
            window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_blank');
        }
    } else {
        navigator.clipboard.writeText(orderMessage).then(() => {
            alert("✅ Order copied to clipboard! \n\nIMPORTANT: Please PASTE the text into the chat, and manually ATTACH the KBZPay screenshot from your computer.\n\n(Chat ပွင့်လာပါက စာကို Paste လုပ်ပြီး ငွေလွှဲပြေစာပုံကို ပူးတွဲပို့ဆောင်ပေးပါ။)");

            if (platform === 'telegram') {
                window.open(`tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, '_self');
            } else if (platform === 'viber') {
                window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_self');
            }
        }).catch(err => {
            if (platform === 'telegram') {
                window.open(`tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, '_self');
            } else if (platform === 'viber') {
                window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_self');
            }
        });
    }
}
