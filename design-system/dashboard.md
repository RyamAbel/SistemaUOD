# Excepción de Diseño — Pantalla: Panel Principal (Dashboard)
> Referencia base: design-system/MASTER.md

## Componentes Específicos

### KPI Cards (fila superior)
- Grid: `grid-cols-2 md:grid-cols-4 gap-4`
- 4 cards: Total Recursos | Stock Bajo | Préstamos Activos | Movimientos del Mes
- Variante glass: `bg-white/90 backdrop-blur-sm`
- Ícono en `bg-primary/10` (azul) o `bg-green/10` (verde) según categoría

### Gráfico de Barras (movimientos mensuales)
- Librería: Recharts (ya instalado en Next.js)
- Barras: Entradas `#1C3177` | Salidas `#3DAA5C`
- Fondo del área del gráfico: `bg-white rounded-xl border border-[#D1D9E8] p-6`
- Responsive con `<ResponsiveContainer>`

### Tabla Stock Bajo
- Máximo 5 filas visibles + botón "Ver todos →"
- Columnas: Recurso | Categoría | Existencia | Mínimo | Acción
- Fila crítica (existencia = 0): fondo `bg-danger/5`
- Fila advertencia (existencia <= mínimo): fondo `bg-warning/5`

### Widget IA Proactivo
- Card turquesa suave: `bg-ai/5 border border-ai/20 rounded-xl p-4`
- Ícono Bot con animación aiPulse
- Texto de sugerencia en text-text-1
- Botón "Ver sugerencia" → abre Panel IA
- NO ejecuta acciones sola, solo invita a abrir el asistente
