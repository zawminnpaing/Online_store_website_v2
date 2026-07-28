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
    const taggedProducts = allProducts.filter(p => p.tags.some(t => t.toLowerCase() === targetTag.toLowerCase()));
    if (taggedProducts.length > 0) return taggedProducts.slice(0, limit);

    const fallbackProducts = [];
    const seenSubCategories = new Set();
    for (const p of allProducts) {
        const groupingKey = p.subCategory ? p.subCategory.trim() : p.category.trim(); 
        if (!seenSubCategories.has(groupingKey)) {
            seenSubCategories.add(groupingKey);
            fallbackProducts.push(p);
        }
        if (fallbackProducts.length === limit) break;
    }
    return fallbackProducts;
}

function renderGrid(productsArray, container) {
    container.innerHTML = ''; 
    productsArray.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = `product-card-${product.id}`;
        
        let badgesHTML = '<div class="badge-container">';
        product.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            let badgeClass = ''; 
            if (tagLower.includes('%') || tagLower.includes('off')) badgeClass = 'badge-discount';
            else if (tagLower === 'new') badgeClass = 'badge-new';
            else if (tagLower === 'trending') badgeClass = 'badge-trending';
            badgesHTML += `<span class="product-badge ${badgeClass}">${tag}</span>`;
        });
        badgesHTML += '</div>';

        let priceHTML = product.discountPrice 
            ? `<p class="product-price"><span class="old-price">$${product.price.toFixed(2)}</span> <span class="sale-price">$${product.discountPrice.toFixed(2)}</span></p>`
            : `<p class="product-price">$${product.price.toFixed(2)}</p>`;

        // Thumbnails generation for expanded view
        let thumbsHTML = product.images.map(img => 
            `<img src="${img}" onclick="document.getElementById('main-img-${product.id}').src='${img}'">`
        ).join('');

        card.innerHTML = `
            <!-- Standard Clickable Area -->
            <div class="card-standard" onclick="toggleProduct('${product.id}')">
                ${product.tags.length > 0 ? badgesHTML : ''}
                <div class="img-container">
                    <img src="${product.images[0]}" class="grid-img" loading="lazy">
                </div>
                <div class="product-info">
                    <p class="product-brand">${product.category}</p>
                    <h3 class="product-title">${product.name}</h3>
                    ${priceHTML}
                </div>
            </div>

            <!-- Inline Expanded Details -->
            <div class="card-expanded">
                <div class="expanded-gallery">
                    <img src="${product.images[0]}" class="expanded-main-img" id="main-img-${product.id}">
                    <div class="expanded-thumbnails">${thumbsHTML}</div>
                </div>
                
                <div class="expanded-info">
                    <button class="close-expanded" onclick="toggleProduct('${product.id}', event)"><i class="fas fa-times"></i></button>
                    <p class="product-brand">${product.category}</p>
                    <h2>${product.name}</h2>
                    ${priceHTML}
                    <p class="expanded-desc">${product.description}</p>
                    
                    <div class="expanded-actions">
                        <div class="qty-selector">
                            <button onclick="changeQty('${product.id}', -1)">-</button>
                            <input type="number" id="qty-${product.id}" value="1" readonly>
                            <button onclick="changeQty('${product.id}', 1)">+</button>
                        </div>
                        <button class="add-to-cart-btn" id="btn-${product.id}" onclick="addToCart('${product.id}')">
                            Add to Cart <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// === NEW INLINE TOGGLE LOGIC ===
function toggleProduct(id, event) {
    if (event) event.stopPropagation(); // Prevents double firing if close button is clicked

    const targetCard = document.getElementById(`product-card-${id}`);
    const isAlreadyOpen = targetCard.classList.contains('is-open');

    // Close all cards first to keep UI clean
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('is-open');
        card.querySelector('.card-standard').style.display = 'block';
    });

    // If the card wasn't already open, open it now
    if (!isAlreadyOpen) {
        targetCard.classList.add('is-open');
        targetCard.querySelector('.card-standard').style.display = 'none'; // Hide small view
        
        // Slight scroll adjustment to bring details into view
        setTimeout(() => {
            const yOffset = -80; // Offset for sticky nav
            const y = targetCard.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }, 150);
    }
}

function changeQty(id, amount) {
    const qtyInput = document.getElementById(`qty-${id}`);
    let newVal = parseInt(qtyInput.value) + amount;
    if (newVal >= 1) qtyInput.value = newVal;
}

function addToCart(id) {
    const quantity = parseInt(document.getElementById(`qty-${id}`).value);
    const product = storeProducts.find(p => p.id === id);
    const existingItem = shoppingCart.find(item => item.id === id);
    const activePrice = product.discountPrice ? product.discountPrice : product.price;

    if (existingItem) existingItem.quantity += quantity;
    else shoppingCart.push({ id: product.id, name: product.name, price: activePrice, quantity: quantity });

    updateCartBadge();
    
    // Feedback animation
    const btn = document.getElementById(`btn-${id}`);
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Added! <i class="fas fa-check"></i>';
    btn.style.background = '#4a6659';
    setTimeout(() => { btn.innerHTML = originalText; btn.style.background = 'var(--accent)'; }, 1500);
}

// === CART & CHECKOUT LOGIC ===
function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    badge.innerText = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
    badge.classList.remove('bump');
    void badge.offsetWidth; 
    badge.classList.add('bump');
}

function openCart() {
    renderCart();
    catalogView.style.display = 'none';
    cartView.style.display = 'block';
    window.scrollTo(0, 0);
}

function closeCart() {
    cartView.style.display = 'none';
    catalogView.style.display = 'block';
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
        container.innerHTML = '<p>Your cart is empty.</p>';
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
                    <h4 style="font-family:'Outfit'; font-weight:500;">${item.name}</h4>
                    <p style="color:var(--text-light); font-size:0.9rem;">Qty: ${item.quantity} x $${item.price.toFixed(2)}</p>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
                <div class="cart-item-price"><strong>$${itemTotal.toFixed(2)}</strong></div>
            </div>`;
    });
    totalDisplay.innerText = `$${grandTotal.toFixed(2)}`;
}

// Check if user is on mobile for fallback routing
const isMobileUser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function processCheckout(platform) {
    if (shoppingCart.length === 0) return alert("Your cart is empty!");

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    if (!name || !phone || !address) return alert("Please fill out all delivery details.");

    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#2C302E', '#9A8C73', '#F9F8F6'] });

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
        grandTotal += (item.price * item.quantity);
        itemsText += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });

    const orderMessage = `🛍️ NEW ORDER: #${orderId}\n\n🛒 ITEMS:\n${itemsText}💰 TOTAL: $${grandTotal.toFixed(2)}\n\n👤 CUSTOMER DETAILS:\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`;
    const encodedMessage = encodeURIComponent(orderMessage);

    // Bulletproof Clipboard Safety Net
    navigator.clipboard.writeText(orderMessage).then(() => {
        if (!isMobileUser) alert("Order copied to clipboard! 📋\n\nPlease PASTE the message into the chat if it doesn't load fully.");
        
        if (platform === 'telegram') {
            window.open(isMobileUser ? `https://t.me/+${STORE_PHONE}?text=${encodedMessage}` : `tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, isMobileUser ? '_blank' : '_self');
        } else if (platform === 'viber') {
            window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, isMobileUser ? '_blank' : '_self');
        }
    }).catch(() => {
        if (platform === 'telegram') {
             window.open(isMobileUser ? `https://t.me/+${STORE_PHONE}?text=${encodedMessage}` : `tg://resolve?phone=${STORE_PHONE}&text=${encodedMessage}`, isMobileUser ? '_blank' : '_self');
        } else if (platform === 'viber') {
             window.open(`viber://chat?number=%2B${STORE_PHONE}&draft=${encodedMessage}`, isMobileUser ? '_blank' : '_self');
        }
    });
}

// Carousel and Search logic remains standard
function renderCarousel() {
    const track = document.getElementById('model-track');
    const container = document.getElementById('model-carousel-container');
    if(carouselItems.length === 0) return;
    container.style.display = 'block';
    [...carouselItems, ...carouselItems].forEach(item => {
        const div = document.createElement('div');
        div.className = 'model-item';
        div.onclick = () => filterFromCarousel(item.link);
        div.innerHTML = `<img src="${item.imageUrl}" loading="lazy">`;
        track.appendChild(div);
    });
}

function filterFromCarousel(linkData) {
    if (!linkData || linkData.trim() === "") return;
    const searchTerms = linkData.split(',').map(t => t.trim().toLowerCase());
    const filtered = storeProducts.filter(p => searchTerms.includes(p.id.toLowerCase()) || searchTerms.includes(p.category.toLowerCase()));
    
    document.getElementById('main-hero').style.display = 'none';
    document.getElementById('home-extra-sections').style.display = 'none';
    closeCart();
    renderGrid(filtered, mainGrid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSearch() {
    const s = document.getElementById('search-bar');
    if(s.style.display === 'flex') {
        s.style.display = 'none';
        document.getElementById('search-input').value = '';
        filterProducts('All');
    } else {
        s.style.display = 'flex';
        document.getElementById('search-input').focus();
        window.scrollTo(0, 0);
    }
}

function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.getElementById('main-hero').style.display = 'none';
    document.getElementById('home-extra-sections').style.display = 'none';
    renderGrid(storeProducts.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)), mainGrid);
}

function filterProducts(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('main-hero').style.display = 'block';
    document.getElementById('home-extra-sections').style.display = 'block';
    renderGrid(category === 'All' ? storeProducts : storeProducts.filter(p => p.category === category), mainGrid);
}
