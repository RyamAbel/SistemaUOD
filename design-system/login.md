# Excepción de Diseño — Pantalla: Login
> Referencia base: design-system/MASTER.md

## Diferencias con el layout global

- SIN sidebar, SIN topbar, SIN panel IA
- Fondo: gradiente lineal `from-[#0D1B2A] to-[#1C3177]` (fondo marino con gradiente primario)
- Logo UOD centrado en la parte superior de la card, tamaño grande (120px)
- Una sola card centrada: `bg-white max-w-sm w-full rounded-2xl shadow-lg p-8`
- Un único botón de acción: "Continuar con Google"
  - Estilo: `bg-white border border-[#D1D9E8] hover:bg-[#EEF2F8]`
  - Incluye logo SVG de Google + texto "Continuar con Google"
  - Ancho completo del card
- Texto de aviso: "Solo cuentas autorizadas por la institución" (text-muted, text-xs, centrado)
- Enlace de soporte: "¿Problemas para acceder? Contacta a TI" (text-ai text-xs)
- Sin formulario de usuario/contraseña (OAuth exclusivo)

## Paleta en esta pantalla
- Fondo: gradiente marino
- Card: blanco puro #FFFFFF
- Logo UOD: versión en color (azul marino + verde)
- Texto principal: #1C3177
- Texto muted: #8A9AB8
