// Estado global
let allProducts = [];
let filteredProducts = [];
let categories = new Set();
let cart = [];
let displayedProductsCount = 60; // Mostrar 60 productos inicialmente (10 filas x 6 cols)
const PRODUCTS_PER_PAGE = 60;

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const featuredFilter = document.getElementById('featuredFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const productCount = document.getElementById('productCount');
const productModal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.querySelector('.modal-close');

// Cart elements
const cartIcon = document.getElementById('cartIcon');
const cartBadge = document.getElementById('cartBadge');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartBody = document.getElementById('cartBody');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const sendWhatsAppBtn = document.getElementById('sendWhatsApp');
const clearCartBtn = document.getElementById('clearCart');

// Cargar productos
async function loadProducts() {
    try {
        // Show skeleton loading instead of spinner
        renderSkeletons(60);
        loading.style.display = 'none';
        
        // Cargar datos desde Supabase usando la vista pública (ProductosPublicos)
        const { data, error } = await supabase
            .from('ProductosPublicos')
            .select('*');
        
        if (error) {
            console.error('Error al cargar desde Supabase:', error);
            throw error;
        }
        
        // ProductosPublicos solo devuelve productos con IMAGEN=true, así que no necesitamos validar
        // También precomputamos __search para que el filtro sea más rápido.
        allProducts = (data || []).map(product => {
            const sku = String(product.SKU || '');
            const description = String(product.DESCRIPCIÓN || '');
            const category = String(product.CATEGORÍA || '');

            return {
                ...product,
                image_path: `Todos/${sku}.webp`,
                __search: normalizeSearchText(`${sku} ${description} ${category}`)
            };
        });
        
        // Extraer categorías únicas
        allProducts.forEach(product => {
            const category = product.CATEGORÍA;
            if (category && category !== 'SIN CATEGORÍA' && category !== '-') {
                categories.add(category);
            }
        });
        
        // Ordenar categorías y agregar al select
        const sortedCategories = Array.from(categories).sort();
        sortedCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        filteredProducts = [...allProducts];
        
        // Hide skeletons before rendering real products
        hideSkeletons();
        
        renderProducts();
        updateProductCount();
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error cargando productos:', error);
        hideSkeletons();
        loading.style.display = 'block';
        loading.innerHTML = '<p>Error al cargar los productos. Por favor, recarga la página.</p>';
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function normalizePrice(value) {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'null') return null;
    const num = Number.parseFloat(str.replace(',', '.'));
    if (!Number.isFinite(num) || num === 0) return null;
    return num;
}

// Formatear precio
function formatPrice(price) {
    const priceNum = normalizePrice(price);
    if (priceNum === null) return 'Consultar precio';
    return `S/ ${priceNum.toFixed(2)}`;
}



// Renderizar productos
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    // Mostrar solo los primeros displayedProductsCount productos
    const productsToShow = filteredProducts.slice(0, displayedProductsCount);
    
    const searchTerm = searchInput.value.trim();

    const cartQuantityByCode = new Map(cart.map(item => [String(item.code), item.quantity]));
    
    productsGrid.innerHTML = productsToShow.map(product => {
        const code = String(product.SKU || '');
        const name = String(product.DESCRIPCIÓN || 'Sin nombre');
        const price = product.VENTA;
        const featured = product.DESTACADO === 'SI' || product.DESTACADO === 'SÍ';
        
        // Obtener cantidad en carrito para este producto
        const cartQuantity = cartQuantityByCode.get(code) || 0;

        const safeCode = escapeHTML(code);
        const safeName = escapeHTML(name);
        
        // Apply search highlighting
        const highlightedCode = highlightText(safeCode, searchTerm);
        const highlightedName = highlightText(safeName, searchTerm);
        
        return `
            <div class="product-card" data-action="open-modal" data-code="${safeCode}">
                <button class="add-to-cart-btn" type="button" data-action="add-to-cart" data-code="${safeCode}" title="Agregar al carrito">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </button>
                ${cartQuantity > 0 ? `<span class="product-quantity-badge">${cartQuantity}</span>` : ''}
                ${featured ? '<span class="product-badge">Destacado</span>' : ''}
                <div class="product-image-container">
                    <img src="${product.image_path}" alt="${safeName}" class="product-image" loading="lazy" decoding="async">
                    <div class="product-image-placeholder" hidden>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-code">Código: ${highlightedCode}</div>
                    <h3 class="product-name">${highlightedName}</h3>
                    <div class="product-footer">
                        <div class="product-price">${formatPrice(price)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Actualizar contador de productos
function updateProductCount() {
    const count = filteredProducts.length;
    const showing = Math.min(displayedProductsCount, filteredProducts.length);
    productCount.textContent = `Mostrando ${showing} de ${count} producto${count !== 1 ? 's' : ''}`;
}

// Filtrar productos
function filterProducts() {
    const searchTerm = normalizeSearchText(searchInput.value);
    const selectedCategory = categoryFilter.value;
    const selectedFeatured = featuredFilter.value;
    
    // Reset al filtrar
    displayedProductsCount = PRODUCTS_PER_PAGE;
    
    filteredProducts = allProducts.filter(product => {
        const haystack = product.__search || normalizeSearchText([
            product.SKU,
            product.DESCRIPCIÓN,
            product.CATEGORÍA
        ].filter(Boolean).join(' '));

        const matchesSearch = !searchTerm || haystack.includes(searchTerm);
        
        // Filtro por categoría
        const matchesCategory = !selectedCategory || product.CATEGORÍA === selectedCategory;
        
        // Filtro por destacados
        const featured = product.DESTACADO === 'SI' || product.DESTACADO === 'SÍ';
        const matchesFeatured = !selectedFeatured || (selectedFeatured === 'yes' && featured);
        
        // Ya no necesitamos filtrar por imagen: ProductosPublicos solo devuelve productos con IMAGEN=true
        return matchesSearch && matchesCategory && matchesFeatured;
    });
    
    renderProducts();
    updateProductCount();
}

// Abrir modal de producto
function openProductModal(code) {
    const product = allProducts.find(p => 
        (p.SKU || '').toString() === code.toString()
    );
    
    if (!product) return;
    
    const name = String(product.DESCRIPCIÓN || 'Sin nombre');
    const category = String(product.CATEGORÍA || 'SIN CATEGORÍA');
    const price = product.VENTA;
    const featured = product.DESTACADO === 'SI' || product.DESTACADO === 'SÍ';

    const safeName = escapeHTML(name);
    const safeCategory = escapeHTML(category);
    const safeCode = escapeHTML(code);
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-image-container">
                <img src="${product.image_path}" alt="${safeName}" class="modal-image" loading="lazy" decoding="async">
                <div class="product-image-placeholder" hidden>
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </div>
            </div>
            <div class="modal-info">
                ${featured ? '<span class="product-badge">Destacado</span>' : ''}
                <h2>${safeName}</h2>
                <div class="product-code">Código: ${safeCode}</div>
                <div class="modal-price">${formatPrice(price)}</div>
                <div class="modal-details">
                    <div class="detail-row">
                        <span class="detail-label">Categoría:</span>
                        <span class="detail-value">${safeCategory}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    productModal.classList.add('show');
    productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeModal() {
    productModal.classList.remove('show');
    productModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Event listeners (search has debounce, added later)
categoryFilter.addEventListener('change', filterProducts);
featuredFilter.addEventListener('change', filterProducts);
clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    featuredFilter.value = '';
    filterProducts();
});

modalClose.addEventListener('click', closeModal);
productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
        closeModal();
    }
});

// Delegación de eventos para productos (evita onclick inline)
productsGrid.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl || !productsGrid.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    const code = actionEl.dataset.code || actionEl.closest('.product-card')?.dataset.code;
    if (!code) return;

    if (action === 'add-to-cart') {
        e.stopPropagation();
        addToCart(code);
        return;
    }

    if (action === 'open-modal') {
        openProductModal(code);
    }
});

// Fallback de imágenes (error no burbujea, usar captura)
document.addEventListener('error', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLImageElement)) return;

    const placeholder = el.nextElementSibling;
    if (placeholder && placeholder.classList.contains('product-image-placeholder')) {
        el.style.display = 'none';
        placeholder.hidden = false;
    }
}, true);

// Smooth scroll para navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== CARRITO DE COMPRAS ==========

// Cargar carrito desde localStorage
function loadCart() {
    const savedCart = localStorage.getItem('vidraPlasticCart');
    if (savedCart) {
        try {
            const cartData = JSON.parse(savedCart);
            
            // Verificar si tiene timestamp (nuevo formato)
            if (cartData.timestamp) {
                const daysPassed = (Date.now() - cartData.timestamp) / (1000 * 60 * 60 * 24);
                
                if (daysPassed <= 30) {
                    cart = cartData.items;
                    updateCartUI();
                } else {
                    // Carrito expirado después de 30 días de inactividad
                    localStorage.removeItem('vidraPlasticCart');
                    showToast('Tu carrito expiró después de 30 días de inactividad', 'info');
                }
            } else {
                // Formato antiguo (sin timestamp), migrar y mantener
                cart = Array.isArray(cartData) ? cartData : [];
                saveCart(); // Guardar con nuevo formato
                updateCartUI();
            }
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            localStorage.removeItem('vidraPlasticCart');
        }
    }
}

// Guardar carrito en localStorage con timestamp actualizado
function saveCart() {
    localStorage.setItem('vidraPlasticCart', JSON.stringify({
        items: cart,
        timestamp: Date.now() // Actualiza con cada modificación
    }));
}

// Agregar producto al carrito
function addToCart(productCode) {
    const product = allProducts.find(p => 
        (p.SKU || '').toString() === productCode.toString()
    );
    
    if (!product) return;
    
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => String(item.code) === String(productCode));
    
    const productName = product.DESCRIPCIÓN || 'Sin nombre';
    
    if (existingItem) {
        // Si ya existe, aumentar cantidad
        existingItem.quantity += 1;
        showToast(`${productName} (x${existingItem.quantity})`, 'success');
    } else {
        // Si no existe, agregar nuevo
        const price = normalizePrice(product.VENTA);
        
        cart.push({
            code: productCode,
            name: productName,
            price: price,
            quantity: 1,
            imagePath: product.image_path // BD garantiza que siempre hay imagen
        });
        
        showToast(`${productName} agregado al carrito`, 'success');
    }
    
    saveCart();
    updateCartUI();
    showCartNotification();
}

// Mostrar notificación visual (breve animación)
function showCartNotification() {
    cartBadge.style.transform = 'scale(1.3)';
    setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
    }, 200);
}

// Actualizar cantidad de un producto
function updateCartItemQuantity(productCode, newQuantity) {
    const item = cart.find(item => String(item.code) === String(productCode));
    
    if (!item) return;

    const qty = Number.parseInt(newQuantity, 10);
    if (!Number.isFinite(qty)) return;
    
    if (qty < 1) {
        removeFromCart(productCode);
        return;
    }
    
    item.quantity = qty;
    saveCart();
    updateCartUI();
}

// Eliminar producto del carrito
function removeFromCart(productCode) {
    const item = cart.find(item => String(item.code) === String(productCode));
    const productName = item ? item.name : 'Producto';
    
    cart = cart.filter(item => String(item.code) !== String(productCode));
    saveCart();
    updateCartUI();
    
    showToast(`${productName} eliminado del carrito`, 'info');
}

// Vaciar carrito completo
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        cart = [];
        saveCart();
        updateCartUI();
        showToast('Carrito vaciado', 'info');
    }
}

// Actualizar badges individuales en las tarjetas de productos
function updateProductBadges() {
    // Recorrer todas las tarjetas de productos visibles
    const productCards = document.querySelectorAll('.product-card[data-code]');
    const cartQuantityByCode = new Map(cart.map(item => [String(item.code), item.quantity]));
    
    productCards.forEach(card => {
        const productCode = card.dataset.code;
        const quantity = cartQuantityByCode.get(String(productCode)) || 0;
        
        // Buscar o crear el badge
        let badge = card.querySelector('.product-quantity-badge');
        
        if (quantity > 0) {
            if (!badge) {
                // Crear el badge si no existe
                badge = document.createElement('span');
                badge.className = 'product-quantity-badge';
                card.appendChild(badge);
            }
            badge.textContent = quantity;
        } else {
            // Eliminar el badge si la cantidad es 0
            if (badge) {
                badge.remove();
            }
        }
    });
}

// Actualizar UI del carrito
function updateCartUI() {
    // Actualizar badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
    
    // Actualizar badges individuales sin re-renderizar todo
    updateProductBadges();
    
    // Actualizar contenido del panel
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos para comenzar</p>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        cartBody.innerHTML = cart.map(item => {
            const safeName = escapeHTML(item.name);
            const safeCode = escapeHTML(item.code);
            const safeImg = item.imagePath ? escapeHTML(item.imagePath) : '';
            return `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.imagePath 
                        ? `<img src="${safeImg}" alt="${safeName}" loading="lazy" decoding="async">`
                        : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                               <circle cx="8.5" cy="8.5" r="1.5"></circle>
                               <polyline points="21 15 16 10 5 21"></polyline>
                           </svg>`
                    }
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${safeName}</div>
                    <div class="cart-item-code">Código: ${safeCode}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" type="button" data-action="decrease" data-code="${safeCode}">−</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                data-action="quantity-input" data-code="${safeCode}">
                            <button class="quantity-btn" type="button" data-action="increase" data-code="${safeCode}">+</button>
                        </div>
                        <button class="remove-item-btn" type="button" data-action="remove" data-code="${safeCode}" title="Eliminar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
        
        // Calcular y mostrar total
        const totals = cart.map(item => {
            const unit = normalizePrice(item.price);
            return unit === null ? null : unit * item.quantity;
        });
        const hasUnknown = totals.some(v => v === null);
        const totalKnown = totals.reduce((sum, v) => sum + (v || 0), 0);
        cartTotal.textContent = hasUnknown ? 'Consultar' : `S/ ${totalKnown.toFixed(2)}`;
        cartFooter.style.display = 'block';
    }
}

// Delegación de eventos del carrito (evita onclick inline)
cartBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || !cartBody.contains(btn)) return;

    const action = btn.dataset.action;
    const code = btn.dataset.code;
    if (!code) return;

    const item = cart.find(i => String(i.code) === String(code));
    if (!item) return;

    if (action === 'decrease') {
        updateCartItemQuantity(code, item.quantity - 1);
    } else if (action === 'increase') {
        updateCartItemQuantity(code, item.quantity + 1);
    } else if (action === 'remove') {
        removeFromCart(code);
    }
});

cartBody.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.classList.contains('quantity-input')) return;

    const code = input.dataset.code;
    if (!code) return;

    updateCartItemQuantity(code, Number.parseInt(input.value, 10) || 1);
});

// Abrir panel del carrito
function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('show');
    cartPanel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

// Cerrar panel del carrito
function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('show');
    cartPanel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Enviar pedido por WhatsApp
function sendWhatsAppOrder() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    // Construir mensaje
    let message = '¡Hola! Quiero hacer un pedido:\n\n';
    
    cart.forEach((item, index) => {
        const unit = normalizePrice(item.price);
        const subtotal = unit === null ? null : unit * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   Código: ${item.code}\n`;
        message += `   Cantidad: ${item.quantity}x - ${formatPrice(item.price)}\n`;
        message += `   Subtotal: ${subtotal === null ? 'Consultar precio' : formatPrice(subtotal)}\n\n`;
    });
    
    const totals = cart.map(item => {
        const unit = normalizePrice(item.price);
        return unit === null ? null : unit * item.quantity;
    });
    const hasUnknown = totals.some(v => v === null);
    const totalKnown = totals.reduce((sum, v) => sum + (v || 0), 0);
    message += hasUnknown ? `*Total: Consultar*` : `*Total: S/ ${totalKnown.toFixed(2)}*`;
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '51989394769';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Vaciar carrito después de enviar pedido
    localStorage.removeItem('vidraPlasticCart');
    cart = [];
    updateCartUI();
    closeCart();
    showToast('Pedido enviado por WhatsApp. Carrito vaciado', 'success');
}

// Event listeners del carrito
cartIcon.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
sendWhatsAppBtn.addEventListener('click', sendWhatsAppOrder);
clearCartBtn.addEventListener('click', clearCart);

// Global ESC key handler for modal and cart
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (productModal.classList.contains('show')) {
            closeModal();
        } else if (cartPanel.classList.contains('open')) {
            closeCart();
        }
    }
});

// ========== TOAST NOTIFICATIONS ==========
let activeToastTimeout = null;
let activeToast = null;

function showToast(message, type = 'success', duration = 2250) {
    const toastContainer = document.getElementById('toastContainer');
    
    // Si ya hay un toast activo, removerlo inmediatamente
    if (activeToast) {
        clearTimeout(activeToastTimeout);
        activeToast.remove();
        activeToast = null;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.innerHTML = icon[type] || '';

    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(messageSpan);
    
    toastContainer.appendChild(toast);
    activeToast = toast;
    
    // Auto remove after duration
    activeToastTimeout = setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
            if (activeToast === toast) activeToast = null;
        }, 300);
    }, duration);
}

// ========== HAMBURGER MENU ==========
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    menuToggle.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', mainNav.classList.contains('active') ? 'true' : 'false');
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
});

// Close menu when clicking nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !menuToggle.contains(e.target) && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
});

// ========== SKELETON LOADING ==========
function renderSkeletons(count = 60) {
    productsGrid.innerHTML = Array(count).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>
    `).join('');
}

function hideSkeletons() {
    const skeletons = document.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());
}

// ========== SEARCH DEBOUNCE WITH HIGHLIGHT ==========
const DEBOUNCE_DELAY = 300;

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    // Escape special regex characters
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// Apply debounce to search input
searchInput.addEventListener('input', debounce(filterProducts, DEBOUNCE_DELAY));

// ========== INFINITE SCROLL ==========
let isLoadingMore = false;

function handleInfiniteScroll() {
    if (isLoadingMore || displayedProductsCount >= filteredProducts.length) return;
    
    // Check if user is near bottom (80% scrolled)
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight * 0.8;
    
    if (scrollPosition >= threshold) {
        isLoadingMore = true;
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-more';
        loadingIndicator.textContent = 'Cargando más productos...';
        productsGrid.insertAdjacentElement('afterend', loadingIndicator);
        
        setTimeout(() => {
            displayedProductsCount += PRODUCTS_PER_PAGE;
            renderProducts();
            loadingIndicator.remove();
            isLoadingMore = false;
        }, 500);
    }
}

window.addEventListener('scroll', debounce(handleInfiniteScroll, 100));

// Inicializar
loadCart();
loadProducts();
