# Excepción de Diseño — Pantalla: Panel Asistente IA
> Referencia base: design-system/MASTER.md

## Estructura Completa

### Header del Panel
- Gradiente: `bg-gradient-to-r from-[#1C3177] to-[#06B6D4]`
- Logo/ícono Bot: text-white w-8 h-8
- Título: "Asistente SIIA" font-semibold text-white
- Punto de estado activo: `w-2 h-2 rounded-full bg-white animate-ai-pulse`
- Botón colapsar (ChevronRight) en desktop — visible en hover

### Área de Conversación
- `overflow-y-auto flex-1 p-4 space-y-3`
- Burbuja Usuario: `bg-primary text-white rounded-xl rounded-br-sm`
- Burbuja IA: `bg-[#EEF2F8] border-l-2 border-ai text-text-1 rounded-xl rounded-bl-sm`
- Timestamp: text-xs text-text-muted, debajo de cada burbuja
- Indicador "escribiendo": 3 puntos con animación bounce, burbuja IA vacía

### Tarjeta de Propuesta (CRÍTICO)
- Disparada cuando IA propone una acción de escritura
- `bg-warning/5 border border-warning/30 rounded-xl p-4 my-2`
- Header: AlertTriangle (warning) + "Acción Propuesta por la IA"
- Cuerpo: descripción clara del impacto (qué recurso, qué cambio, cuántas unidades)
- Footer: "Confirmar" (bg-green) | "Cancelar" (outline)
- La escritura NUNCA ocurre antes de que el usuario presione "Confirmar"

### Input de Mensaje
- `flex gap-2 p-3 border-t border-[#D1D9E8]`
- Textarea: auto-resize, placeholder "Escríbele al asistente..."
- Botón Send: `bg-primary rounded-lg p-2` con ícono Send
- Enter envía, Shift+Enter nueva línea

## Comportamiento Mobile
- FAB: `fixed bottom-6 right-6 w-14 h-14 rounded-full bg-ai shadow-ai`
  - Ícono MessageSquare text-white
  - Al tocar: abre drawer fullscreen con transición slide-from-right
- Drawer: h-full w-full bg-white, misma estructura que desktop
