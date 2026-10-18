# SIIA — Sistema de Diseño Unificado
> Universidad Odontológica Dominicana · Version 1.0 · Aprobado Oct 2026

**REGLA:** Antes de construir cualquier pantalla, leer este archivo completo.
Ningún componente puede desviarse de este sistema sin aprobación explícita del usuario.

---

## 1. Personalidad Visual

| Atributo       | Valor                                                         |
|----------------|---------------------------------------------------------------|
| Estilo base    | Enterprise + Minimal-Light + Glassmorphism accents            |
| Sensación      | Clínico · Profesional · Moderno · Confiable                   |
| Fondo default  | Blanco clínico (modo claro es el principal)                   |
| Modo oscuro    | Azul naval profundo (toggle disponible)                       |
| Iconografía    | Lucide React — NUNCA emojis como íconos                       |
| Idioma UI      | Español dominicano institucional                              |

---

## 2. Paleta de Colores — Tokens Oficiales

### 2a. Colores de Marca (Inmutables — identidad UOD)

| Token               | Hex       | Descripción                              |
|---------------------|-----------|------------------------------------------|
| `--color-primary`   | `#1C3177` | Azul marino UOD (letras U y D del logo)  |
| `--color-primary-h` | `#2B4BA0` | Hover / estado activo del primario       |
| `--color-green`     | `#3DAA5C` | Verde UOD (círculo diente + DOMINICANA)  |
| `--color-green-h`   | `#2D8246` | Hover / borde del verde                  |
| `--color-ai`        | `#06B6D4` | Turquesa exclusivo del Asistente IA      |
| `--color-warning`   | `#F59E0B` | Advertencia / Stock bajo                 |
| `--color-danger`    | `#EF4444` | Error / Stock agotado / Acción crítica   |

### 2b. Modo Claro (default)

| Token                   | Hex       | Uso                                      |
|-------------------------|-----------|------------------------------------------|
| `--bg`                  | `#F7F9FC` | Fondo de página                          |
| `--surface`             | `#FFFFFF` | Cards, modales, inputs                   |
| `--surface-raised`      | `#EEF2F8` | Hover de filas, dropdowns                |
| `--border`              | `#D1D9E8` | Separadores, bordes de input             |
| `--text-1`              | `#1C3177` | Títulos (azul marino = jerarquía visual) |
| `--text-2`              | `#4A5E8A` | Labels, subtítulos                       |
| `--text-muted`          | `#8A9AB8` | Placeholders, captions, timestamps       |

### 2c. Modo Oscuro

| Token                   | Hex       | Uso                                      |
|-------------------------|-----------|------------------------------------------|
| `--bg`                  | `#0D1B2A` | Fondo de página                          |
| `--surface`             | `#112240` | Cards, modales                           |
| `--surface-raised`      | `#1A3356` | Hover de filas, dropdowns                |
| `--border`              | `#1E3A6E` | Separadores, bordes                      |
| `--text-1`              | `#F0F4FF` | Títulos                                  |
| `--text-2`              | `#A8B8D8` | Labels                                   |
| `--text-muted`          | `#6B80A8` | Captions                                 |

### 2d. Variables CSS (globals.css)

```css
:root {
  /* Marca */
  --color-primary:   #1C3177;
  --color-primary-h: #2B4BA0;
  --color-green:     #3DAA5C;
  --color-green-h:   #2D8246;
  --color-ai:        #06B6D4;
  --color-warning:   #F59E0B;
  --color-danger:    #EF4444;

  /* Modo claro */
  --bg:              #F7F9FC;
  --surface:         #FFFFFF;
  --surface-raised:  #EEF2F8;
  --border:          #D1D9E8;
  --text-1:          #1C3177;
  --text-2:          #4A5E8A;
  --text-muted:      #8A9AB8;

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(28,49,119,.08), 0 1px 2px rgba(28,49,119,.05);
  --shadow-md: 0 4px 12px rgba(28,49,119,.12), 0 2px 4px rgba(28,49,119,.08);
  --shadow-lg: 0 10px 28px rgba(28,49,119,.16), 0 4px 8px rgba(28,49,119,.10);
  --shadow-ai: 0 0 20px rgba(6,182,212,.25);
  --shadow-nav: 0 0 16px rgba(28,49,119,.20);
}

[data-theme="dark"] {
  --bg:             #0D1B2A;
  --surface:        #112240;
  --surface-raised: #1A3356;
  --border:         #1E3A6E;
  --text-1:         #F0F4FF;
  --text-2:         #A8B8D8;
  --text-muted:     #6B80A8;
}
```

### 2e. Tailwind Config (tailwind.config.ts)

```ts
colors: {
  primary:   { DEFAULT: '#1C3177', hover: '#2B4BA0' },
  green:     { DEFAULT: '#3DAA5C', hover: '#2D8246' },
  ai:        { DEFAULT: '#06B6D4' },
  warning:   { DEFAULT: '#F59E0B' },
  danger:    { DEFAULT: '#EF4444' },
  bg:        { DEFAULT: '#F7F9FC' },
  surface:   { DEFAULT: '#FFFFFF', raised: '#EEF2F8' },
  border:    { DEFAULT: '#D1D9E8' },
  text:      { 1: '#1C3177', 2: '#4A5E8A', muted: '#8A9AB8' },
}
```

---

## 3. Tipografía

### 3a. Fuentes

```html
<!-- En <head> de layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### 3b. Escala Tipográfica

| Elemento       | Fuente        | Peso | Tamaño | Line-height | Uso                          |
|----------------|---------------|------|--------|-------------|------------------------------|
| `h1` (page)    | Inter         | 700  | 32px   | 1.2         | Un único h1 por pantalla     |
| `h2` (section) | Inter         | 600  | 24px   | 1.3         | Encabezados de módulo        |
| `h3` (card)    | Inter         | 600  | 18px   | 1.4         | Títulos de tarjeta           |
| `h4` (sub)     | Inter         | 600  | 16px   | 1.4         | Sub-secciones                |
| Body           | Inter         | 400  | 14px   | 1.5         | Contenido general            |
| Small          | Inter         | 400  | 12px   | 1.5         | Timestamps, hints, captions  |
| Code / ID / QR | JetBrains Mono| 400  | 13px   | 1.4         | Códigos de inventario        |

### 3c. Tailwind Typography Classes

```
text-page-title  → text-[32px] font-bold leading-tight text-text-1
text-section     → text-2xl font-semibold text-text-1
text-card-title  → text-lg font-semibold text-text-1
text-body        → text-sm text-text-2
text-small       → text-xs text-text-muted
text-code        → font-mono text-[13px] text-text-2
```

---

## 4. Espaciado y Layout

### 4a. Escala de espaciado (base 4px)

| Token    | Valor | Uso típico                        |
|----------|-------|-----------------------------------|
| `space-1`| 4px   | Gap entre ícono y texto badge     |
| `space-2`| 8px   | Padding input, gap de lista       |
| `space-3`| 12px  | Padding botón-y, card padding-sm  |
| `space-4`| 16px  | Padding card, gap de sección      |
| `space-6`| 24px  | Espaciado entre secciones         |
| `space-8`| 32px  | Divisor de módulo                 |
| `space-12`|48px  | Espaciado hero                    |

### 4b. Layout global (desktop 1440px)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR 64px (bg-primary, text-white)                       │
│  Logo UOD + Breadcrumb + Buscador + Notifs + Avatar         │
├────────────┬────────────────────────────────┬───────────────┤
│  SIDEBAR   │                                │  PANEL IA     │
│  240px     │     ÁREA PRINCIPAL             │  380px        │
│  bg-primary│     (bg, scroll vertical)      │  (colapsable) │
│  text-white│                                │               │
│            │                                │               │
└────────────┴────────────────────────────────┴───────────────┘
```

**Mobile (< 768px):** Sidebar → Drawer hamburger | Panel IA → FAB turquesa → fullscreen

### 4c. Breakpoints

| Nombre | Valor  | Descripción            |
|--------|--------|------------------------|
| `sm`   | 640px  | Teléfono grande        |
| `md`   | 768px  | Tablet                 |
| `lg`   | 1024px | Laptop                 |
| `xl`   | 1280px | Desktop                |
| `2xl`  | 1440px | Desktop ancho          |

---

## 5. Bordes, Radios y Sombras

```
/* Radios */
--radius-sm:   4px    → badges, tags, chips
--radius-md:   8px    → botones, inputs, selects
--radius-lg:   12px   → cards, paneles
--radius-xl:   16px   → modales, drawers
--radius-2xl:  24px   → hero cards, modales grandes
--radius-full: 9999px → avatares, pills de estado

/* Sombras (tinte azul marino = coherencia de marca) */
--shadow-sm  → cards secundarias, inputs focus
--shadow-md  → cards principales, dropdowns
--shadow-lg  → modales, drawers
--shadow-ai  → glow turquesa para el panel IA
--shadow-nav → sombra del sidebar/topbar
```

---

## 6. Componentes Base

### 6a. KPI / Stat Card

```tsx
<div className="bg-white rounded-xl border border-[#D1D9E8] p-6
                shadow-sm hover:shadow-md hover:border-primary/30
                transition-all duration-300">
  <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-primary/10 rounded-lg">
      <PackageIcon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-sm font-medium text-text-2">Total Recursos</span>
  </div>
  <div className="text-3xl font-bold text-primary">1,248</div>
  <div className="mt-2 flex items-center gap-1.5 text-sm text-green">
    <TrendingUp className="w-4 h-4" />
    <span>+8% este mes</span>
  </div>
</div>
```

### 6b. Botones

```tsx
/* Primario (azul marino) */
<button className="bg-primary hover:bg-primary-hover text-white font-medium
                   px-4 py-2.5 rounded-lg transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Acción Principal
</button>

/* Verde (confirmar, guardar, asignar) */
<button className="bg-green hover:bg-green-hover text-white font-medium
                   px-4 py-2.5 rounded-lg transition-colors duration-200">
  Confirmar
</button>

/* Outline (secundario) */
<button className="border border-[#D1D9E8] bg-white hover:bg-[#EEF2F8]
                   text-text-2 font-medium px-4 py-2.5 rounded-lg transition-colors">
  Cancelar
</button>

/* Destructivo */
<button className="bg-danger/10 hover:bg-danger/20 text-danger font-medium
                   px-4 py-2.5 rounded-lg transition-colors">
  Eliminar
</button>
```

### 6c. Badges de Estado (con punto de color — no solo color)

```tsx
const statusMap = {
  disponible:    { dot: 'bg-green',   text: 'text-green',   bg: 'bg-green/10'   },
  'en uso':      { dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' },
  prestado:      { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
  mantenimiento: { dot: 'bg-ai',      text: 'text-ai',      bg: 'bg-ai/10'      },
  'dado de baja':{ dot: 'bg-danger',  text: 'text-danger',  bg: 'bg-danger/10'  },
};

<span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                  text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
  Disponible
</span>
```

### 6d. Tabla de Datos (enterprise / densa)

```
Características:
- Header: sticky top-0, bg-[#EEF2F8], text-xs font-semibold text-text-2 uppercase
- Fila: h-12 (48px), hover:bg-[#EEF2F8], border-b border-[#D1D9E8]
- Primera columna: sticky left-0, bg-white (para scroll horizontal en móvil)
- Columnas mínimas en mobile: ocultar con hidden md:table-cell
- Paginación: "Mostrando 1–25 de 248" + Anterior / Siguiente + selector de tamaño
- Sort: ChevronUp/Down en header, columna activa con subrayado en primary
- Selección masiva: checkbox en header selecciona todo; muestra barra de acciones
```

### 6e. Tarjeta de Recurso (catálogo)

```tsx
<div className="bg-white rounded-xl border border-[#D1D9E8] overflow-hidden
                shadow-sm hover:shadow-md transition-all duration-300 w-[280px]">
  {/* Imagen */}
  <div className="relative h-40">
    <img src={img} alt={name} className="w-full h-full object-cover" />
    <StatusBadge status={status} className="absolute top-2 right-2" />
  </div>
  {/* Cuerpo */}
  <div className="p-4">
    <h3 className="font-semibold text-primary text-sm">{name}</h3>
    <p className="font-mono text-xs text-text-muted mt-0.5">{code}</p>
    <p className="text-xs text-text-2 mt-1 flex items-center gap-1">
      <MapPin className="w-3 h-3" /> {location}
    </p>
  </div>
  {/* Footer */}
  <div className="px-4 pb-4 flex gap-2">
    <button aria-label="Ver código QR" className="p-2 rounded-lg border border-[#D1D9E8]
                hover:bg-[#EEF2F8] transition-colors">
      <QrCode className="w-4 h-4 text-text-2" />
    </button>
    <button className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs
                       font-medium py-2 rounded-lg transition-colors">
      Ver Detalle
    </button>
  </div>
</div>
```

### 6f. Panel Asistente IA

```
Estructura:
- Sidebar derecho 380px | Mobile: fullscreen drawer
- Header: gradiente linear de #1C3177 a #06B6D4, texto blanco
  - Punto pulsante turquesa (animación aiPulse) = IA activa
  - Título "Asistente SIIA" en Inter 600
- Área de mensajes: scroll vertical, padding 16px
  - Burbuja Usuario: bg-primary, text-white, border-radius-xl, alineada a la derecha
  - Burbuja IA: bg-[#EEF2F8], border-l-2 border-ai, text-text-1, alineada a la izquierda
  - Thinking indicator: 3 puntos con animación aiPulse
- Tarjeta de Propuesta (acción escritura):
  - bg-warning/5 border border-warning/30 rounded-xl p-4
  - Título: "Acción Propuesta" con icono AlertTriangle warning
  - Preview del impacto (qué cambia, cuántas unidades, destino)
  - Botones: "Confirmar" (green) | "Cancelar" (outline)
  - NUNCA ejecutar la escritura sin que el usuario presione Confirmar
- Input: textarea auto-resize + botón enviar (bg-primary icon Send)
```

### 6g. Modal / Diálogo

```
- max-w-2xl centrado con overlay backdrop-blur-sm bg-black/40
- rounded-xl bg-white border border-[#D1D9E8] shadow-lg
- Header: título h2 + botón X (aria-label="Cerrar")
- Body: scroll interno si contenido largo (max-h-[60vh] overflow-y-auto)
- Footer: acciones alineadas a la derecha (Cancelar + Confirmar)
- Focus trap mientras está abierto
- role="dialog" aria-modal="true" aria-labelledby="dialog-title"
- Cerrar con Escape
```

---

## 7. Animaciones y Transiciones

```css
/* Transiciones estándar */
.transition-base   { transition: all 150ms ease; }
.transition-smooth { transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }

/* Entrada de elementos */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 300ms ease forwards; }

/* IA activa (punto pulsante en header) */
@keyframes aiPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}
.animate-ai-pulse { animation: aiPulse 1.5s ease-in-out infinite; }

/* Skeleton loader */
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position:  200% center; }
}
.skeleton {
  background: linear-gradient(90deg, #EEF2F8 25%, #D1D9E8 50%, #EEF2F8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Respeto prefers-reduced-motion (OBLIGATORIO) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Accesibilidad — WCAG 2.1 AA (Obligatorio)

| Regla                | Requerimiento                                              |
|----------------------|------------------------------------------------------------|
| Contraste normal     | ≥ 4.5:1                                                    |
| Contraste grande     | ≥ 3:1 (≥ 18px o ≥ 14px negrita)                           |
| Focus visible        | outline 2px solid #1C3177, offset 2px                     |
| Solo ícono           | `aria-label` obligatorio                                   |
| Badges de estado     | Nunca solo color — incluir texto                           |
| Inputs               | `<label htmlFor>` asociado siempre                         |
| Modales              | focus trap + `role="dialog"` + `aria-modal`                |
| Tablas               | `<th scope="col|row">` en todos los headers                |
| Imágenes             | `alt` siempre; decorativas → `alt=""`                      |
| Navegación teclado   | Tab en orden lógico, sin trampas de foco (excepto modales) |
| Touch targets        | Mínimo 44×44px                                             |
| Reducir movimiento   | `prefers-reduced-motion` respetado siempre                 |

---

## 9. Excepciones por Pantalla

### 9a. Login
- Sin sidebar ni topbar
- Fondo: gradiente `#0D1B2A → #1C3177` (marino) con logo UOD centrado grande
- Card centrada: bg-white max-w-sm, shadow-lg, rounded-2xl
- Solo un botón: "Continuar con Google" (bg-white border + Google logo)

### 9b. Panel Principal (Dashboard)
- 4 KPI cards en grid 2×2 (mobile) / 4×1 (desktop)
- Gráfico de barras: colores primary (entradas) y green (salidas)
- Tabla stock bajo: máximo 5 filas + enlace "Ver todos"
- Widget IA: card turquesa proactiva, no intrusiva

### 9c. Catálogo de Recursos
- Grid responsivo: 1 col (mobile) / 2 col (tablet) / 3-4 col (desktop)
- Filtro lateral: collapsable en mobile
- Sin paginación infinita — paginación clásica (más predecible)

### 9d. Ficha de Recurso
- Layout de 2 columnas en desktop: foto+galería izquierda, detalles derecha
- Historial en tabs: Movimientos / Mantenimientos / Asignaciones

### 9e. Panel IA
- Siempre visible en desktop (380px), colapsable con botón
- En mobile: FAB turquesa fijo abajo-derecha → abre drawer fullscreen

---

## 10. Anti-Patrones Prohibidos

| ❌ Prohibido                              | ✅ Alternativa correcta                       |
|-------------------------------------------|-----------------------------------------------|
| `#4F46E5` (índigo genérico)               | `#1C3177` (azul marino UOD)                   |
| `#0B1020` como fondo default              | `#F7F9FC` (blanco clínico, modo claro)        |
| Emojis como íconos                        | Lucide React                                  |
| `style={{ color: 'red' }}`               | `className="text-danger"`                     |
| Input sin `<label>`                       | Siempre `htmlFor` o `aria-labelledby`          |
| IA ejecutando escritura automática        | Tarjeta de confirmación primero               |
| Modal más ancho que `max-w-2xl`          | Máximo `max-w-2xl` en desktop                 |
| Tablas con scroll horizontal sin fix      | Primera columna sticky                        |
| `font-family: Arial, sans-serif`          | Inter vía Google Fonts                        |

---

*Archivo mantenido por Antigravity · Actualizar solo con aprobación del usuario · v1.0*
