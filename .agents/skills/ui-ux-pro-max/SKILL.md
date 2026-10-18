---
name: ui-ux-pro-max
description: >
  Expert-level UI/UX design system advisor for SIIA. Provides curated design styles,
  color palettes, typography pairings, component patterns, accessibility rules (WCAG 2.1 AA),
  and dashboard/data-table best practices for Next.js + Tailwind + shadcn/ui projects.
  Use this skill before building any new screen or component to ensure visual consistency.
requires_python: "3.x"
search_script: scripts/search.py
---

# UI/UX Pro Max — Skill Instructions para SIIA / UOD

## 1. How to use this skill

Before building any UI screen:
1. Identify the screen type (dashboard, form, catalog, detail, modal, AI panel).
2. Call `python scripts/search.py "<query>"` to get style + palette + component recommendations.
3. Combine results with the project approved design-system/MASTER.md.
4. Never deviate from the approved system without user approval.

---

## 2. Paleta Institucional UOD — APROBADA (no modificar sin autorización)

### Modo Claro (default)
Primary Navy Blue:   #1C3177   <- Azul marino logo UOD (U y D)
Primary Medium:      #2B4BA0   <- Hover, activos, links
Green UOD:           #3DAA5C   <- Verde logo UOD (circulo diente + DOMINICANA)
Green Dark:          #2D8246   <- Hover del verde, bordes green
AI Accent Teal:      #06B6D4   <- Panel Asistente IA (diferenciado)
Warning:             #F59E0B   <- Stock bajo
Danger:              #EF4444   <- Stock agotado, errores

Background:          #F7F9FC   <- Fondo blanco limpio (clinico-institucional)
Surface:             #FFFFFF   <- Cards, modales, tablas
Surface Raised:      #EEF2F8   <- Hover rows, dropdowns
Border:              #D1D9E8   <- Separadores, inputs
Text Primary:        #1C3177   <- Titulos (azul marino)
Text Secondary:      #4A5E8A   <- Labels, subtitulos
Text Muted:          #8A9AB8   <- Placeholders, captions

### Modo Oscuro (toggle)
Background:          #0D1B2A   <- Azul oscuro naval
Surface:             #112240   <- Marino profundo
Surface Raised:      #1A3356   <- Hover rows
Border:              #1E3A6E   <- Borde marino
Text Primary:        #F0F4FF   <- Blanco azulado
Text Secondary:      #A8B8D8   <- Texto secundario
Text Muted:          #6B80A8   <- Texto suave

---

## 3. Typography

Font: Inter (400, 500, 600, 700) + JetBrains Mono (codigo/IDs/QR)
Source: Google Fonts CDN

h1: 32px / 700 / line-height 1.2   <- Un solo h1 por pagina
h2: 24px / 600 / line-height 1.3   <- Secciones de modulo
h3: 18px / 600 / line-height 1.4   <- Titulos de card
body: 14px / 400 / line-height 1.5 <- Contenido general
small: 12px / 400 / line-height 1.5 <- Timestamps, hints
code/ID: 13px JetBrains Mono       <- Codigos inventario, QR

---

## 4. Estilos de Diseno para SIIA

Estilo principal: enterprise + minimal-light + glassmorphism accents

Personalidad:
- LIMPIO: fondo blanco, espacio generoso
- SOLIDO: azul marino en estructura y nav
- VIVO: verde UOD en acciones positivas
- MODERNO: glass cards, micro-animaciones suaves
- INTELIGENTE: panel IA en turquesa (diferenciado)

KPI Card: bg-white/80 backdrop-blur, border-[#D1D9E8], rounded-xl, navy-glow on hover
Status Badge: punto de color + texto (nunca solo color)
Data Table: header sticky, filas 48px, chevrons de orden, hover
AI Panel: sidebar 380px, header turquesa con glow, tarjetas de confirmacion
Resource Card: imagen 160px + badge de estado + boton QR

---

## 5. Layout Global

Desktop (1440px):
  Sidebar 240px (azul marino) | Contenido main (flex) | Panel IA 380px (colapsable)
  Topbar 64px: Logo UOD + Breadcrumb + Busqueda + Avatar

Mobile (375px):
  Sidebar -> drawer hamburger
  Panel IA -> FAB + fullscreen drawer

---

## 6. Componentes Clave

### KPI Card
- bg-white shadow-sm border border-[#D1D9E8] rounded-xl p-6
- hover: border-[#1C3177]/30 shadow-md transition-all 300ms
- Icon: bg-[#1C3177]/10 rounded-lg p-2 text-[#1C3177]
- Valor: text-[#1C3177] font-bold text-3xl

### Botón Primario
- bg-[#1C3177] hover:bg-[#2B4BA0] text-white rounded-lg px-4 py-2.5
- focus: ring-2 ring-[#1C3177] ring-offset-2

### Botón de Acción Positiva (confirmar, asignar, guardar)
- bg-[#3DAA5C] hover:bg-[#2D8246] text-white rounded-lg px-4 py-2.5

### Badge de Estado
- Disponible:    bg-[#3DAA5C]/10 text-[#2D8246] dot-[#3DAA5C]
- En uso:        bg-[#1C3177]/10 text-[#1C3177] dot-[#2B4BA0]
- Prestado:      bg-[#F59E0B]/10 text-[#B45309] dot-[#F59E0B]
- Mantenimiento: bg-[#06B6D4]/10 text-[#0E7490] dot-[#06B6D4]
- Agotado:       bg-[#EF4444]/10 text-[#B91C1C] dot-[#EF4444]

### Panel IA (sidebar)
- bg-[#F7F9FC] border-l border-[#D1D9E8]
- Header: gradient de [#1C3177] a [#06B6D4], texto blanco
- Burbuja IA: bg-[#EEF2F8] border-l-2 border-[#06B6D4]
- Burbuja usuario: bg-[#1C3177] text-white
- Tarjeta propuesta: bg-[#F59E0B]/5 border border-[#F59E0B]/30

---

## 7. Accessibility (WCAG 2.1 AA — obligatorio)

- Contraste texto normal: >= 4.5:1
- Contraste texto grande: >= 3:1
- Focus: outline 2px solid #1C3177, offset 2px
- Botones solo icono: aria-label siempre
- Inputs: <label htmlFor> en cada campo
- Modales: focus trap + role="dialog" aria-modal
- Tablas: <th scope="col|row"> en todos los headers
- Touch targets: 44x44px minimo
- prefers-reduced-motion: siempre respetado

---

## 8. Anti-Patrones — Prohibidos

- Emojis como iconos              -> usar Lucide React
- Colores inline style={}         -> usar tokens Tailwind o CSS vars
- Fuentes genericas               -> solo Inter + JetBrains Mono
- Modales full-width en desktop   -> max-w-2xl siempre
- Inputs sin label                -> siempre asociar label
- IA ejecutando escrituras solas  -> siempre tarjeta de confirmacion previa
- Indigo #4F46E5 generico         -> usar #1C3177 institucional de UOD

---

## 9. Checklist — Pantalla Terminada

- [ ] Contraste >= 4.5:1 verificado
- [ ] Focus visible en todos los elementos (test con Tab)
- [ ] Responsive: 375px, 768px, 1024px, 1440px sin desbordamiento
- [ ] prefers-reduced-motion respetado
- [ ] Sin emojis como iconos
- [ ] Todas las imagenes tienen alt
- [ ] Todos los inputs tienen label
- [ ] Modo claro y oscuro probados
- [ ] Estados de carga/skeleton implementados
- [ ] Estado vacio disenado (no caja blanca en blanco)
