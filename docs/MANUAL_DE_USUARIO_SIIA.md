# Manual de Usuario: SIIA UOD
> **Sistema Inteligente de Inventario y Almacén con IA Integrada**  
> **Universidad Odontológica Dominicana (UOD)**  
> *Versión Final de Producción – Levantamiento Tecnológico 2026*

---

## 1. Introducción y Alcance
**SIIA** es la plataforma institucional desarrollada para el control, trazabilidad, depreciación y auditoría física de los **341 activos tecnológicos físicos** y las existencias de almacén de la **Universidad Odontológica Dominicana (UOD)** en sus **49 dependencias y clínicas odontológicas**.

> [!NOTE]
> **Alcance Estricto Institucional:**  
> SIIA está diseñado para la gestión patrimonial de activos fijos de tecnología y suministros de almacén. No gestiona historias clínicas, cirugías dentales, expedientes académicos, ventas ni compras (las adquisiciones y facturas se tramitan externamente).

---

## 2. Acceso y Seguridad Unificada
- **Autenticación Exclusiva:** Google OAuth 2.0 institucional (`@uod.edu.do`). No requiere contraseñas locales.
- **Control de Invitaciones:** Solo correos expresamente registrados o invitados pueden ingresar al sistema.
- **Política de Roles Unificada:** Todo el personal registrado accede con permisos operativos completos para agilizar las labores de inventario. Toda acción de creación, traslado o baja queda registrada de forma inmutable en la bitácora de auditoría (cumplimiento Ley 172-13).

---

## 3. Mapa de Secciones y Funcionalidades (10 Módulos)

El sistema organiza sus funciones en 10 secciones sin duplicidades:

```
SIIA UOD
├── 1. Panel de Control (Dashboard)
├── 2. Catálogo de Recursos
├── 3. Activos Fijos (Equipos TI)
├── 4. Movimientos y Traslados
├── 5. Dependencias y Ubicaciones
├── 6. Inventario Físico (Auditoría)
├── 7. Mantenimiento Técnico
├── 8. Centro de Alertas
├── 9. Reportes y Análisis
└── 10. Configuración del Sistema
```

---

### Módulo 1: Panel de Control (Dashboard)
- **Tarjetas KPI en tiempo real:**
  - *Total Equipos:* 341 unidades físicas registradas.
  - *En Uso Operativo:* 337 unidades (98.8% de operatividad).
  - *En Almacén:* 1 unidad disponible para asignación.
  - *Requieren Revisión:* 3 unidades inactivas o dañadas.
  - *Dependencias:* 49 clínicas, aulas y departamentos auditados.
  - *Modelos TI:* 113 referencias en catálogo.
- **Gráfico de Dependencias:** Distribución de las dependencias con mayor dotación tecnológica (Tecnología, Rectoría, Contabilidad, Clínicas Odontológicas).
- **Movimientos Recientes:** Trazabilidad de los últimos traslados o asignaciones ejecutadas con enlace directo al historial completo.

---

### Módulo 2: Catálogo de Recursos
- **Visualización Dual:** Alternancia instantánea entre vista de **Tabla densa** (para gestión rápida) y **Cuadrícula de tarjetas** (con especificaciones técnicas y fotos).
- **Filtros Combinables:** 17 filtros por categoría (Computación, Monitores, Periféricos, Redes, UPS, Impresión, Multimedia), estado y costo.
- **Ficha Técnica Detallada:** Galería de fotos, desglose de stock por dependencia, listado de números de serie y placa institucional.
- **Generador de Etiquetas QR:** Impresión individual o masiva en lote con 3 tamaños estandarizados:
  - *Compacta (45x25mm):* Para periféricos pequeños o teléfonos.
  - *Estándar (60x35mm):* Para CPUs, monitores e impresoras.
  - *Grande (80x50mm):* Para racks, switches y servidores.

---

### Módulo 3: Activos Fijos (Equipos Tecnológicos)
- **341 Activos Reales:** Trazabilidad individual desde `EQ-01` hasta `EQ-341` con número de serie de fabricante, custodio y notas.
- **Agrupación por Tipo:** Vista plegada por defecto que organiza los activos por tipo de equipo con botones de «Expandir todo» y «Contraer todo».
- **Depreciación DGII (Categoría 2):** Cálculo automático de la depreciación acumulada y valor en libros conforme a la normativa fiscal dominicana (tasa lineal del 25% anual / 48 meses de vida útil).
- **Acta de Descargo Patrimonial:** Generación de actas oficiales con dictamen técnico y firmas de autorización institucional (TI, Auditoría y Rectoría).

---

### Módulo 4: Movimientos y Traslados
- **Asistente Transaccional (Wizard de 3 Pasos):**
  1. *Selección de Operación:* Traslado entre dependencias, entrada de almacén, salida de asignación, ajuste de inventario o baja.
  2. *Líneas y Series:* Selección de recurso, activo físico (`EQ-XX`) y motivo justificado.
  3. *Previsualización y Confirmación:* Verificación de stock origen y destino, impacto patrimonial y validación anti-stock negativo.
- **Comprobante Oficial:** Emisión de volante de movimiento en formato PDF con correlativo institucional (`MOV-YYYY-XXXXXX`).

---

### Módulo 5: Dependencias y Ubicaciones
- **Jerarquía Institucional:** Árbol desplegable de las 49 sedes, clínicas odontológicas y dependencias UOD.
- **Control de Activos Asignados:** Cada dependencia muestra en tiempo real los equipos físicos que tiene bajo su custodia.
- **Protección Patrimonial:** El sistema bloquea el borrado de cualquier ubicación que contenga activos o existencias registradas.

---

### Módulo 6: Inventario Físico (Auditoría en Terreno)
- **Sesiones de Auditoría por Dependencia:** Al iniciar un conteo para una ubicación, el sistema precarga automáticamente los activos reales asignados a esa sala.
- **Escáner Continuo PWA:** Lectura de códigos QR institucionales directamente desde la cámara trasera de teléfonos móviles o lectores ópticos.
- **Comparativa Automática:** Indicador visual de activos *Encontrados*, *No encontrados* y *Sobrantes / Inesperados*.
- **Cierre y Ajuste:** Generación del acta oficial de auditoría con balance, diferencias cuantitativas y firmas responsables.

---

### Módulo 7: Mantenimiento Técnico
- **Órdenes de Servicio:** Registro de intervenciones técnicas preventivas y correctivas para equipos informáticos.
- **Historial del Activo:** Registro cronológico de reparaciones, diagnósticos y repuestos instalados por placa institucional (`EQ-XX`).
- **Cambio Automático de Estado:** Si un equipo ingresa a mantenimiento correctivo, se marca automáticamente como *Requiere Revisión*.

---

### Módulo 8: Centro de Alertas
- **Contador en Cero:** No genera alertas decorativas ni falsos positivos al abrir pantallas o iniciar sesión.
- **Disparadores Reales:** Genera avisos únicamente ante eventos reales de inventario (movimientos, activos bajo stock mínimo o mantenimientos vencidos).
- **Persistencia de Lectura:** Marcar alertas como leídas o descartadas se guarda en la base de datos Supabase y actualiza de inmediato el contador de la campana.

---

### Módulo 9: Reportes y Análisis
- **Exportaciones Tabulares:** Descarga del inventario completo a formatos CSV y Excel con metadatos institucionales UOD.
- **Métricas Financieras:** Resumen de valor histórico de adquisición, valor neto depreciado en libros y distribución por dependencia.
- **Acta de Entrega de Custodia:** Generación de actas formales de asignación de equipos a docentes y colaboradores con firmas de descargo.

---

### Módulo 10: Configuración del Sistema
- **Mi Perfil:** Actualización de nombre institucional, departamento, cargo y fotografía de perfil (almacenada en Supabase Storage).
- **Apariencia:** Alternancia entre **Modo Claro** (blanco clínico institucional `#F7F9FC`) y **Modo Oscuro** (azul naval profundo `#0D1B2A`).
- **Densidad de Datos:** Selector de interfaz **Cómoda** (espaciado generoso para lectura) o **Compacta** (alta densidad de filas para auditoría intensiva).
- **Persistencia en la Nube:** Las preferencias se guardan por usuario en `perfiles.preferencias` y se conservan al cerrar sesión o cambiar de dispositivo.

---

## 4. Asistente de IA Integrado (Gemini)

- **Acceso Rápido:** Presiona el botón flotante con el icono de chispas o utiliza el atajo global de teclado **`Ctrl + K`** (o `Cmd + K` en Mac).
- **Modos de Operación:**
  - *Modo Operativo:* Responde consultas de existencias en tiempo real, busca la ficha técnica de cualquier placa (`EQ-01` a `EQ-341`), y formula propuestas de traslado.
  - *Modo Tutor:* Explica normativas institucionales, guías paso a paso para actas de entrega, fórmulas de depreciación DGII y procedimientos de descargo.
- **Gobierno Estricto de la IA:** Las acciones propuestas por la IA **nunca** se ejecutan solas; generan una tarjeta interactiva de impacto que requiere confirmación explícita mediante botón por parte del usuario.

---

## 5. Atajos y Recomendaciones para Móviles (PWA)
1. **Instalación como App:** Desde Google Chrome o Safari, selecciona *«Agregar a la pantalla de inicio»* para utilizar SIIA como una aplicación nativa.
2. **Escaneo Óptico:** En la barra superior, pulsa el icono de la cámara para activar el visor continuo con linterna integrada.
3. **Impresión Térmica:** Al generar etiquetas QR, el sistema elimina cabeceras y márgenes de página automáticamente mediante reglas CSS `@media print`.
