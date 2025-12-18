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
        allProducts = (data || []).map(product => ({
            ...product,
            image_path: `Todos/${product.SKU}.webp`
        }));
        
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
        loading.innerHTML = '<p>Error al cargar los productos. Por favor, recarga la página.</p>';
    }
}

// Formatear precio
function formatPrice(price) {
    if (!price || price === null || price === 'null') {
        return 'Consultar precio';
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
        return 'Consultar precio';
    }
    
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
    
    productsGrid.innerHTML = productsToShow.map(product => {
        const code = product.SKU || '';
        const name = product.DESCRIPCIÓN || 'Sin nombre';
        const price = product.VENTA;
        const featured = product.DESTACADO === 'SI' || product.DESTACADO === 'SÍ';
        
        // Obtener cantidad en carrito para este producto
        const cartItem = cart.find(item => item.code === code);
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        
        // Apply search highlighting
        const highlightedCode = highlightText(code, searchTerm);
        const highlightedName = highlightText(name, searchTerm);
        
        return `
            <div class="product-card">
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${code}')" title="Agregar al carrito">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </button>
                ${cartQuantity > 0 ? `<span class="product-quantity-badge">${cartQuantity}</span>` : ''}
                ${featured ? '<span class="product-badge">Destacado</span>' : ''}
                <div class="product-image-container" onclick="openProductModal('${code}')">
                    <img src="${product.image_path}" alt="${name}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="product-image-placeholder" style="display:none;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="product-info" onclick="openProductModal('${code}')">
                    <div class="product-code">Código: ${highlightedCode}</div>
                    <h3 class="product-name">${highlightedName}</h3>
                    <div class="product-footer">
                        <div class="product-price">${price ? formatPrice(price) : 'Consultar'}</div>
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
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedFeatured = featuredFilter.value;
    
    // Reset al filtrar
    displayedProductsCount = PRODUCTS_PER_PAGE;
    
    filteredProducts = allProducts.filter(product => {
        // Búsqueda por texto
        const name = (product.DESCRIPCIÓN || '').toLowerCase();
        const code = (product.SKU || '').toString().toLowerCase();
        const category = (product.CATEGORÍA || '').toLowerCase();
        
        const matchesSearch = !searchTerm || 
            name.includes(searchTerm) || 
            code.includes(searchTerm) ||
            category.includes(searchTerm);
        
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
    
    const name = product.DESCRIPCIÓN || 'Sin nombre';
    const category = product.CATEGORÍA || 'SIN CATEGORÍA';
    const price = product.VENTA || 0;
    const featured = product.DESTACADO === 'SI' || product.DESTACADO === 'SÍ';
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-image-container">
                <img src="${product.image_path}" alt="${name}" class="modal-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image-placeholder" style="display:none;">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </div>
            </div>
            <div class="modal-info">
                ${featured ? '<span class="product-badge">Destacado</span>' : ''}
                <h2>${name}</h2>
                <div class="product-code">Código: ${code}</div>
                <div class="modal-price">${formatPrice(price)}</div>
                <div class="modal-details">
                    <div class="detail-row">
                        <span class="detail-label">Categoría:</span>
                        <span class="detail-value">${category}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    productModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeModal() {
    productModal.classList.remove('show');
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
    const existingItem = cart.find(item => item.code === productCode);
    
    const productName = product.DESCRIPCIÓN || 'Sin nombre';
    
    if (existingItem) {
        // Si ya existe, aumentar cantidad
        existingItem.quantity += 1;
        showToast(`${productName} (x${existingItem.quantity})`, 'success');
    } else {
        // Si no existe, agregar nuevo
        const price = product.VENTA || 0;
        
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
    const item = cart.find(item => item.code === productCode);
    
    if (!item) return;
    
    if (newQuantity < 1) {
        removeFromCart(productCode);
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

// Eliminar producto del carrito
function removeFromCart(productCode) {
    const item = cart.find(item => item.code === productCode);
    const productName = item ? item.name : 'Producto';
    
    cart = cart.filter(item => item.code !== productCode);
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
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Obtener el código del producto desde el botón de agregar
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (!addBtn) return;
        
        const onclickAttr = addBtn.getAttribute('onclick');
        const codeMatch = onclickAttr.match(/addToCart\('(.+?)'\)/);
        if (!codeMatch) return;
        
        const productCode = codeMatch[1];
        
        // Buscar si este producto está en el carrito
        const cartItem = cart.find(item => item.code === productCode);
        const quantity = cartItem ? cartItem.quantity : 0;
        
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
        cartBody.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.imagePath 
                        ? `<img src="${item.imagePath}" alt="${item.name}">`
                        : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                               <circle cx="8.5" cy="8.5" r="1.5"></circle>
                               <polyline points="21 15 16 10 5 21"></polyline>
                           </svg>`
                    }
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-code">Código: ${item.code}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateCartItemQuantity('${item.code}', ${item.quantity - 1})">−</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                onchange="updateCartItemQuantity('${item.code}', parseInt(this.value) || 1)">
                            <button class="quantity-btn" onclick="updateCartItemQuantity('${item.code}', ${item.quantity + 1})">+</button>
                        </div>
                        <button class="remove-item-btn" onclick="removeFromCart('${item.code}')" title="Eliminar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Calcular y mostrar total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `S/ ${total.toFixed(2)}`;
        cartFooter.style.display = 'block';
    }
}

// Abrir panel del carrito
function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar panel del carrito
function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('show');
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
        const subtotal = item.price * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   Código: ${item.code}\n`;
        message += `   Cantidad: ${item.quantity}x - ${formatPrice(item.price)}\n`;
        message += `   Subtotal: ${formatPrice(subtotal)}\n\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `*Total: S/ ${total.toFixed(2)}*`;
    
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
    showToast('✅ Pedido enviado por WhatsApp. Carrito vaciado', 'success');
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
    toast.className = `toast toast-${type}`;
    
    const icon = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icon[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
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
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
});

// Close menu when clicking nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !menuToggle.contains(e.target) && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ========== SKELETON LOADING ==========
function renderSkeletons(count = 60) {
    productsGrid.innerHTML = Array(count).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `).join('');
}

function hideSkeletons() {
    const skeletons = document.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());
}

// ========== SEARCH DEBOUNCE WITH HIGHLIGHT ==========
let searchTimeout;
const DEBOUNCE_DELAY = 300;

function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
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
        loadingIndicator.style.cssText = 'text-align: center; padding: 2rem; color: var(--primary-color); font-weight: 500;';
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
