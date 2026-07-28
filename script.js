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

// === NEW: GALLERY INLINE EXPANSION VIEW ===
function openProductInline(productId, cardElement) {
    document.querySelectorAll('.inline-detail').forEach(el => el.remove());

    const product = storeProducts.find(p => p.id === productId.toString());
    if (!product) return;

    const activePrice = product.discountPrice ? product.discountPrice : product.price;

    // Generate thumbnails for the gallery
    let thumbnailsHTML = '';
    product.images.forEach(imgUrl => {
        // We use onclick to swap the src of the main image
        thumbnailsHTML += `<img src="${imgUrl}" onclick="document.getElementById('main-img-${product.id}').src='${imgUrl}'" alt="${product.name} thumbnail">`;
    });

    const detailDiv = document.createElement('div');
    detailDiv.className = 'inline-detail';
    detailDiv.innerHTML = `
        <div class="inline-gallery">
            <img src="${product.images[0]}" class="main-inline-img" id="main-img-${product.id}" alt="${product.name}">
            <div class="inline-thumbnails">
                ${thumbnailsHTML}
            </div>
        </div>
        <div class="inline-info-wrapper">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; margin: 0 0 0.5rem 0; color: #fff;">${product.name}</h2>
                    <button class="close-inline-btn" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p style="font-size: 1.3rem; font-weight: 500; margin-bottom: 1rem; color: var(--accent);">$${activePrice.toFixed(2)}</p>
                <p class="inline-desc">${product.description || 'Premium selection from Luxe Elite. Crafted with excellence for the modern aesthetic.'}</p>
            </div>
            
            <div class="inline-controls">
                <div class="qty-selector">
                    <button onclick="changeQtyInline(-1, this)">-</button>
                    <input type="number" class="inline-qty" value="1" min="1" readonly>
                    <button onclick="changeQtyInline(1, this)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addInlineToCart('${product.id}', this)">
                    Add to Cart <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
        </div>
    `;

    cardElement.after(detailDiv);
    detailDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    btnElement.innerHTML = 'Added! <i class="fas fa-check"></i>';
    btnElement.style.background = '#00aa00';
    setTimeout(() => { 
        btnElement.innerHTML = originalText; 
        btnElement.style.background = 'var(--accent)'; 
        btnElement.closest('.inline-detail').remove();
    }, 1000);
}

// === UTILITY LOGIC ===
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

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-price');
    container.innerHTML = '';
    
    if (shoppingCart.length === 0) {
        container.innerHTML = '<p style="color: #aaa;">Your cart is empty.</p>';
        totalDisplay.innerText = '$0.00';
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
}

// === CHECKOUT: FIXED MOBILE vs DESKTOP LOGIC ===
function processCheckout(platform) {
    if (shoppingCart.length === 0) return alert("Your cart is empty!");

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    if (!name || !phone || !address) return alert("Please fill out all delivery details.");

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

    const orderMessage = `🛍️ NEW ORDER: #${orderId}\n\n🛒 ITEMS:\n${itemsText}💰 TOTAL: $${grandTotal.toFixed(2)}\n\n👤 CUSTOMER DETAILS:\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`;
    const encodedMessage = encodeURIComponent(orderMessage);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // FIXED: Mobile phones bypass the clipboard completely so they don't get blocked by popup security rules.
    if (isMobile) {
        if (platform === 'telegram') {
            window.open(`https://t.me/+${STORE_PHONE}?text=${encodedMessage}`, '_blank');
        } else if (platform === 'viber') {
            window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_blank');
        }
    } else {
        // Desktop computers use the clipboard trick to avoid truncation limits
        navigator.clipboard.writeText(orderMessage).then(() => {
            alert("Order copied to clipboard! 📋\n\nPlease PASTE the message into the chat if it doesn't load fully.");
            
            if (platform === 'telegram') {
                window.open(`tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, '_self');
            } else if (platform === 'viber') {
                window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_self');
            }
        }).catch(err => {
            // Backup
            if (platform === 'telegram') {
                window.open(`tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, '_self');
            } else if (platform === 'viber') {
                window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, '_self');
            }
        });
    }
}
