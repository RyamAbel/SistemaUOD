# Mejoras de SIIA – ideas reforzadas y prompts para Antigravity

Oct 22, 2026 · @ryam

Tus 14 ideas, reescritas con criterios claros de «terminado» y un prompt listo para cada una, en el orden en que conviene hacerlas. La intención de cada idea es la tuya; lo que añadí es precisión para que Antigravity no tenga que adivinar.

**Roles: por ahora no hay roles.** Todos los usuarios registrados tienen el mismo acceso, por eso los prompts ya no mencionan permisos por tipo de usuario. Como cualquiera podrá editar y dar de baja, se mantienen la bitácora (quién hizo qué y cuándo) y la confirmación antes de borrar o dar de baja. Si el sistema ya tenía roles, Antigravity los deja desactivados sin borrar su base, para poder activarlos más adelante.

## Orden recomendado

| Fase | Ideas | Por qué en este orden |
| --- | --- | --- |
| 0. Preparación | Prompt 0 | Fija el alcance real (almacén) y protege el trabajo |
| 1. Limpieza y base | 4, 7, 8, 12 | Primero datos reales, acceso, perfil y configuración; todo lo demás se prueba sobre esto |
| 2. Núcleo de inventario | 2, 1, 3 | Edición de activos, agrupación y entradas, que son la base del trabajo diario |
| 3. Documentos y reportes | 6, 5, 11 | Dependen de que el inventario y los movimientos ya estén bien |
| 4. Alertas e IA | 10, 9 | Reaccionan a los movimientos y consultan los datos ya corregidos |
| 5. Mejora visual | 14 | Se hace cuando las funciones ya son estables |
| 6. Verificación final | 13 | Recorrido completo; repítelo al terminar cada fase en pequeño |

## Prompt 0 – Preparación y alcance

```text
Antes de cambiar nada, crea una rama nueva (mejoras-v2) y dime cómo hacer una copia de seguridad de la base de datos. Actualiza AGENTS.md con este alcance: SIIA es el sistema de inventario y almacén de [nombre de la institución]; maneja activos fijos y suministros del almacén; no maneja procesos clínicos, cirugías ni odontología, ni libros, ni contabilidad, ni ventas. Lee design-system/MASTER.md antes de tocar cualquier pantalla. Por ahora SIIA no usa roles: todos los usuarios registrados tienen el mismo acceso y no debe haber selectores, pantallas ni restricciones por rol; si ya existe lógica de roles, déjala desactivada sin borrar su base para poder activarla más adelante. Después espera mis siguientes instrucciones.
```

## Fase 1 – Limpieza y base

### Idea 4 – Quitar todo lo clínico y los datos de prueba

**Qué quieres:** que el sistema sea solo un almacén, sin rastro de odontología, cirugías ni procedimientos clínicos, y sin información de prueba: únicamente tu información original.

**Criterio de terminado:**

- No queda texto, dato, categoría, reporte ni respuesta de la IA clínica o de ejemplo en ninguna pantalla.
- Lo borrado fue aprobado por ti antes y se hizo con copia de seguridad.
- El sistema queda funcionando y vacío (o con tu inventario real cargado), con estados vacíos claros.

**Prompt 4.1 – Inventario de lo que se va a eliminar (sin borrar nada)**

```text
Busca en todo el proyecto (código, textos de la interfaz, menús, base de datos, datos semilla, nombres de categorías, reportes, respuestas del asistente de IA y documentación) todo lo relacionado con cirugías, procedimientos clínicos, pacientes u odontología, y todos los datos de prueba, demostración o ejemplo. No borres nada todavía: entrégame una lista agrupada por ubicación (archivo o tabla) que diga qué es y qué propones hacer (eliminar, reemplazar o renombrar). Distingue lo que es dato de prueba de lo que podría ser un dato real mío; ante la duda, márcalo como «preguntar». Espera mi aprobación.
```

**Prompt 4.2 – Eliminar y dejar el sistema limpio**

```text
Con la lista aprobada, elimina lo clínico y los datos de prueba mediante una migración o script reversible, con copia de seguridad previa y sin tocar datos reales. Deja el sistema funcionando y vacío con estados vacíos claros (por ejemplo: «Aún no hay activos. Agrega el primero o importa tu Excel»). Si te entrego mi inventario original en [archivo], impórtalo con validación previa y vista previa de lo que se creará. Verifica que no quede ningún texto ni dato clínico o de prueba en pantallas, reportes ni respuestas del asistente.
```
```

### Idea 8 – Editar perfil

**Qué quieres:** que cada usuario pueda actualizar sus datos personales y su foto de perfil.

**Criterio de terminado:** el usuario cambia nombre, cargo, teléfono y foto; la foto nueva se ve al instante en todo el sistema; no puede editar el perfil de otros.

```text
Agrega la pantalla «Editar perfil», accesible desde el menú de usuario: el usuario puede cambiar nombre, apellidos, cargo, departamento, teléfono y foto de perfil (subir o tomar foto, con recorte y vista previa, máximo 5 MB, JPG, PNG o WebP). El correo se muestra pero no se edita. Valida los campos, muestra mensajes de éxito y error, guarda el cambio en la bitácora y refleja la foto y el nombre nuevos de inmediato en el menú, el encabezado y el historial. Cada usuario solo puede editar su propio perfil.
```

### Idea 12 – Configuración funcional y cierre de sesión

**Qué quieres:** una Configuración que sirva: tema oscuro que cambie toda la página y un botón de cerrar sesión que realmente cierre.

**Criterio de terminado:** el tema se aplica al instante y se recuerda; cerrar sesión te lleva al login y, al volver atrás en el navegador, no se ve información.

```text
Haz funcional la opción «Configuración» del perfil: tema claro, oscuro o automático según el dispositivo (se guarda por usuario y se aplica al instante en todo el sistema, incluidos gráficos, tablas y componentes, con buen contraste), preferencias de notificación (qué avisos recibir y si por correo o solo en pantalla) y densidad de tablas (cómoda o compacta). Haz que el botón «Cerrar sesión» cierre realmente la sesión, borre los datos locales sensibles, invalide el acceso y redirija al login; verifica que al volver atrás en el navegador no se vea información. No agregues opciones que no funcionen.
```

## Fase 2 – Núcleo de inventario

### Idea 2 – Editar cualquier dato de un activo (incluida la factura)

**Qué quieres:** poder editar todo de cada activo: foto, descripción, QR, ubicación y subir la factura real.

**Criterio de terminado:** todos los campos son editables; la factura se sube, se ve y se descarga; cada cambio queda en el historial.

```text
Mejora la edición de activos fijos: desde la ficha y desde la lista, un botón «Editar» abre un formulario con todos los campos modificables: nombre, descripción, categoría, marca, modelo, número de serie, estado, ubicación, responsable, fecha y costo de adquisición, proveedor, observaciones, foto principal y fotos adicionales (agregar, reemplazar, eliminar y elegir la principal), código QR (regenerarlo, imprimirlo o asociar el código del fabricante) y documentos adjuntos, incluida la factura real de cada activo (PDF o imagen de hasta [10 MB], con vista previa y descarga; se puede reemplazar conservando el historial). Valida duplicados de serie y de código. Cada cambio se registra en la bitácora con el valor anterior y el nuevo, y la ficha muestra una pestaña «Historial». Cualquier usuario registrado puede editar y la bitácora conserva quién hizo cada cambio.
```

### Idea 1 – Ver los activos agrupados por tipo

**Qué quieres:** una vista donde todas las bocinas estén juntas, todas las laptops juntas, etc., como una opción de filtro.

**Criterio de terminado:** un selector alterna entre lista normal y vista agrupada; cada grupo se expande y muestra sus unidades y cuántas hay por estado.

```text
En el catálogo agrega la opción «Agrupar por tipo de activo»: un selector que alterna entre la lista normal y una vista agrupada donde cada grupo (por ejemplo, Bocinas, Laptops o Monitores) es una sección que se expande y muestra las unidades individuales del grupo, con la cantidad total, cuántas están disponibles, en uso, en mantenimiento o dañadas, y una foto de muestra. Debe funcionar junto con los filtros existentes (ubicación, estado, responsable), con la búsqueda y con el orden alfabético o por cantidad. Los grupos salen de la categoría o tipo de activo; los activos sin tipo aparecen en «Sin clasificar» con un aviso para completarlos.
```

### Idea 3 – Rediseñar Movimientos, empezando por Entrada

**Qué quieres:** que Entrada sirva tanto para agregar productos nuevos al almacén como para sumar más unidades de un activo que ya existe, y que el resto de Movimientos quede coherente.

**Criterio de terminado:** Entrada ofrece dos caminos claros; agregar unidades de un activo genera cada unidad con su serie y QR; todo muestra vista previa antes de guardar.

```text
Ajusta por completo la sección Movimientos, empezando por «Entrada». La entrada debe ofrecer dos caminos claros: (A) «Nuevo producto o activo»: crea el recurso nuevo (con foto, categoría, ubicación, costo y factura) y registra sus unidades iniciales; (B) «Agregar más unidades de un recurso existente»: busca el recurso, indica la cantidad y, si son activos individuales, genera una unidad por cada una con su número de serie y su código QR propios (permitiendo cargar varios números de serie a la vez); si es un suministro por cantidad, suma la cantidad. Ambos caminos piden ubicación de destino, proveedor, fecha, documento o factura y motivo; muestran una vista previa del efecto en existencias antes de guardar; y quedan en la bitácora. Revisa también salida, traslado, ajuste y baja para que sigan el mismo estilo, sin opciones confusas ni duplicadas.
```

## Fase 3 – Documentos y reportes

### Idea 6 – Acta oficial de entrega acorde al inventario

**Qué quieres:** que el acta corresponda a un almacén real, con los activos que se entregan.

**Criterio de terminado:** el acta se genera con datos reales, sin campos clínicos, en PDF y reimprimible.

```text
Rehaz el «Acta oficial de entrega» para que corresponda al inventario real de la institución: se genera al entregar uno o varios activos o suministros a una persona o departamento, con encabezado institucional (nombre y logo), número de acta consecutivo, fecha, quien entrega, quien recibe, departamento, lista de activos (código, nombre, marca y modelo, número de serie, estado y cantidad), observaciones, texto de responsabilidad sobre los bienes y espacios para firma. Elimina cualquier campo o texto que no corresponda a un almacén (clínico, pacientes, procedimientos). Se genera en PDF, queda asociada a los movimientos, se puede reimprimir y descargar desde la ficha de la persona o del activo. Toma todos los datos del sistema real, nunca de ejemplos fijos.
```

### Idea 5 – Reportes y análisis reales

**Qué quieres:** reportes basados en el inventario real y sin «valor neto en libros».

**Criterio de terminado:** cada total coincide con un conteo directo en la base de datos; no aparece lenguaje contable de libros.

```text
Corrige «Reportes y análisis» para que todo salga del inventario real de la base de datos y no de números fijos o de ejemplo: totales de activos y suministros, activos por estado, por categoría y por ubicación, movimientos por mes (entradas, salidas y traslados), activos con pocas unidades y consumo por departamento. Elimina «valor neto en libros» y cualquier término de libros o contabilidad; en su lugar muestra «Costo de adquisición total» solo con los costos que estén registrados, indicando cuántos activos no tienen costo. Cada tarjeta y gráfico debe cuadrar con las listas del catálogo, con filtros por fecha, ubicación y categoría, estados vacíos si no hay datos y exportación a PDF y Excel. Al final, demuéstrame con una tabla que los totales del reporte coinciden con un conteo directo en la base de datos.
```

### Idea 11 – Documento de reposición de activos

**Qué quieres:** generar un documento con los activos que se están acabando.

**Criterio de terminado:** el documento sale en PDF y Excel con los activos bajo su mínimo, con cantidad sugerida a reponer.

```text
En «Activos fijos» agrega la opción «Generar documento de reposición»: lista los activos y suministros con pocas unidades según el mínimo configurado por cada uno (si un activo no tiene mínimo, avísame y permite definirlo en el momento). El documento incluye fecha, quién lo genera y, por cada activo, foto, nombre, categoría, unidades actuales, mínimo, cantidad sugerida a reponer y proveedor habitual. Se puede filtrar por categoría o ubicación, elegir cuáles incluir, exportar a PDF y Excel y guardar en un historial de documentos generados. Debe usar los datos reales del inventario.
```

## Fase 4 – Alertas e IA

### Idea 10 – Alertas funcionales

**Qué quieres:** notificaciones reales cuando se hace cualquier movimiento o un activo se está acabando.

**Criterio de terminado:** al hacer una entrada, una salida y un traslado de prueba, aparecen las tres alertas en la campana y en la pantalla de Alertas, con quién, qué y cuánto.

```text
Haz funcional el apartado de Alertas con notificaciones reales en tiempo real: se generan automáticamente cuando alguien registra una entrada, una salida o entrega, un traslado a otro departamento, un ajuste, una baja, una edición importante o una asignación, y cuando un activo o suministro baja de su mínimo o se agota. Cada alerta dice quién lo hizo, qué recurso, cantidad, origen y destino, fecha y hora, y enlaza a la ficha. Se muestran en una campana con contador de no leídas en el encabezado y en la pantalla de Alertas, con filtros por tipo, prioridad y estado (nueva, leída o resuelta), marcar como leída o resuelta y marcar todas. Todos los usuarios registrados reciben las alertas, respetando las preferencias de Configuración. Evita duplicados y no muestres alertas de datos que ya no existen. Pruébalo haciendo un movimiento de cada tipo.
```

### Idea 9 – IA más precisa y funcional

**Qué quieres:** una IA lo más exacta posible, que realmente ayude y pueda operar el inventario.

**Criterio de terminado:** acierta al menos 95 % de un conjunto de 40 pruebas; nunca inventa cifras; toda acción de escritura pide confirmación.

```text
Mejora la precisión del asistente de IA: debe responder solo con datos reales del inventario consultándolos mediante funciones (nunca de memoria ni inventando cifras); si no encuentra algo, lo dice. Revisa y mejora sus instrucciones, la interpretación de nombres parecidos (por ejemplo, «bocina» y «bocinas»), las ambigüedades (pregunta antes de actuar) y la conversión de lenguaje natural a filtros. Cada acción de escritura debe mostrar una vista previa y pedir confirmación. Elimina cualquier conocimiento o ejemplo clínico, de libros o de datos de prueba. Crea un conjunto de 40 preguntas y acciones de prueba (consultas, filtros, entradas, salidas, traslados, edición de activos y preguntas fuera de tema) y preséntame una tabla con la respuesta esperada, la obtenida y si fue correcta; corrige hasta que acierte al menos el 95 %.
```

## Fase 5 – Mejora visual

### Idea 14 – Dashboard y catálogos más dinámicos

**Qué quieres:** una apariencia más moderna, viva e interactiva.

**Criterio de terminado:** apruebas una propuesta visual antes de implementarla; se ve bien en celular y en modo oscuro; carga rápido.

```text
Dale un update visual dinámico al dashboard y a los catálogos siguiendo design-system/MASTER.md: tarjetas de indicadores con números que se animan al cargar, gráficos interactivos con información al pasar el cursor y filtros por periodo, accesos rápidos, actividad reciente en vivo, tarjetas de activos con foto y efecto al pasar el cursor, vista de tabla y de tarjetas intercambiable con transición suave, esqueletos de carga, estados vacíos con ilustración, microinteracciones en botones y al guardar, y modo oscuro cuidado. Respeta la accesibilidad (contraste, teclado y la opción de reducir movimiento) y que cargue rápido en celular. Muéstrame primero una propuesta o vista previa para aprobarla.
```

## Fase 6 – Verificación final

### Idea 13 – Recorrido completo, sección por sección

**Qué quieres:** que todo funcione, cada función de cada sección.

**Criterio de terminado:** un informe con cada función probada, lo corregido y lo pendiente; cero botones sin acción.

```text
Haz un recorrido completo de la aplicación, sección por sección (login, dashboard, catálogo, activos fijos, movimientos, reportes y análisis, alertas, acta de entrega, asistente de IA, perfil y configuración, administración), y prueba cada botón, formulario, filtro y exportación con un usuario registrado, en computadora y en celular, en modo claro y oscuro. Para cada sección entrégame una tabla con la función probada, el resultado (funciona, falla o a medias), el error encontrado y la causa. Corrige todo lo que falle, vuelve a probarlo y entrégame al final un informe de lo corregido y lo pendiente. Busca específicamente: botones sin acción, datos de ejemplo, textos clínicos o de libros, totales que no cuadran, errores de consola y pantallas rotas en celular.
```

## Si algo falla durante estas mejoras

```text
Esto falló: [describe o pega el error]. Antes de cambiar nada, analiza la causa probable, dime qué evidencia usaste y propón la solución más pequeña posible.
```

```text
Detente. Cambiaste más de lo que pedí. Deshaz lo que no corresponde a esta tarea y deja solo [la tarea concreta].
```

Cuando termines una fase, repite un mini recorrido (el prompt de la idea 13, pero solo sobre lo que tocaste) para detectar fallas antes de seguir con la siguiente.
