# VidraPlastic - Tienda en Línea 🛒

Tienda en línea moderna para VidraPlastic, empresa peruana especializada en envases de vidrio y plástico.

## 🚀 Características Principales

### 🎨 Diseño y UX
- ✅ Diseño moderno y profesional
- ✅ Completamente responsive (móvil, tablet, desktop)
- ✅ Grid de 6 columnas en desktop (ajusta por breakpoint)
- ✅ Animaciones suaves y transiciones elegantes

### 🔍 Sistema de Búsqueda y Filtros
- ✅ Búsqueda en tiempo real por nombre, código o categoría
- ✅ Menú lateral con 46 categorías
- ✅ Contador de productos filtrados

### 📦 Paginación Inteligente
- ✅ Muestra 60 productos inicialmente
- ✅ Carga infinita (scroll) sin recargar página

### 🛒 Sistema de Carrito Completo
- ✅ Botón de agregar en cada producto (esquina superior derecha)
- ✅ Panel lateral deslizable desde la derecha
- ✅ Badge con contador de items en el header
- ✅ Control de cantidad (+/- o input manual)
- ✅ Botón eliminar individual por producto
- ✅ Botón "Vaciar carrito" completo
- ✅ Cálculo automático de totales
- ✅ Persistencia con localStorage (no se pierde al recargar)

### 💬 Integración WhatsApp
- ✅ Envío de pedido formateado a +51 989 394 769
- ✅ Mensaje detallado con:
  - Lista numerada de productos
  - Códigos internos
  - Cantidades y precios unitarios
  - Subtotales por producto
  - **Total general**
- ✅ Compatible con WhatsApp Web y App móvil

### 🖼️ Gestión de Productos
- ✅ Productos con imágenes .webp
- ✅ Modal detallado para cada producto
- ✅ Visualización de precios en soles
- ✅ Placeholder SVG para productos sin imagen

### 📊 Analytics
- ✅ Google Analytics 4 integrado
- ✅ Sistema propio con Supabase (sesiones, eventos)
- ✅ Tracking de búsquedas, categorías, productos vistos
- ✅ Tracking de carrito y checkout
- ✅ Debug mode automático en localhost

## 📦 Estructura del Proyecto

```
VidraPlastic/
├── index.html         # Página principal
├── styles.css         # Estilos (CSS Grid, Flexbox, Variables)
├── script.js          # Lógica del carrito y UI
├── analytics.js       # Sistema de analytics propio
├── supabase-config.js # Configuración de Supabase
├── README.md          # Este archivo
└── Todos/             # Imágenes de productos (.webp)
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

## 🛠️ Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Variables CSS, Grid, Flexbox, Animaciones
- **JavaScript ES6+** - Vanilla JS, sin dependencias
- **Supabase (CDN)** - Lectura de productos desde vista pública
- **LocalStorage API** - Persistencia del carrito
- **WhatsApp Business API** - Envío de pedidos

## 📱 Responsive Breakpoints

- **Desktop** (>1200px): 6 columnas
- **Laptop** (992-1200px): 4 columnas
- **Tablet** (768-992px): 3 columnas
- **Móvil** (480-768px): 2 columnas
- **Móvil pequeño** (<480px): 2 columnas compactas

## 🎨 Paleta de Colores

```css
--primary-color: #2563eb    /* Azul principal */
--primary-dark: #1e40af     /* Azul oscuro */
--secondary-color: #10b981  /* Verde éxito */
--text-dark: #1f2937        /* Texto principal */
--text-light: #6b7280       /* Texto secundario */
```

## 🚀 Roadmap Futuro

- [ ] Sistema de autenticación
- [ ] Panel de administración
- [ ] Gestión de inventario en tiempo real
- [ ] Múltiples métodos de pago
- [ ] Sistema de descuentos y cupones
- [ ] Historial de pedidos
- [ ] Notificaciones push
- [ ] PWA (Progressive Web App)
- [ ] Modo oscuro

## 📄 Licencia

© 2025 VidraPlastic. Todos los derechos reservados.

---

**VidraPlastic** - Envases a tu medida 🇵🇪

**Contacto (WhatsApp):** +51 989 394 769

