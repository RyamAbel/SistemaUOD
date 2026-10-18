# Excepción de Diseño — Pantalla: Catálogo de Recursos
> Referencia base: design-system/MASTER.md

## Layout Específico

### Filtros Laterales
- Sidebar de filtros: `w-64 shrink-0` en desktop, drawer en mobile
- Filtros: Categoría (árbol colapsable) | Ubicación | Estado | Rango de stock
- Botón "Limpiar filtros" en text-danger si hay filtros activos

### Barra de Herramientas
- Buscador: `flex-1 max-w-md` con ícono Search y placeholder "Buscar recurso, código..."
- Toggle vista: Grid (LayoutGrid) / Lista (LayoutList) — estado guardado en localStorage
- Botón "Nuevo Recurso": `bg-primary text-white` con ícono Plus

### Vista Grid
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- Componente ResourceCard (ver MASTER.md §6e)
- Estado vacío: ilustración + "No se encontraron recursos" + "Limpiar filtros"

### Vista Lista
- Tabla compacta (ver MASTER.md §6d)
- Columnas: Foto (40px) | Código | Nombre | Categoría | Ubicación | Stock | Estado | Acciones

### Paginación
- 25 items por página por defecto
- Selector: 10 / 25 / 50 / 100
- Estilo: "Mostrando 1–25 de 248 recursos"
