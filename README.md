# VidraPlastic - Tienda en Línea 🛒

Tienda en línea moderna para VidraPlastic, empresa peruana especializada en envases de vidrio y plástico. Aplicación 100% client-side construida con Vanilla JavaScript (sin frameworks), conectada a Supabase como backend.

## 🚀 Características Principales

### 🎨 Diseño y UX
- ✅ Diseño moderno y profesional con tipografía **Inter** (Google Fonts)
- ✅ Completamente responsive (6 breakpoints adaptables)
- ✅ Grid de hasta 6 columnas en desktop (ajusta automáticamente por ancho de pantalla)
- ✅ Animaciones suaves y transiciones elegantes (CSS transitions + `fadeInUp`)
- ✅ Skeleton loading con efecto shimmer durante la carga inicial
- ✅ Toast notifications para feedback visual de acciones del usuario
- ✅ Accesibilidad: atributos ARIA (`aria-hidden`, `aria-label`, `aria-modal`, `aria-controls`, `aria-expanded`)
- ✅ Navegación por teclado: tecla ESC cierra modales, carrito y menú de categorías

### 🔍 Sistema de Búsqueda y Filtros
- ✅ Búsqueda en tiempo real por nombre, código SKU o categoría
- ✅ Búsqueda multi-palabra (todas las palabras deben coincidir, orden independiente)
- ✅ Búsqueda insensible a acentos y mayúsculas (normalización Unicode NFD)
- ✅ Resaltado de coincidencias (highlight) en resultados de búsqueda
- ✅ Debounce de 300ms para optimizar rendimiento
- ✅ Menú lateral deslizable con categorías dinámicas (cargadas desde Supabase)
- ✅ Cada categoría muestra su conteo de productos
- ✅ Contador de productos filtrados vs total ("Mostrando X de Y productos")

### 📦 Paginación Inteligente
- ✅ Muestra 60 productos inicialmente (10 filas x 6 columnas)
- ✅ Scroll infinito: carga 60 productos más al llegar al 80% del scroll
- ✅ Indicador de "Cargando más productos..." durante la carga

### 🛒 Sistema de Carrito Completo
- ✅ Botón de agregar en cada tarjeta de producto (esquina superior derecha)
- ✅ Badge individual en cada tarjeta mostrando cantidad en carrito
- ✅ Panel lateral deslizable desde la derecha con overlay
- ✅ Badge con contador total de items en el header
- ✅ Animación de pulso en badge al agregar productos
- ✅ Control de cantidad (+/− o input manual numérico)
- ✅ Botón eliminar individual por producto
- ✅ Botón "Vaciar carrito" con confirmación (`confirm()`)
- ✅ Cálculo automático de totales (muestra "Consultar" si algún precio es desconocido)
- ✅ Persistencia con localStorage (formato con timestamp)
- ✅ Expiración automática del carrito tras 30 días de inactividad
- ✅ Migración automática de formato antiguo (sin timestamp) al nuevo formato

### 💬 Integración WhatsApp
- ✅ Envío de pedido formateado a **966412465** vía `wa.me`
- ✅ Mensaje detallado con:
  - Lista numerada de productos
  - Códigos SKU internos
  - Cantidades y precios unitarios
  - Subtotales por producto
  - **Total general** (o "Consultar" si hay precios desconocidos)
- ✅ Compatible con WhatsApp Web y App móvil
- ✅ Vaciado automático del carrito tras enviar el pedido

### 🖼️ Gestión de Productos
- ✅ Catálogo de imágenes de productos en formato `.webp` (carpeta `Todos/`)
- ✅ Carga desde vista pública `ProductosPublicos` de Supabase (solo productos con imagen)
- ✅ Modal detallado para cada producto (nombre, código, categoría, precio)
- ✅ Precios formateados en soles peruanos (`S/ X.XX`)
- ✅ Placeholder SVG cuando la imagen falla al cargar (fallback con evento `error`)
- ✅ Lazy loading de imágenes (`loading="lazy"` + `decoding="async"`)
- ✅ Protección XSS: todo el contenido renderizado pasa por `escapeHTML()`

### 📊 Sistema de Analytics Dual

#### Google Analytics 4
- ✅ Tag `G-WX74BV8SZM` integrado
- ✅ Debug mode automático en localhost/127.0.0.1

#### Analytics Propio (Supabase)
- ✅ Módulo IIFE autocontenido (`Analytics`)
- ✅ Gestión de sesiones con timeout de 30 min de inactividad
- ✅ Visitor ID persistente en localStorage
- ✅ Tracking de eventos por lotes (batch cada 5 segundos)
- ✅ Envío confiable al cerrar pestaña (`fetch` con `keepalive`)
- ✅ Eventos trackeados:
  - `page_view` — vista de página
  - `session_start` / `session_end` — inicio/fin de sesión con duración
  - `search` — búsquedas con término y cantidad de resultados
  - `product_view` — vista detallada de producto (SKU, nombre, precio, categoría)
  - `add_to_cart` / `remove_from_cart` — modificaciones al carrito
  - `checkout_start` — inicio de pedido WhatsApp con items y total
  - `filter_category` — filtro por categoría
  - `scroll_depth` — profundidad de scroll (25%, 50%, 75%, 100%)
  - `tab_return` — retorno a la pestaña (con segundos ausente)
- ✅ Captura de UTM params (`utm_source`, `utm_medium`, `utm_campaign`)
- ✅ Metadata de sesión: device type, screen size, user agent, referrer

## 📦 Estructura del Proyecto

```
VidraPlastic/
├── index.html          # Página principal (HTML5 semántico)
├── styles.css          # Estilos completos (CSS3 — Grid, Flexbox, Variables, Animaciones)
├── script.js           # Lógica principal (Carrito, búsqueda, filtros, UI)
├── analytics.js        # Sistema de analytics propio (Sesiones, eventos, batch)
├── supabase-config.js  # Inicialización del cliente Supabase
├── README.md           # Este archivo
└── Todos/              # Catálogo de imágenes de productos (.webp), nombradas por SKU
```

## 🎯 Cómo Usar

### Opción 1: Servidor Local Python
```powershell
cd C:\Users\Luis\Desktop\VidraPlastic
python -m http.server 8000
```
Luego abre: http://localhost:8000

### Opción 2: Live Server (VS Code)
1. Instala la extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

### Opción 3: Directamente en el navegador
Abre `index.html` con tu navegador favorito

> **Nota:** Para que el Analytics propio y la carga de productos funcionen correctamente, se requiere conexión a internet (Supabase CDN).

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura semántica con atributos ARIA |
| **CSS3** | Variables CSS personalizadas, Grid, Flexbox, Animaciones, Media Queries |
| **JavaScript ES6+** | Vanilla JS — sin frameworks ni dependencias de build |
| **Google Fonts** | Tipografía Inter (300–700) |
| **Supabase JS v2 (CDN)** | Lectura de productos desde vista pública `ProductosPublicos` |
| **Google Analytics 4** | Tracking de tráfico y comportamiento |
| **LocalStorage API** | Persistencia del carrito y datos de sesión del analytics |
| **WhatsApp API (`wa.me`)** | Envío de pedidos formateados |

## 📱 Responsive Breakpoints

| Breakpoint | Columnas | Dispositivo |
|---|---|---|
| **> 1400px** | 6 columnas | Desktop grande |
| **1200–1400px** | 5 columnas | Desktop |
| **992–1200px** | 4 columnas | Laptop |
| **768–992px** | 3 columnas | Tablet |
| **480–768px** | 2 columnas | Móvil |
| **< 480px** | 2 columnas compactas | Móvil pequeño |

En móvil (<768px): tarjetas reducen altura de imagen, padding e interlineado. El panel del carrito ocupa 100% del ancho. La etiqueta "Menú" del hamburger se oculta.

## 🎨 Paleta de Colores y Variables CSS

```css
/* Colores */
--primary-color: #2563eb;    /* Azul principal */
--primary-dark: #1e40af;     /* Azul oscuro (hover) */
--secondary-color: #10b981;  /* Verde éxito (badges, botones) */
--text-dark: #1f2937;        /* Texto principal */
--text-light: #6b7280;       /* Texto secundario */
--bg-light: #f9fafb;         /* Fondo claro */
--bg-white: #ffffff;         /* Fondo blanco */
--border-color: #e5e7eb;     /* Bordes */

/* Sombras */
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl

/* Bordes redondeados */
--radius: 8px;
--radius-lg: 12px;
```

## ⚙️ Arquitectura Técnica

- **Carga de datos:** Consulta única a Supabase (`ProductosPublicos`) al iniciar. Los productos se almacenan en memoria (`allProducts`).
- **Rendimiento de búsqueda:** Campo `__search` precomputado (normalizado sin acentos) para cada producto al momento de carga.
- **Delegación de eventos:** Click handlers centralizados en contenedores (`productsGrid`, `cartBody`, `categoryMenuBody`) en lugar de onclick inline.
- **Seguridad:** Todo contenido dinámico pasa por `escapeHTML()` antes de insertarse en el DOM.
- **Imágenes:** Fallback automático vía event listener de `error` en fase de captura (`useCapture: true`).
- **Analytics:** Módulo IIFE con cola de eventos, envío por batch, y `keepalive` fetch para datos de salida.

## 📄 Licencia

© 2026 VidraPlastic. Todos los derechos reservados.

---

**VidraPlastic** - Envases a medida 🇵🇪

**Contacto:**
- **WhatsApp:** 966412465
- **Email:** ventas@vidraplastic.com