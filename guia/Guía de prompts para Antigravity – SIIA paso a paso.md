# Guía de prompts para Antigravity – SIIA paso a paso

Oct 18, 2026 · @ryam

Esta guía es una lista ordenada de mensajes para pegar uno a uno en Antigravity y construir SIIA de principio a fin, siguiendo el documento empresarial y la guía de desarrollo. Cada mensaje trae su comprobación: no pases al siguiente hasta cumplirla.

## Cómo usar esta guía

| Regla | Detalle |
| --- | --- |
| Un prompt a la vez | Pega uno, espera el resultado, comprueba y recién entonces sigue |
| Plan antes de código | Casi todos los prompts piden que Antigravity te muestre un plan o un borrador; apruébalo o corrígelo antes de que escriba |
| Comprobar | Cada prompt termina con «Verifica». Si no se cumple, usa los prompts de emergencia del Anexo A |
| Datos entre corchetes | Todo lo que va entre \[corchetes\] lo completas tú (correo, direcciones, colores) |
| Una rama por prompt o tarea | Pide que cada cambio vaya en su rama y se fusione solo cuando lo apruebes |
| Cierre de etapa | Al final de cada etapa ejecuta /cerrar-etapa (se crea en el prompt 0.6) |
| Secretos | Nunca pegues claves ni contraseñas en el chat; Antigravity te dirá dónde guardarlas |
| Modelo | Para seguridad, permisos y el asistente con acciones (etapas 4, 10 y 13) elige el modelo más potente disponible |
| Autonomía | Mantén la política con revisión: tú apruebas los comandos y los cambios importantes |

## Paso previo: preparar los documentos

Antigravity no puede abrir enlaces de claude.ai. Antes del prompt 0.1 haz esto tú:

1. Crea una carpeta vacía del proyecto (por ejemplo, siia) y ábrela en Antigravity.
2. Exporta a Markdown el **documento empresarial** y la **guía de desarrollo con IA**, y guárdalos como docs/documento-empresarial.md y docs/guia-desarrollo.md.
3. Guarda el código de Apps Script que compartiste como docs/referencia-apps-script.md. Es solo referencia para la regla de reorden y el patrón de formularios con cabecera y líneas.
4. Guarda el logo y los colores de la institución en docs/identidad/.

## Etapa 0 – Preparación y repositorio

**Prompt 0.1 – Reconocimiento**

```text
Lee docs/documento-empresarial.md y docs/guia-desarrollo.md completos. Luego explícame con tus palabras: qué es SIIA, qué incluye, qué queda fuera (no es un ERP: sin ventas, cobros, pagos, impuestos ni contabilidad), las etapas de construcción y las decisiones técnicas. Señala cualquier contradicción o duda que encuentres. No escribas código ni crees archivos todavía.
```

Verifica: su resumen coincide con tu idea. Corrige lo que haya entendido mal antes de seguir.

**Prompt 0.2 – Herramientas y cuentas**

```text
Verifica qué herramientas tengo instaladas y cuáles faltan para este proyecto: Git, SDK de .NET LTS, Node.js 18 o superior, Python 3, Docker Desktop y la herramienta de línea de comandos de Supabase. No instales nada por tu cuenta. Dame una lista con la versión detectada, lo que falta y los pasos exactos para instalarlo en mi sistema operativo. Al final dime qué cuentas debo crear (GitHub, Supabase con proyectos de desarrollo y producción, Google Cloud y Google AI Studio) y qué datos necesito para cada una.
```

Verifica: todas las herramientas responden y las cuentas están creadas.

**Prompt 0.3 – Estructura del repositorio**

```text
Crea la estructura del monorepo: carpeta api (solución .NET con Siia.Api, Siia.Domain, Siia.Infrastructure y un proyecto de pruebas), web (Next.js), supabase (migraciones), docs y .github/workflows. Agrega un README con instrucciones para levantar el proyecto desde cero, un .gitignore que excluya secretos y archivos generados (.env, .env.local, user-secrets, bin, obj, node_modules) y haz el primer commit en la rama main. Todavía no generes código de la aplicación, solo la estructura. Muéstrame el plan antes de crear nada.
```

Verifica: la estructura existe y git status está limpio.

**Prompt 0.4 – AGENTS.md (memoria del proyecto)**

```text
Crea AGENTS.md en la raíz, en español y con menos de 12.000 caracteres, con: resumen de SIIA y su alcance (incluyendo lo que queda fuera), decisiones técnicas (.NET para la API, Next.js con TypeScript, Tailwind y shadcn/ui, Supabase para base de datos, acceso, archivos y tiempo real, y Gemini para el asistente), estructura de carpetas, nombres (Siia.* y carpeta web), reglas de oro (todo endpoint valida el rol y escribe en la bitácora; ningún secreto en el código; todo cambio de esquema es una migración SQL; el asistente de IA solo actúa por la API de SIIA y siempre pide confirmación en las escrituras; no ejecutar comandos destructivos sin mi permiso), convención de commits y ramas, y una sección «Estado actual» que diga: Etapa 0 en curso. Muéstrame el contenido antes de guardarlo.
```

Verifica: AGENTS.md existe, es breve y refleja tus decisiones.

**Prompt 0.5 – Reglas por tema**

```text
Crea reglas separadas en la carpeta de reglas del proyecto (cada una con menos de 12.000 caracteres): seguridad y secretos, estilo de código y pruebas para .NET, estilo de código para Next.js y TypeScript, base de datos y migraciones, y uso de la IA dentro de SIIA (funciones, confirmación, límites y auditoría). Basa cada regla en el documento empresarial. Confirma en la documentación vigente de Antigravity cuál es el nombre correcto de la carpeta de reglas, habilidades y flujos en mi versión.
```

Verifica: las reglas están en la carpeta que Antigravity realmente usa.

**Prompt 0.6 – Flujos de trabajo reutilizables**

```text
Crea tres flujos de trabajo que pueda invocar con la barra diagonal: /iniciar-etapa (lee AGENTS.md, el documento y la guía, resume la etapa que indique y propone un plan), /revisar-cambios (resume los archivos modificados, ejecuta las pruebas y señala riesgos de seguridad y de permisos) y /cerrar-etapa (verifica la definición de terminado de la etapa, actualiza la sección «Estado actual» de AGENTS.md y propone el commit). Muéstrame cada flujo antes de guardarlo.
```

Verifica: al escribir la barra diagonal aparecen los tres flujos.

**Prompt 0.7 – Git y verificación automática base**

```text
Prepara el flujo de Git: dime los pasos manuales para proteger la rama main en GitHub (cambios solo por Pull Request), define la convención de ramas feat/..., fix/... y chore/..., y crea un workflow mínimo de GitHub Actions que en cada Pull Request construya la API y la web. No guardes secretos en el repositorio. Explícame cómo subir el proyecto al repositorio privado.
```

Verifica: el repositorio está en GitHub, es privado y main está protegida. Ejecuta /cerrar-etapa.

## Etapa 1 – Sistema de diseño

**Prompt 1.1 – Instalar UI/UX Pro Max**

```text
Guíame para instalar UI/UX Pro Max Skill para Antigravity. Lee su README oficial (github.com/nextlevelbuilder/ui-ux-pro-max-skill), dime qué requiere (incluido Python 3), el comando de instalación y dónde quedará instalado. Antes de ejecutar nada, revisa lo que se va a instalar y dime si hay algo riesgoso. Espera mi autorización para ejecutar.
```

Verifica: la habilidad queda instalada en la carpeta de habilidades del proyecto.

**Prompt 1.2 – Propuesta base de diseño**

```text
Usa UI/UX Pro Max para generar una propuesta de sistema de diseño para SIIA: un panel de gestión de recursos institucionales con asistente de IA, usuarios administrativos, tablas densas, tarjetas con fotos de recursos, escáner de códigos QR, gráficos, modo claro y oscuro, Next.js con Tailwind y shadcn/ui, todo en español. Parte de esta identidad: [colores y logo de la institución, en docs/identidad]. Preséntame estilo, paleta, tipografías, patrón de pantallas y errores a evitar. No generes código todavía.
```

Verifica: la propuesta tiene sentido para una institución y respeta sus colores.

**Prompt 1.3 – Referencias con SkillUI**

```text
Guíame para usar SkillUI (github.com/amaancoderx/npxskillui): explica requisitos y comandos. Analiza estas referencias públicas de interfaces modernas: [URL 1], [URL 2], [URL 3]. Guarda la salida de cada una en docs/referencias-diseno/. Solo tomaremos ideas de estructura, proporciones y microinteracciones; no copies marcas, logotipos, textos ni imágenes. Pídeme autorización antes de instalar o ejecutar nada.
```

Verifica: hay una carpeta de resultados por cada referencia con su DESIGN.md.

**Prompt 1.4 – Sistema de diseño unificado**

```text
Lee la propuesta de UI/UX Pro Max y los resultados de SkillUI. Compáralos y propón un único sistema de diseño para SIIA con: paleta (claro y oscuro), tipografías, escala de espaciado, radios, sombras, componentes base (botones, tablas, formularios, tarjetas, etiquetas de estado, tarjeta de recurso con foto, paneles laterales, diálogo de confirmación de acciones de la IA), animaciones y reglas de accesibilidad WCAG 2.1 AA. Guárdalo como archivo maestro en design-system/MASTER.md y crea archivos de excepciones por página (panel, catálogo, movimientos y asistente de IA). Explícame tus decisiones y espera mi aprobación.
```

Verifica: apruebas el estilo. Desde ahora solo existe este sistema de diseño.

**Prompt 1.5 – Vista previa de pantallas**

```text
Con el sistema de diseño aprobado, crea una vista previa navegable en la carpeta web con datos de ejemplo de estas pantallas: inicio de sesión, panel principal, catálogo de recursos con tarjetas con foto, ficha de recurso con su código QR y panel lateral del asistente. Debe verse bien en computadora y celular, en modo claro y oscuro. Dime cómo abrirla.
```

Verifica: la abres, la recorres en el celular y apruebas el aspecto.

**Prompt 1.6 – Cierre de la etapa**

```text
Pasa la lista de verificación de UI/UX Pro Max sobre la vista previa (contraste, foco visible, reducir movimiento, anchos de 375, 768, 1024 y 1440 píxeles, sin textos cortados, sin emojis como iconos). Corrige lo que falle. Actualiza AGENTS.md para que ordene leer design-system/MASTER.md y el archivo de excepciones de la página antes de construir cualquier pantalla. Ejecuta /cerrar-etapa.
```

## Etapa 2 – Base de datos en Supabase

**Prompt 2.1 – Modelo de datos en texto**

```text
Basándote en el documento empresarial (secciones 18.3 y 18.12), propón el modelo de datos completo de SIIA en texto, sin escribir SQL todavía: entidades, campos, tipos y relaciones. Debe cubrir: estados de los recursos (disponible, en uso, prestado, en mantenimiento, dañado, dado de baja), consumibles y activos con número de serie, varias fotos por recurso, varios códigos por recurso (QR propio y externos), categorías y subcategorías, ubicaciones jerárquicas, existencias por ubicación y lote, movimientos, asignaciones, préstamos, mantenimientos, proveedores, compras, conteos físicos, alertas, bitácora y conversaciones de IA. Nada de ventas, cobros ni pagos. Señala las decisiones que debo tomar y espera mi aprobación.
```

Verifica: revisas el modelo contra el documento y lo apruebas.

**Prompt 2.2 – Migración 1: base**

```text
Inicializa Supabase en la carpeta supabase y crea la migración 1: tipos enumerados, roles de usuario (super_admin, admin_inventario, encargado_almacen, solicitante, auditor y consulta), invitaciones, perfiles, categorías, ubicaciones y recursos con sus fotos y códigos. Usa nombres en español en minúsculas, llaves primarias uuid, fechas de creación y actualización y restricciones de integridad. No apliques nada todavía: muéstrame el archivo.
```

**Prompt 2.3 – Migración 2: operación**

```text
Crea la migración 2 con existencias, movimientos (entrada, salida o entrega, traslado, ajuste, devolución y baja, con motivo, origen, destino, cantidad y usuario), asignaciones y préstamos, mantenimientos, proveedores, solicitudes y órdenes de compra con recepción (sin pagos), conteos de inventario físico y diferencias. Incluye restricciones para que el stock no quede negativo y los índices necesarios para filtrar por categoría, ubicación, estado, responsable y texto.
```

**Prompt 2.4 – Migración 3: transversal y seguridad**

```text
Crea la migración 3: bitácora de auditoría (usuario, origen humano o IA, acción, entidad, valores antes y después, fecha), alertas y notificaciones con preferencias por usuario, cola de correos, conversaciones y acciones propuestas de la IA, llaves de integración y webhooks. Activa la seguridad por fila (RLS) en todas las tablas con políticas básicas y crea el espacio de almacenamiento privado para fotos y archivos con sus políticas de acceso.
```

**Prompt 2.5 – Migración 4: acceso por invitación**

```text
Crea la migración 4: un disparador que, al crearse un usuario, solo lo permita si su correo está en invitaciones (sin distinguir mayúsculas), cree su perfil con el rol de la invitación y marque la invitación como usada. Si el correo no está invitado, debe rechazar la creación con un mensaje claro. Incluye el script para registrar mi correo [tu correo de Google] como primer super_admin.
```

**Prompt 2.6 – Aplicar, probar y cerrar**

```text
Guíame para vincular el proyecto de desarrollo de Supabase, aplicar las migraciones y verificar el esquema desde cero. Escribe pruebas de base de datos que comprueben: rechazo de correos no invitados, que el stock no queda negativo y que las restricciones principales funcionan. Dame datos semilla de ejemplo (categorías, ubicaciones y 10 recursos) en un archivo aparte. Al terminar, ejecuta /cerrar-etapa.
```

Verifica: las migraciones se aplican desde cero sin errores, las tablas aparecen en Supabase y el esquema coincide con el documento.

## Etapa 3 – Acceso con Google

**Prompt 3.1 – Configuración en Google Cloud y Supabase**

```text
Dime paso a paso, con la interfaz actual de Google Cloud Console, cómo configurar el acceso con Google para SIIA: crear el proyecto, la pantalla de consentimiento OAuth (interna si usamos Google Workspace, externa si no), los permisos solo de identidad básica (openid, correo y perfil), las credenciales de aplicación web y las direcciones de redirección. Después dime cómo cargarlas en el proveedor Google de Supabase y qué dirección de sitio y de redirección configurar para desarrollo local. Espera a que yo te confirme cada paso y no me pidas pegar claves en el chat.
```

Verifica: el proveedor Google aparece activado en Supabase.

**Prompt 3.2 – Variables de entorno seguras**

```text
Prepara el manejo seguro de variables de entorno para web y api: archivos .env.example sin valores, instrucciones para user-secrets en la API y una comprobación de que ningún secreto queda en Git. Dime exactamente qué valores debo copiar del panel de Supabase y de Google, y dónde guardarlos.
```

Verifica: los archivos de ejemplo existen y git no muestra ningún secreto.

**Prompt 3.3 – Guion de pruebas de acceso (se ejecuta después del prompt 5.2)**

```text
Prepara el guion de pruebas del acceso con Google y los casos límite: correo invitado entra, correo no invitado es rechazado con mensaje claro y queda registro del intento, correo con otras mayúsculas, invitación ya usada y usuario desactivado. Cuando el login esté disponible en la interfaz, guíame para ejecutar cada caso.
```

## Etapa 4 – API base en .NET

**Prompt 4.1 – Solución .NET**

```text
Crea la solución .NET en api con Siia.Api, Siia.Domain, Siia.Infrastructure y Siia.Tests, con las referencias correctas entre capas. Usa la versión LTS vigente de .NET y paquetes oficiales y mantenidos. Muéstrame los paquetes que propones antes de instalarlos. Configura el proyecto para leer secretos desde user-secrets y variables de entorno.
```

**Prompt 4.2 – Base de datos, token y perfil**

```text
Configura la conexión a PostgreSQL de Supabase (por el pooler) con EF Core. El esquema lo gobiernan las migraciones de Supabase, así que no uses migraciones de EF: mapea las entidades del dominio a las tablas existentes. Configura la validación del token de sesión de Supabase (revisa en la documentación vigente si mi proyecto usa secreto JWT o llaves asimétricas y explícame cuál). Crea el endpoint GET /api/v1/me que devuelva el perfil y el rol del usuario y rechace a los usuarios desactivados.
```

**Prompt 4.3 – Permisos, bitácora y errores**

```text
Implementa la autorización por roles con políticas que lean el rol desde la base de datos. Implementa un mecanismo central que registre automáticamente en la bitácora cada operación de escritura (usuario, origen, acción, entidad, valores antes y después). Estandariza los errores con ProblemDetails, y define la paginación, los filtros y el ordenamiento que usarán todos los listados.
```

**Prompt 4.4 – Documentación, seguridad y pruebas**

```text
Agrega documentación OpenAPI con interfaz interactiva solo en desarrollo, CORS limitado al origen de la web, límite de solicitudes y versionado /api/v1. Escribe pruebas para: acceso sin token (401), token válido de usuario activo, usuario desactivado (403) y una política de rol. Ejecuta /revisar-cambios y luego /cerrar-etapa.
```

Verifica: la API arranca, sin token responde 401, con tu sesión devuelve tu perfil y rol, y las pruebas pasan.

## Etapa 5 – Interfaz base

**Prompt 5.1 – Aplicación web y tokens de diseño**

```text
Crea la aplicación en la carpeta web con Next.js, TypeScript, Tailwind CSS y shadcn/ui. Convierte design-system/MASTER.md en tokens de Tailwind (colores claro y oscuro, tipografías, espaciado y radios) y en los componentes base. Configura el lint y el formato. Muéstrame la lista de dependencias antes de instalar y verifica que las versiones sean estables.
```

**Prompt 5.2 – Inicio de sesión con Google**

```text
Implementa el inicio de sesión con Google usando Supabase Auth: pantalla de login según la vista previa aprobada, ruta de retorno que intercambia el código por la sesión, protección de todas las rutas salvo el login, cierre de sesión y manejo del caso «correo no autorizado» con un mensaje claro. Después llama a GET /api/v1/me con el token y guarda el perfil y el rol en el estado de la aplicación. Cuando termines, guíame para ejecutar el guion del prompt 3.3.
```

Verifica: un correo invitado entra, uno no invitado es rechazado y ves tu nombre y rol traídos desde la API.

**Prompt 5.3 – Layout principal**

```text
Construye el layout principal con el sistema de diseño: menú lateral que se adapta al rol del usuario (oculta lo que no puede usar), encabezado con búsqueda global (atajo Ctrl o Cmd + K), notificaciones, selector de tema claro y oscuro y menú de usuario. En celular, el menú pasa a una barra inferior o a un menú desplegable. Agrega estados de carga tipo esqueleto, páginas de error y estados vacíos con ilustración minimalista.
```

**Prompt 5.4 – Cliente de la API**

```text
Crea el cliente tipado para llamar a la API de SIIA: adjunta el token de sesión, renueva la sesión si caduca, traduce los errores de ProblemDetails a mensajes claros en español y ofrece ayudas para listados paginados con filtros. Genera los tipos a partir de la documentación OpenAPI para que no se desincronicen.
```

**Prompt 5.5 – Panel del asistente (esqueleto)**

```text
Crea el panel lateral del asistente de IA accesible desde cualquier pantalla (botón flotante y atajo de teclado), con lista de mensajes, entrada de texto, botón para adjuntar o tomar una foto, indicador de «pensando» y espacio para tarjetas de confirmación de acciones. Todavía sin conexión a la IA: usa respuestas de ejemplo. Debe respetar design-system/MASTER.md y la página de excepciones del asistente.
```

**Prompt 5.6 – Revisión y cierre**

```text
Revisa accesibilidad (navegación con teclado, contraste, etiquetas), adaptación a 375, 768, 1024 y 1440 píxeles y rendimiento de la interfaz base. Pasa la lista de verificación de diseño, corrige y ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: entras con Google, ves el menú según tu rol, funciona el modo oscuro y el layout se ve bien en tu celular.

## Etapa 6 – Catálogo de recursos (con fotos, QR y filtros)

**Prompt 6.1 – Categorías y proveedores (fija el patrón)**

```text
Construye de punta a punta categorías (con subcategorías) y proveedores: endpoints con permisos por rol y registro en bitácora, pantallas de listado y formulario según el sistema de diseño, validaciones y mensajes en español. Define aquí el patrón que se repetirá en todos los módulos (estructura de endpoints, servicios, pruebas y pantallas) y documéntalo en AGENTS.md.
```

**Prompt 6.2 – API de recursos con filtros**

```text
Crea la API de recursos: listar con paginación, ordenamiento y filtros combinables (texto libre en nombre, código, serie, marca, modelo y códigos externos; categoría y subcategoría; tipo; ubicación; estado; responsable; stock bajo o agotado; proveedor; rango de fechas de adquisición; rango de costo; con o sin foto; con o sin QR), obtener detalle, crear, editar, duplicar, cambiar estado, desactivar en lugar de borrar y registrar el historial de cambios. Valida SKU y número de serie únicos. Escribe pruebas, incluyendo los permisos de cada rol.
```

**Prompt 6.3 – Fotos de los recursos**

```text
Implementa las fotos de los recursos con Supabase Storage privado: subir una o varias fotos desde archivo o desde la cámara del celular, JPG, PNG y WebP de hasta 5 MB, validación del tipo real del archivo, redimensionado y compresión, miniaturas para listas y tarjetas, foto principal, reordenar, reemplazar conservando la anterior en el historial y eliminar con permiso. El acceso se hace con enlaces firmados de corta duración. Registra todo en la bitácora y agrega pruebas.
```

**Prompt 6.4 – Códigos y QR**

```text
Implementa los códigos de los recursos: código único e inmutable generado por SIIA, QR que contiene solo un enlace seguro al recurso (sin datos sensibles), códigos externos adicionales (QR o barras del fabricante) con validación de que no estén repetidos en otro recurso, y un endpoint que resuelva cualquier código escaneado y devuelva el recurso o indique que no existe. Si se abre el enlace sin sesión, el usuario inicia sesión y luego ve la ficha según sus permisos. Escribe pruebas, incluido el acceso sin permisos.
```

**Prompt 6.5 – Pantalla de catálogo**

```text
Construye la pantalla de catálogo según la vista previa aprobada: alternar entre tabla y tarjetas con foto, panel de filtros con todos los filtros del documento (sección 18.12), chips de filtros activos, ordenamiento, paginación, búsqueda con resultados al escribir, vistas guardadas por usuario (crea la migración necesaria si falta), selección múltiple con acciones en lote (cambiar estado, ubicación o responsable con vista previa y confirmación) y exportar el resultado filtrado. Con muchos registros debe seguir siendo rápida.
```

**Prompt 6.6 – Formulario de recurso**

```text
Construye el formulario de crear y editar recurso en un panel lateral o página: campos del modelo, subida de fotos por arrastrar y soltar o con la cámara, escaneo opcional del código del fabricante, validación en tiempo real, aviso de posibles duplicados (mismo número de serie, o nombre y marca similares) y guardado con mensaje de éxito. Debe permitir «guardar y agregar otro» y «duplicar recurso».
```

**Prompt 6.7 – Ficha del recurso y etiquetas QR**

```text
Construye la ficha del recurso: galería de fotos, datos, estado con etiqueta de color, existencias por ubicación, historial de movimientos y cambios, códigos con el QR visible y acciones según permisos. Agrega la generación de etiquetas QR imprimibles (individual y en lote) con el QR, el código, el nombre y opcionalmente la foto, listas para imprimir en PDF.
```

**Prompt 6.8 – Escáner con la cámara**

```text
Implementa el escáner con la cámara del celular desde la aplicación web (PWA): lee los QR de SIIA y los códigos externos, abre la ficha del recurso y ofrece acciones rápidas según el rol (registrar movimiento, asignar o devolver, reportar daño). Si el código no existe, ofrece crear un recurso nuevo con ese código. Maneja el permiso de cámara denegado y la poca luz con mensajes claros. Hazlo instalable como PWA.
```

**Prompt 6.9 – Prueba real y cierre**

```text
Carga los datos semilla con 10 a 20 recursos y pruébalos conmigo: crea un monitor con foto, imprime su etiqueta, escanéala desde mi celular, filtra por varios criterios y verifica los permisos de cada rol. Escribe las pruebas automáticas faltantes, ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: un auditor consulta pero no edita, cada cambio aparece en la bitácora y el QR del monitor abre su ficha en tu celular.

## Etapa 7 – Ubicaciones, existencias y movimientos

**Prompt 7.1 – Ubicaciones**

```text
Construye ubicaciones jerárquicas (sede, almacén, departamento, aula u oficina) con responsable: API con permisos y bitácora, y pantallas de árbol y de formulario. Impide eliminar ubicaciones que tengan recursos o existencias; permite desactivarlas.
```

**Prompt 7.2 – Existencias y stock mínimo**

```text
Implementa la consulta de existencias por recurso, ubicación y lote (y vencimiento cuando aplique), con stock total, disponible y reservado, y el cálculo de stock bajo el mínimo según la regla del documento (RF-12). Usa docs/referencia-apps-script.md solo como referencia de la regla de reorden; no copies ventas, cobros ni pagos.
```

**Prompt 7.3 – Movimientos transaccionales (API)**

```text
Implementa los movimientos: entrada, salida o entrega a una persona o área, traslado entre ubicaciones, ajuste con motivo obligatorio, devolución y baja. Cada movimiento se ejecuta en una sola transacción que actualiza existencias y bitácora, rechaza si dejaría el stock negativo, admite una clave de idempotencia para evitar duplicados y permite adjuntar un documento (por ejemplo, un acta de recepción). Un movimiento con varias líneas se guarda completo o no se guarda. Escribe pruebas de consistencia con operaciones simultáneas.
```

**Prompt 7.4 – Pantalla de movimientos (cabecera y líneas)**

```text
Construye la pantalla de movimientos con el patrón de cabecera y líneas: paso 1 datos generales (tipo de movimiento, origen, destino, responsable, documento y fecha); paso 2 líneas de recursos con selector predictivo que muestra el stock disponible antes de elegir y un aviso inmediato si la cantidad supera el stock; paso 3 vista previa del impacto que muestra cómo quedarán las existencias antes de guardar. Debe poder iniciarse escaneando códigos. Usa el diseño aprobado y estados de carga claros.
```

**Prompt 7.5 – Historial y línea de tiempo**

```text
Agrega el historial de movimientos filtrable (por recurso, ubicación, persona, tipo y fechas) con exportación, el stock mínimo editable por recurso con indicadores visuales en el catálogo (en stock, bajo, agotado) y la línea de tiempo del recurso en su ficha.
```

**Prompt 7.6 – Pruebas y cierre**

```text
Prueba con escenarios reales: recibir mercancía, entregar a un departamento, trasladar entre almacenes, ajustar tras un conteo y dar de baja. Verifica que los saldos cuadran y que ningún movimiento deja el stock negativo. Completa las pruebas automáticas, ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: las existencias coinciden con lo esperado tras una serie de movimientos de prueba.

## Etapa 8 – Alertas y correos con Gmail

**Prompt 8.1 – Motor de alertas**

```text
Implementa el motor de alertas con reglas configurables: stock mínimo alcanzado o agotado, productos por vencer, mantenimientos próximos, préstamos por vencer o vencidos, solicitudes pendientes de aprobación, diferencias en conteos y acciones sensibles ejecutadas por la IA. Cada alerta tiene tipo, severidad, destinatarios por rol y enlace al recurso. Evita duplicados (no repetir una alerta que sigue abierta) y permite marcarlas como vistas o resueltas.
```

**Prompt 8.2 – Notificaciones en la aplicación**

```text
Muestra las alertas dentro de la aplicación en tiempo real con Supabase Realtime: campana con contador, panel de notificaciones, marcar como leída y avisos tipo toast para las críticas. Respeta los permisos: cada usuario solo recibe lo que le corresponde.
```

**Prompt 8.3 – Configurar la Gmail API**

```text
Guíame paso a paso para habilitar la Gmail API en mi proyecto de Google Cloud y autorizar la cuenta institucional que enviará los correos. Compara las opciones (OAuth con la cuenta institucional, o cuenta de servicio con delegación de dominio si usamos Google Workspace), recomienda una para nuestro caso y dime qué permisos mínimos usar. Dime los límites diarios de envío vigentes según la documentación oficial. No me pidas pegar claves en el chat.
```

**Prompt 8.4 – Cola de correos y envío**

```text
Implementa la cola de correos y el envío con la Gmail API: plantillas HTML en español con la identidad visual de la institución, proceso en segundo plano que toma la cola, envía, registra el resultado y reintenta con espera creciente, y una alerta técnica si falla repetidamente. Si nos acercamos al límite diario, agrupa los avisos en un resumen. Diseña la capa de envío para poder cambiar de proveedor de correo sin tocar el resto del sistema.
```

**Prompt 8.5 – Preferencias y tarea diaria**

```text
Agrega las preferencias de notificación por usuario (qué avisos recibir, inmediato o resumen diario, y canal) y la tarea programada que cada día revisa existencias, vencimientos, mantenimientos y préstamos y genera las alertas. Registra cada envío en la bitácora de notificaciones.
```

**Prompt 8.6 – Pruebas y cierre**

```text
Prueba: baja un recurso por debajo de su mínimo y verifica el aviso en pantalla y el correo recibido, simula un fallo de envío y comprueba los reintentos, y prueba las preferencias. Completa las pruebas automáticas, ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: un recurso bajo el mínimo genera aviso en pantalla y correo, y los fallos de envío quedan registrados.

## Etapa 9 – Asistente de IA: consulta y guía

**Prompt 9.1 – Diseño del asistente**

```text
Antes de escribir código, diseña el asistente de IA de SIIA y preséntamelo en texto: arquitectura (la API de SIIA orquesta; el modelo nunca toca la base de datos directamente), lista de funciones de lectura y de escritura que expondrá, cómo hereda el rol del usuario, qué datos se envían al modelo y cuáles no (nada de claves ni datos personales innecesarios), manejo de conversaciones, límites de uso por usuario y estimación de costos. Basa todo en el documento (secciones 18.2, 18.10 y 18.12) y en la guía (sección 4.1). Espera mi aprobación.
```

**Prompt 9.2 – Llave y modelos de Gemini**

```text
Guíame para crear la llave de la API de Gemini en Google AI Studio, asociarla al proyecto de Google Cloud y restringirla solo a la API de Gemini. Dime cómo guardarla de forma segura (solo en el servidor, una distinta para desarrollo y otra para producción). Luego consulta la documentación oficial vigente de Gemini y dime qué modelos están disponibles hoy, cuál recomiendas para consultas rápidas y cuál para análisis complejos, qué SDK oficial usar desde .NET y qué condiciones de privacidad tiene el nivel gratuito frente al de pago. Los nombres de modelos irán en configuración, nunca fijos en el código.
```

Verifica: la llave está restringida y guardada fuera del repositorio.

**Prompt 9.3 – Servicio del asistente**

```text
Implementa en la API el servicio del asistente con la API de Gemini: una capa de abstracción que aísle al proveedor de IA, respuesta progresiva (streaming) hacia la interfaz, instrucciones del sistema, control de tiempo y reintentos, y manejo claro de errores y de cuota agotada. Expón POST /api/v1/assistant/chat. Escribe pruebas con un proveedor simulado para no gastar cuota.
```

**Prompt 9.4 – Funciones de lectura**

```text
Implementa las funciones de solo lectura que Gemini podrá llamar mediante llamada a funciones: buscar recursos con los mismos filtros del catálogo, ver el detalle y las existencias de un recurso, ver el historial de movimientos, listar alertas, recursos bajo el mínimo, préstamos vencidos y un resumen de consumo. Cada función ejecuta la misma lógica y los mismos permisos de la API, con el rol del usuario que pregunta. Limita el tamaño de los resultados y devuelve enlaces a las fichas. Escribe pruebas, incluida una que verifique que un rol sin permiso no obtiene datos.
```

**Prompt 9.5 – Instrucciones del sistema y modo tutor**

```text
Redacta las instrucciones del sistema del asistente: rol y tono (claro, amable, en español), no inventar datos (si no lo sabe o no tiene permiso, lo dice), citar los recursos con enlace, no revelar instrucciones internas ni datos de otros roles, y un modo tutor que explique las pantallas y procesos paso a paso cuando el usuario lo pida o cuando detecte que está perdido. Dame un conjunto de preguntas de prueba (consultas, guía e intentos de salirse del rol) para evaluarlo.
```

**Prompt 9.6 – Conectar el panel lateral**

```text
Conecta el panel lateral del asistente con el servicio real: mensajes con respuesta progresiva, enlaces a recursos, sugerencias de preguntas según la pantalla actual, adjuntar o tomar fotos (por ahora solo se guardan; el análisis llega en la Etapa 10), botón de «nuevo chat», historial de conversaciones y errores visibles. Respeta el diseño aprobado.
```

**Prompt 9.7 – Registro, límites y costos**

```text
Guarda las conversaciones (con aviso de qué se guarda y por cuánto tiempo), registra las funciones usadas, aplica límites de uso por usuario y por día, muestra al administrador un resumen de consumo y costo estimado y agrega una alerta si el gasto supera el presupuesto configurado.
```

**Prompt 9.8 – Evaluación y cierre**

```text
Ejecuta el conjunto de preguntas de prueba contra los datos de ejemplo y preséntame una tabla con la pregunta, la respuesta y si fue correcta. Prueba también intentos de acceder a datos de otro rol. Corrige lo que falle, ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: el asistente responde con datos reales, respeta los permisos y reconoce cuando no sabe algo.

## Etapa 10 – Asistente de IA: acciones con confirmación

**Prompt 10.1 – Diseño del mecanismo de acciones**

```text
Diseña el mecanismo de acciones con confirmación y preséntalo antes de implementarlo: cuando el usuario pide un cambio, el asistente crea una «propuesta de acción» guardada con su estado (pendiente, confirmada, cancelada o expirada), los datos exactos y el efecto previsto; la interfaz la muestra en una tarjeta; solo al confirmar, la API ejecuta la operación con los permisos del usuario. Define límites: cantidades máximas por acción, acciones masivas con tope y confirmación reforzada, acciones destructivas solo para administradores y caducidad de las propuestas. Espera mi aprobación.
```

**Prompt 10.2 – Escritura sobre recursos**

```text
Implementa las funciones de escritura del asistente para recursos: crear, editar, duplicar, cambiar estado, desactivar y asignar categoría o ubicación. Cada una crea una propuesta (no ejecuta directo), valida con las mismas reglas de la API, marca la bitácora como acción de IA a solicitud del usuario y devuelve un resumen del efecto. Escribe pruebas, incluida una que verifique que una propuesta no se ejecuta sin confirmación.
```

**Prompt 10.3 – Movimientos y asignaciones**

```text
Implementa las funciones de escritura para movimientos y asignaciones: entrada, entrega, traslado, ajuste, baja, préstamo y devolución, con vista previa del impacto en existencias. Debe entender peticiones como «traslada 20 resmas de papel del Almacén Central a Secretaría» o «asigna la laptop con serie ABC123 a [persona]», y pedir aclaración cuando haya ambigüedad (varios recursos o ubicaciones posibles) en lugar de adivinar.
```

**Prompt 10.4 – Tarjeta de confirmación y deshacer**

```text
Construye la tarjeta de confirmación en el panel del asistente: muestra qué se hará, con qué recursos, cantidades, origen y destino, y el efecto en existencias; botones de confirmar y cancelar; estado final con el resultado y un enlace; y la opción de deshacer cuando la operación sea reversible (mediante un movimiento inverso auditado). Debe verse clara en celular.
```

**Prompt 10.5 – Registrar un recurso desde una foto**

```text
Implementa el registro de un recurso a partir de una foto: el usuario sube o toma una foto en el chat, Gemini la analiza (capacidad multimodal) y propone tipo de recurso, marca y modelo si se ven, categoría y descripción; el sistema revisa posibles duplicados y presenta una propuesta de ficha editable. La foto se guarda como foto del recurso solo cuando el usuario confirma. Si la imagen no es clara, el asistente lo dice y pide datos. Nunca inventa números de serie.
```

**Prompt 10.6 – Duplicados, lotes y datos faltantes**

```text
Agrega las capacidades adicionales: detección de duplicados antes de crear, acciones en lote con vista previa (por ejemplo, «traslada estos 12 equipos al laboratorio 3»), sugerencias de datos faltantes (categoría, descripción, unidad, foto o QR faltante) y avisos proactivos de posibles faltantes con una propuesta de solicitud de reposición. Cada capacidad respeta confirmación, permisos y límites.
```

**Prompt 10.7 – Pruebas adversariales y cierre**

```text
Haz pruebas de seguridad del asistente: peticiones fuera del rol del usuario, cantidades absurdas, borrados masivos, instrucciones escondidas en nombres o descripciones de recursos o en el texto de una foto (inyección de instrucciones), intentos de saltarse la confirmación y de revelar las instrucciones internas. Presenta los resultados en una tabla y corrige todo lo que falle. Ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: ninguna escritura se ejecuta sin confirmación, todas quedan auditadas como acción de IA y el registro desde foto funciona con tu monitor de prueba.

## Etapa 11 – Módulos avanzados

**Prompt 11.1 – Activos y asignaciones**

```text
Construye la gestión de activos individuales: número de serie, fecha de adquisición, valor, estado, responsable asignado y ubicación, con asignación y devolución y acta de entrega en PDF. Incluye la pantalla «mis recursos asignados» para cada usuario y alertas de asignaciones sin confirmar. Mantén la bitácora, los permisos y el patrón del sistema.
```

**Prompt 11.2 – Préstamos**

```text
Construye préstamos: solicitud, aprobación opcional según el rol, fecha de salida y fecha límite, devolución con estado del recurso, recordatorios por correo antes del vencimiento y alerta cuando esté vencido. Muestra el calendario de préstamos y bloquea que un recurso ya prestado se vuelva a prestar.
```

**Prompt 11.3 – Mantenimiento**

```text
Construye mantenimiento: programación periódica por recurso, registro de mantenimientos realizados (fecha, tipo, costo, proveedor y observaciones), cambio automático de estado a «en mantenimiento» y de regreso, y recordatorios. Opcionalmente, crea eventos en Google Calendar (pregúntame antes de habilitar esa API).
```

**Prompt 11.4 – Compras y recepción (sin pagos)**

```text
Construye solicitudes y órdenes de compra: solicitud por un usuario, aprobación por rol, orden al proveedor, recepción total o parcial que genera la entrada de existencias y la orden en PDF. No incluyas pagos, facturación ni impuestos. Conecta con las alertas de stock bajo para crear solicitudes en borrador.
```

**Prompt 11.5 – Inventario físico**

```text
Construye el inventario físico: crear un conteo por ubicación, contar escaneando códigos desde el celular, mostrar las diferencias con el sistema, requerir aprobación para ajustar y generar el ajuste auditado. Debe tolerar conexión inestable guardando el avance en el dispositivo y sincronizando después.
```

**Prompt 11.6 – Importación desde Excel**

```text
Construye la importación masiva desde Excel o CSV: plantilla descargable, carga con validación previa fila por fila, reporte de errores corregibles antes de confirmar, detección de duplicados y vista previa de lo que se creará. Debe soportar la carga inicial de cientos de recursos y quedar auditada.
```

**Prompt 11.7 – Conectar los módulos al asistente**

```text
Amplía el asistente para que conozca los módulos nuevos: funciones de lectura y de escritura con confirmación para activos, préstamos, mantenimientos, compras y conteos, con los mismos permisos, límites y auditoría. Agrega preguntas de prueba nuevas y pruébalas.
```

**Prompt 11.8 – Pruebas y cierre**

```text
Prueba cada módulo con casos reales de la institución. Verifica los requerimientos RF-07 al RF-14 del documento, completa las pruebas automáticas, ejecuta /revisar-cambios y /cerrar-etapa.
```

Verifica: cada módulo cumple su requerimiento y tiene pruebas.
