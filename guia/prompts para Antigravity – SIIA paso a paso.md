# Arreglos finales de SIIA – cierre del proyecto

Oct 22, 2026 · @ryam

**Todo lo que se haga con esta guía es para dar el proyecto por terminado.** Esto no es una ronda más de mejoras: es la ronda final. Al terminarla, SIIA debe quedar con tus datos reales, con todas sus funciones trabajando sin fallos y sin nada repetido ni sobrante.

## Reglas de cierre (no negociables)

| # | Regla | Qué significa en la práctica |
| --- | --- | --- |
| 1 | Sin datos de prueba ni inventados | Solo existe lo que está en tu Excel original. Si algo no está en el Excel, no existe en el sistema |
| 2 | Todo funcional y conectado | Lo que se crea o se cambia en un lugar se ve en todos: catálogo, activos fijos, movimientos, conteos, dashboard, reportes, alertas y asistente de IA |
| 3 | Sin funciones repetidas | Cada función vive en una sola sección; en las demás, a lo sumo, hay un enlace |
| 4 | Nada decorativo ni innecesario | Si una opción, botón, pantalla o tarjeta no hace nada útil, se elimina |
| 5 | Sin fallos | Cada arreglo se prueba antes de darlo por bueno, y las pruebas no dejan datos nuevos |
| 6 | Sin roles por ahora | Todos los usuarios registrados tienen el mismo acceso |
| 7 | Copia de seguridad antes de borrar | Todo borrado es reversible y se muestra primero para tu aprobación |

## Orden recomendado

| Fase | Arreglos | Por qué en este orden |
| --- | --- | --- |
| 1. Datos reales | Prompts 0, 1 y 2, luego 3, 6 y 9 | Primero el sistema debe coincidir con el Excel; todo lo demás se prueba sobre datos reales |
| 2. Activos | 1, 8 y 7 | Los activos son el centro: que se vean, tengan factura, no haya funciones repetidas y la agrupación se comporte bien |
| 3. Módulos | 4, 5 y 2 | Inventario físico, alertas y configuración dependen de datos y funciones ya correctos |
| 4. Cierre | F1 a F4 | Auditoría final, recorrido completo, cuadre con el Excel y entrega |

## Fase 1 – Datos reales

**Prompt 0 – Reglas de cierre (pegar primero)**

```text
Este es el cierre final del proyecto SIIA. Guarda estas reglas en AGENTS.md y cumplelas en todo lo que hagas: (1) no puede existir ningún dato de prueba o inventado, solo lo que esté en mi Excel original en docs/datos-originales; (2) todo debe ser funcional y estar conectado: lo que se crea o cambia en un lugar se ve en todas las pantallas, reportes, alertas y en el asistente; (3) ninguna función puede estar repetida en dos secciones; (4) elimina todo lo decorativo o innecesario; (5) cada cambio se prueba antes de darlo por bueno y las pruebas no dejan datos; (6) no hay roles por ahora; (7) haz copia de seguridad antes de borrar y muéstrame lo que vas a eliminar antes de ejecutarlo. Responde con un resumen de cómo vas a trabajar y espera mi siguiente instrucción.
```

**Prompt 1 – Auditoría de datos contra el Excel (sin cambiar nada)**

```text
Lee el Excel original en docs/datos-originales. Compara cada dato de la base de datos con el Excel: activos (total y por categoría), ubicaciones, categorías, proveedores (si el Excel los trae), estados y responsables. Entrégame una tabla con tres partes: lo que está en el Excel y no en el sistema, lo que está en el sistema y no en el Excel (dato inventado o de prueba) y lo que difiere (por ejemplo, escrito distinto). No borres ni cambies nada todavía; espera mi aprobación.
```

**Prompt 2 – Dejar el sistema igual al Excel**

```text
Con la tabla aprobada, haz una copia de seguridad y deja el sistema exactamente igual a mi Excel: elimina lo que no está en el Excel, importa lo que falta y corrige lo que difiere, de forma reversible. No inventes ningún dato. Al terminar, vuelve a comparar y demuéstrame que la diferencia es cero.
```

Verifica tú: el total de activos del sistema es el mismo número que tu Excel.

### Arreglo 3 – Quitar «Proveedores y compras»

**Lo que viste:** dos empresas que no conoces, aunque pediste que no se inventara nada.

**Lo que debe quedar:** la sección eliminada. Si tu Excel trae el proveedor de cada activo, solo queda como un dato del activo, con los valores exactos del Excel.

```text
Elimina por completo la sección «Proveedores y compras»: menú, pantallas, endpoints, tablas, accesos rápidos, tarjetas del dashboard, reportes, alertas, respuestas del asistente y cualquier enlace o texto que la mencione. Las dos empresas que aparecen no están en mi Excel original: no las conserves. Si el Excel trae una columna de proveedor por activo, consérvala solo como un campo de texto del activo con los valores exactos del Excel, sin crear empresas ni compras nuevas. Revisa qué otras funciones dependían de esta sección (por ejemplo, el documento de reposición o las alertas) y ajústalas para que sigan funcionando sin ella. Haz copia de seguridad antes y muéstrame la lista de lo que vas a eliminar antes de ejecutar.
```

Verifica tú: ya no hay menú ni enlaces de proveedores y compras, y ninguna otra pantalla da error.

### Arreglo 6 – Reiniciar Mantenimiento

**Lo que viste:** mantenimientos que tú nunca programaste.

**Lo que debe quedar:** el módulo vacío, como nuevo, pero totalmente funcional para cuando empiecen los mantenimientos reales.

```text
Reinicia el módulo de «Mantenimiento»: elimina todos los mantenimientos y datos de prueba (programados, realizados, historial, costos, alertas de mantenimiento y contadores asociados) con copia de seguridad previa. Revisa los activos que quedaron en estado «en mantenimiento» por esos datos y devuélvelos al estado que indica mi Excel original. Deja el módulo vacío pero totalmente funcional para uso real: programar mantenimiento por activo (fecha, tipo, responsable y observaciones), registrar uno realizado (fecha, costo y notas), cambio automático del estado del activo al iniciar y al terminar, historial por activo, recordatorios y estados vacíos claros («Aún no hay mantenimientos programados»). Los indicadores del dashboard y de reportes deben mostrar cero hasta que se registren mantenimientos reales. Verifica el flujo completo con un mantenimiento de prueba y elimínalo al terminar.
```

Verifica tú: la sección aparece vacía, el dashboard muestra cero mantenimientos y ningún activo está «en mantenimiento» si tu Excel no lo dice.

### Arreglo 9 – Ubicaciones y su filtro

**Lo que viste:** al filtrar por ubicación faltan algunas.

**Lo que debe quedar:** las ubicaciones del sistema son exactamente las de tu Excel, y el filtro funciona igual en todas las secciones.

```text
El filtro de ubicaciones no funciona del todo bien y le faltan ubicaciones. Compara la lista de ubicaciones del Excel original con la base de datos y muéstrame las diferencias (faltantes, sobrantes y escritas distinto por mayúsculas, acentos o espacios). Con mi aprobación, deja las ubicaciones del sistema exactamente iguales a las del Excel, sin inventar ninguna, y asigna cada activo a su ubicación real. Haz que el filtro de ubicaciones lea siempre las ubicaciones de la base de datos (no una lista fija), muestre la cantidad de activos por ubicación y funcione igual en Catálogo, Activos fijos, Movimientos, Reportes e Inventario físico. Verifica con una tabla que, por cada ubicación, el número de activos que muestra el filtro coincide con el del Excel.
```

Verifica tú: eliges cada ubicación del filtro y la cantidad coincide con tu Excel.

## Fase 2 – Activos

### Arreglo 1 – Producto que no aparece, conteo que no sube y factura que no se ve

**Lo que viste:** agregaste un producto y no aparece en Activos fijos, el conteo no subió, y la factura que subiste no aparece en el detalle. Eso indica que las pantallas no leen la misma información.

**Lo que debe quedar:** una sola fuente de datos; todo se ve en todas partes y el detalle del activo tiene su sección de facturas.

```text
Diagnostica y corrige este problema: agregué un producto y no aparece en «Activos fijos», el contador de activos no subió y la factura que subí no aparece en el detalle del activo. Antes de cambiar nada, encuentra la causa (qué tabla o consulta usa cada pantalla, filtros ocultos por tipo o estado, datos en caché que no se actualizan, o producto guardado como otro tipo) y muéstrmela. Luego corrige para que exista una sola fuente de datos: todo recurso creado debe verse al instante en el Catálogo, Activos fijos, Movimientos, Reportes, Dashboard y en las respuestas del asistente, y los contadores deben calcularse siempre desde la base de datos. En el detalle de cada activo agrega la sección «Facturas y documentos» con la lista de archivos subidos (nombre, fecha y tipo), vista previa, descarga, reemplazo y eliminación con confirmación, y asegura que la factura subida desde cualquier pantalla (alta, edición o entrada) quede asociada a ese activo. Pruébalo creando un activo, verificando que aparece en todas las pantallas, que los contadores suben y que su factura se ve en el detalle; después elimina ese activo de prueba y deja los contadores como estaban.
```

Verifica tú: agregas un activo con factura, lo ves en Catálogo y Activos fijos, el contador sube y la factura aparece en su detalle.

### Arreglo 8 – Funciones repetidas

**Lo que viste:** traslado está en Movimientos y en Activos, y editar está en el Catálogo y en Activos fijos.

**Lo que debe quedar:** cada función en una sola sección, según este mapa.

| Sección | Es el lugar de |
| --- | --- |
| Catálogo | Solo consulta: buscar, filtrar, agrupar y ver la ficha |
| Activos fijos | Editar todo: datos, fotos, QR, facturas y documento de reposición |
| Movimientos | Único lugar de entrada, salida o entrega, traslado, ajuste y baja |
| Ubicaciones, Inventario físico, Mantenimiento, Alertas, Reportes, Configuración y Perfil | Solo lo propio de cada una |

```text
Haz una auditoría de funciones repetidas en toda la aplicación. Entrégame una tabla con cada función que aparece en más de una sección (por ejemplo, traslado en Movimientos y en Activos, editar en el Catálogo y en Activos fijos), dónde está hoy, dónde debe quedar y qué acción propones. Usa este mapa: el Catálogo es solo de consulta (buscar, filtrar, agrupar y ver ficha); Activos fijos es donde se edita todo (datos, fotos, QR, facturas y documento de reposición); Movimientos es el único lugar para entrada, salida o entrega, traslado, ajuste y baja; Ubicaciones, Alertas, Reportes, Inventario físico, Mantenimiento, Configuración y Perfil conservan solo lo propio. Espera mi aprobación y luego elimina las duplicadas dejando, si ayuda, un enlace de acceso (por ejemplo, un botón «Ir a Movimientos») en lugar de repetir la función, sin romper nada. Verifica que cada función quede en una sola sección y que todos los enlaces funcionen.
```

Verifica tú: en el Catálogo ya no hay botón de editar, en Activos ya no hay traslado, y traslado solo existe en Movimientos.

### Arreglo 7 – Agrupar por tipo con los grupos cerrados

**Lo que viste:** al agrupar por tipo, todas las secciones aparecen abiertas.

**Lo que debe quedar:** grupos cerrados hasta que selecciones uno.

```text
En «Activos fijos», con la opción «Agrupar por tipo», todos los grupos aparecen abiertos. Deben aparecer cerrados por defecto, mostrando solo el nombre del grupo, la cantidad de unidades y el resumen por estado; al seleccionar un grupo se abre y muestra sus activos, y al volver a seleccionarlo se cierra. Agrega los botones «Expandir todo» y «Contraer todo». Los filtros y la búsqueda siguen funcionando sin abrir los grupos automáticamente, y el encabezado de cada grupo indica cuántos resultados tiene. Debe verse bien en celular y poder abrirse y cerrarse con el teclado.
```

Verifica tú: al agrupar, todo aparece cerrado; abres uno y ves sus activos.

## Fase 3 – Módulos

### Arreglo 4 – Inventario físico

**Lo que viste:** no funciona y no se ve nada.

**Lo que debe quedar:** un módulo completo que parte de las ubicaciones y activos reales; vacío con un mensaje claro si aún no hay conteos.

```text
La sección «Inventario físico» no funciona y no muestra nada. Diagnostica primero por qué (error de datos, consulta, pantalla vacía) y muéstramelo. Luego hazla funcionar completa con los datos reales: crear un conteo por ubicación (carga automáticamente los activos reales de esa ubicación), marcar cada activo como encontrado, no encontrado o con otro estado, contar escaneando el QR desde el celular, agregar observaciones, guardar el avance y retomarlo, ver las diferencias contra el sistema y, al cerrar el conteo, generar el reporte en PDF y, con mi confirmación, los ajustes correspondientes. Si todavía no hay conteos, debe mostrar un estado vacío claro con el botón «Crear primer conteo». Prueba con una ubicación real y elimina el conteo de prueba al terminar.
```

Verifica tú: creas un conteo, ves los activos de esa ubicación, marcas algunos, ves las diferencias y lo cierras; luego lo eliminas.

### Arreglo 5 – Centro de alertas

**Lo que viste:** 83 notificaciones cada vez que entras. Es señal de que las alertas se crean al abrir la pantalla o están duplicadas.

**Lo que debe quedar:** contador en cero, y una alerta nueva solo cuando ocurre algo real.

```text
El centro de alertas muestra 83 notificaciones cada vez que entro. Diagnostica la causa (alertas que se generan en cada carga de pantalla, duplicados, alertas de datos de prueba o estado de lectura que no se guarda) y muéstrmela. Luego corrígelo: las alertas se generan solo cuando ocurre un evento real (movimiento, traslado, entrada, salida, edición, baja o activo bajo su mínimo), nunca al abrir una pantalla ni al iniciar sesión; no se duplican; el estado «leida» o «resuelta» se guarda en la base de datos y se mantiene; el contador de la campana cuenta solo las no leídas. Elimina todas las alertas actuales generadas por pruebas o duplicadas para que el contador empiece en cero. Si un activo no tiene mínimo definido, no genera alerta de stock. Prueba: entra y sal tres veces y verifica que el contador no cambia; haz un movimiento real de prueba, comprueba que llega una sola alerta y después deshaz el movimiento y borra su alerta.
```

Verifica tú: el contador empieza en cero, entras y sales varias veces y sigue en cero; un movimiento real genera una sola alerta.

### Arreglo 2 – Configuración funcional y conectada

**Lo que viste:** solo es estética, no hace nada.

**Lo que debe quedar:** cada opción guarda y tiene un efecto real en todo el sistema; la que no pueda tenerlo, se elimina.

```text
Revisa la sección «Configuración» y haz una lista de cada opción que tiene, con lo que hace hoy (nada, solo estético o funciona). Para cada una: si puede tener un efecto real en el sistema (tema, preferencias de notificación, densidad de tablas, idioma o datos del perfil), conéctala de verdad: que se guarde en la base de datos por usuario, se aplique al instante en todo el sistema y se mantenga al cerrar sesión y volver a entrar; si no puede tener un efecto real, elimínala. No debe quedar ninguna opción decorativa. Pruébalas una por una y entrégame una tabla con la opción, qué hace y cómo la probaste.
```

Verifica tú: cambias el tema o la densidad, cierras sesión, vuelves a entrar y todo sigue como lo dejaste.

## Fase 4 – Cierre del proyecto

**Prompt F1 – Auditoría final**

```text
Haz la auditoría final de cierre del proyecto y entrégame un informe con tablas: (1) datos de prueba, de ejemplo o inventados que aún existan en base de datos, interfaz, reportes, alertas y respuestas del asistente; (2) funciones repetidas; (3) botones, opciones, menús o pantallas que no hacen nada o no son necesarios; (4) errores de consola y de servidor; (5) textos clínicos, de libros o que no correspondan a un almacén. Espera mi aprobación y luego corrige todo y elimina lo innecesario.
```

**Prompt F2 – Recorrido completo**

```text
Haz el recorrido completo final, sección por sección (login, dashboard, catálogo, activos fijos, movimientos, ubicaciones, inventario físico, mantenimiento, alertas, reportes y análisis, acta de entrega, asistente de IA, perfil y configuración), probando cada botón, formulario, filtro, exportación y enlace, en computadora y en celular, en modo claro y oscuro. Cuando una prueba requiera crear datos, usa un registro de prueba y elimínalo al terminar, dejando todo igual que antes. Entrégame la tabla función por función con el resultado (funciona o falla), corrige todo lo que falle y repítelo hasta que no quede ninguna falla.
```

**Prompt F3 – Cuadre con el Excel**

```text
Demuestra que el sistema coincide con mi Excel original: total de activos y total por categoría, por ubicación y por estado. Presenta la tabla Excel contra sistema con la diferencia en cada fila; la diferencia debe ser cero. Verifica además que el dashboard, los reportes y el asistente de IA dan esos mismos totales cuando les pregunto.
```

**Prompt F4 – Entrega final**

```text
Prepara la entrega final: confirma que no queda ningún dato de prueba, haz una copia de seguridad completa, actualiza AGENTS.md y la documentación con el estado final (secciones, funciones y dónde está cada una), genera el manual de usuario actualizado con las secciones reales y deja una lista de mejoras futuras opcionales (como activar los roles). Dime en una lista corta qué quedó funcionando y qué, si algo, queda pendiente.
```

## Si algo falla durante los arreglos

```text
Esto falló: [describe o pega el error]. Antes de cambiar nada, analiza la causa probable, dime qué evidencia usaste y propón la solución más pequeña posible.
```

```text
Detente. Cambiaste más de lo que pedí. Deshaz lo que no corresponde a esta tarea y deja solo [la tarea concreta].
```

## Lista final de entrega

- [ ] El total de activos y de cada ubicación coincide con el Excel
- [ ] No existe ningún proveedor, mantenimiento, alerta ni activo de prueba
- [ ] El contador de alertas empieza en cero y no cambia al entrar
- [ ] Todo activo creado aparece en todas las secciones y su factura se ve en el detalle
- [ ] Cada función está en una sola sección
- [ ] Configuración e Inventario físico funcionan de verdad
- [ ] El recorrido completo no tiene fallas
- [ ] Hay copia de seguridad completa y documentación final
