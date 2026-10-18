# Excepción de Diseño — Pantalla: Ficha de Recurso
> Referencia base: design-system/MASTER.md

## Layout Desktop (2 columnas)

### Columna Izquierda (40%)
- Foto principal: rounded-xl, aspect-ratio 4/3, object-cover
- Galería de miniaturas: flex row, 4 fotos max, scrollable
- Código QR: card centrada con botón "Descargar QR" (bg-primary)
- Botón "Tomar foto" (si hay cámara disponible en el dispositivo)

### Columna Derecha (60%)
- Nombre del recurso: h1 text-primary
- Código (JetBrains Mono): badge bg-[#EEF2F8]
- Badge de estado (ver MASTER.md §6c)
- Datos clave en grid 2×2: Categoría | Ubicación | Stock Actual | Stock Mínimo
- Tabs: Información | Movimientos | Mantenimientos | Asignaciones/Préstamos

### Botones de Acción (sticky en mobile)
- "Asignar" (bg-primary)
- "Prestar" (bg-green) — solo si el recurso es prestable
- "Reportar incidencia" (outline)
- "Dar de baja" (text-danger outline) — solo para roles autorizados

## Layout Mobile (1 columna, apilado)
- Foto + galería arriba
- Datos y tabs debajo
- Botones de acción: barra sticky bottom-0 bg-white border-t
