// =============================================
// ANALYTICS MODULE - VidraPlastic
// Sistema de tracking propio con Supabase
// =============================================

const Analytics = (function() {
    'use strict';

    // ========== CONFIGURACIÓN ==========
    const CONFIG = {
        BATCH_INTERVAL: 5000,      // Enviar eventos cada 5 segundos
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos de inactividad = nueva sesión
        SCROLL_THRESHOLDS: [25, 50, 75, 100],
        DEBUG: false // Cambiar a true para ver logs en consola
    };

    // ========== ESTADO ==========
    let sessionId = null;
    let visitorId = null;
    let sessionStartTime = null;
    let eventQueue = [];
    let scrollDepthReached = new Set();
    let isInitialized = false;

    // ========== UTILIDADES ==========
    
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source') || null,
            utm_medium: params.get('utm_medium') || null,
            utm_campaign: params.get('utm_campaign') || null
        };
    }

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Analytics]', ...args);
        }
    }

    // ========== VISITOR ID (persistente) ==========
    
    function getOrCreateVisitorId() {
        let id = localStorage.getItem('vp_visitor_id');
        if (!id) {
            id = generateId();
            localStorage.setItem('vp_visitor_id', id);
            log('Nuevo visitor:', id);
        }
        return id;
    }

    // ========== SESSION MANAGEMENT ==========
    
    function shouldStartNewSession() {
        const lastActivity = localStorage.getItem('vp_last_activity');
        if (!lastActivity) return true;
        
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
        return timeSinceLastActivity > CONFIG.SESSION_TIMEOUT;
    }

    function updateLastActivity() {
        localStorage.setItem('vp_last_activity', Date.now().toString());
    }

    async function startSession() {
        visitorId = getOrCreateVisitorId();
        
        if (shouldStartNewSession()) {
            sessionId = generateId();
            sessionStartTime = Date.now();
            localStorage.setItem('vp_session_id', sessionId);
            localStorage.setItem('vp_session_start', sessionStartTime.toString());
            
            const utm = getUTMParams();
            
            // Crear sesión en Supabase
            try {
                const { error } = await supabase
                    .from('analytics_sessions')
                    .insert({
                        id: sessionId,
                        visitor_id: visitorId,
                        referrer: document.referrer || null,
                        utm_source: utm.utm_source,
                        utm_medium: utm.utm_medium,
                        utm_campaign: utm.utm_campaign,
                        device_type: getDeviceType(),
                        screen_width: window.screen.width,
                        screen_height: window.screen.height,
                        user_agent: navigator.userAgent
                    });
                
                if (error) {
                    console.error('[Analytics] Error creating session:', error);
                } else {
                    log('Nueva sesión creada:', sessionId);
                }
            } catch (err) {
                console.error('[Analytics] Error:', err);
            }
            
            // Track session start
            track('session_start', {
                is_new_visitor: !localStorage.getItem('vp_returning'),
                referrer: document.referrer || 'direct'
            });
            
            localStorage.setItem('vp_returning', 'true');
        } else {
            sessionId = localStorage.getItem('vp_session_id');
            sessionStartTime = parseInt(localStorage.getItem('vp_session_start'), 10);
            log('Sesión existente:', sessionId);
        }
        
        updateLastActivity();
    }

    // ========== TRACKING DE EVENTOS ==========
    
    function track(eventType, eventData = {}) {
        if (!isInitialized) {
            log('Warning: Analytics not initialized yet');
            return;
        }

        const event = {
            session_id: sessionId,
            visitor_id: visitorId,
            event_type: eventType,
            event_data: eventData,
            page_url: window.location.pathname,
            page_title: document.title,
            created_at: new Date().toISOString()
        };

        eventQueue.push(event);
        updateLastActivity();
        
        log('Event queued:', eventType, eventData);
    }

    // ========== ENVÍO DE EVENTOS EN BATCH ==========
    
    async function flushEvents() {
        if (eventQueue.length === 0) return;

        const eventsToSend = [...eventQueue];
        eventQueue = [];

        try {
            const { error } = await supabase
                .from('analytics_events')
                .insert(eventsToSend);

            if (error) {
                console.error('[Analytics] Error sending events:', error);
                // Re-add events to queue on error
                eventQueue = [...eventsToSend, ...eventQueue];
            } else {
                log('Events sent:', eventsToSend.length);
            }
        } catch (err) {
            console.error('[Analytics] Error:', err);
            eventQueue = [...eventsToSend, ...eventQueue];
        }
    }

    // ========== SCROLL TRACKING ==========
    
    function setupScrollTracking() {
        let ticking = false;

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    checkScrollDepth();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function checkScrollDepth() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight <= 0) return;
        
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        CONFIG.SCROLL_THRESHOLDS.forEach(threshold => {
            if (scrollPercent >= threshold && !scrollDepthReached.has(threshold)) {
                scrollDepthReached.add(threshold);
                track('scroll_depth', { depth: threshold });
            }
        });
    }

    // ========== PAGE VISIBILITY (tiempo real) ==========
    
    function setupVisibilityTracking() {
        let hiddenTime = null;

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                hiddenTime = Date.now();
                // Enviar eventos pendientes cuando el usuario sale
                flushEvents();
            } else if (hiddenTime) {
                const awayTime = Math.round((Date.now() - hiddenTime) / 1000);
                if (awayTime > 5) { // Solo trackear si estuvo más de 5 segundos fuera
                    track('tab_return', { away_seconds: awayTime });
                }
                hiddenTime = null;
            }
        });
    }

    // ========== SALIDA DE PÁGINA ==========
    
    function setupExitTracking() {
        window.addEventListener('beforeunload', function() {
            // Calcular duración de sesión
            const duration = Math.round((Date.now() - sessionStartTime) / 1000);
            
            // Usar sendBeacon para envío confiable al salir
            const exitEvent = {
                session_id: sessionId,
                visitor_id: visitorId,
                event_type: 'session_end',
                event_data: { duration_seconds: duration },
                page_url: window.location.pathname,
                page_title: document.title,
                created_at: new Date().toISOString()
            };

            // Agregar a la cola y enviar todo
            eventQueue.push(exitEvent);
            
            // Usar fetch con keepalive para envío confiable al cerrar
            const url = `${SUPABASE_URL}/rest/v1/analytics_events`;
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(eventQueue),
                keepalive: true
            }).catch(() => {});
        });
    }

    // ========== INICIALIZACIÓN ==========
    
    async function init() {
        if (isInitialized) return;
        
        // Verificar que Supabase esté disponible
        if (typeof supabase === 'undefined') {
            console.error('[Analytics] Supabase not loaded');
            return;
        }

        await startSession();
        
        // Setup tracking automático
        setupScrollTracking();
        setupVisibilityTracking();
        setupExitTracking();
        
        // Enviar eventos en batch cada X segundos
        setInterval(flushEvents, CONFIG.BATCH_INTERVAL);
        
        // Track page view inicial
        track('page_view', {
            url: window.location.href,
            title: document.title
        });

        isInitialized = true;
        log('Analytics initialized');
    }

    // ========== API PÚBLICA ==========
    
    return {
        init: init,
        track: track,
        
        // Métodos de conveniencia para eventos comunes
        trackSearch: function(term, resultsCount) {
            track('search', { 
                term: term, 
                results_count: resultsCount 
            });
        },
        
        trackProductView: function(product) {
            track('product_view', {
                sku: product.sku,
                name: product.name,
                price: product.price,
                category: product.category
            });
        },
        
        trackAddToCart: function(product, quantity) {
            track('add_to_cart', {
                sku: product.sku,
                name: product.name,
                price: product.price,
                quantity: quantity
            });
        },
        
        trackRemoveFromCart: function(sku, name) {
            track('remove_from_cart', {
                sku: sku,
                name: name
            });
        },
        
        trackCheckoutStart: function(cartItems, total) {
            track('checkout_start', {
                items_count: cartItems.length,
                total: total,
                items: cartItems.map(item => ({
                    sku: item.code,
                    quantity: item.quantity
                }))
            });
        },
        
        trackCategoryFilter: function(category) {
            track('filter_category', { category: category });
        },
        
        trackFeaturedFilter: function(value) {
            track('filter_featured', { value: value });
        },

        // Para debug
        getSessionId: function() { return sessionId; },
        getVisitorId: function() { return visitorId; },
        enableDebug: function() { CONFIG.DEBUG = true; }
    };
})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}
