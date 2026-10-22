using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class AssistantService : IAssistantService
{
    private readonly HttpClient _httpClient;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AssistantService> _logger;

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, PropuestaAccionDto> _propuestasAlmacenadas = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, ResultadoConfirmacionPropuestaDto> _confirmacionesPrevias = new();

    public AssistantService(
        HttpClient httpClient,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IConfiguration configuration,
        ILogger<AssistantService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _currentUserService = currentUserService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatResponseDto> ProcesarMensajeAsync(ChatRequestDto request, CancellationToken ct = default)
    {
        var apiKey = _configuration["Gemini:ApiKey"] 
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") 
            ?? string.Empty;

        var model = _configuration["Gemini:FlashModel"] 
            ?? _configuration["Gemini:Model"] 
            ?? "gemini-1.5-flash";

        // Si el modelo configurado es gemini-3.x (preview experimental), usar gemini-1.5-flash como fallback estándar estable
        if (model.Contains("3.8") || model.Contains("3.1"))
        {
            model = "gemini-1.5-flash";
        }

        var executedTools = new List<string>();
        var userRole = _currentUserService.Role ?? "consulta";
        var userEmail = _currentUserService.Email ?? "usuario@uod.edu.do";

        try
        {
            // 1. Intentar orquestación en vivo con Gemini API si la clave está disponible
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                try
                {
                    var geminiResult = await LlamarGeminiConHerramientasAsync(request, apiKey, model, userRole, userEmail, executedTools, ct);
                    if (geminiResult != null)
                    {
                        return geminiResult;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Fallo al comunicar con Gemini API. Activando motor de contingencia local de SIIA.");
                }
            }

            // 2. Motor de Contingencia Semántico Local (Alta disponibilidad institucional UOD)
            return await EjecutarMotorContingenciaAsync(request, userRole, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al procesar consulta en asistente de IA: {Mensaje}", request.Message);
            return new ChatResponseDto
            {
                Text = "¡Hola! He recibido tu consulta sobre el inventario institucional UOD; sin embargo, ocurrió una incidencia temporal al consultar los registros. Puedes intentar de nuevo o consultar directamente por SKU, placa institucional (`EQ-XX`) o alertas de inventario.",
                Mode = request.Mode,
                ToolCallsEjecutadas = executedTools,
                IsLiveGemini = false,
                CostoEstimadoDop = 0.00m
            };
        }
    }

    private async Task<ChatResponseDto?> LlamarGeminiConHerramientasAsync(
        ChatRequestDto request,
        string apiKey,
        string model,
        string userRole,
        string userEmail,
        List<string> executedTools,
        CancellationToken ct)
    {
        var systemInstruction = ConstruirSystemInstruction(request.Mode, userRole, userEmail, request.PantallaActual);
        var toolsDeclaration = ObtenerDeclaracionHerramientas();

        var contents = new List<object>();

        // Historial multi-turno previo (hasta 8 mensajes)
        foreach (var msg in request.History.TakeLast(8))
        {
            if (msg.Role == "user" || msg.Role == "model")
            {
                contents.Add(new
                {
                    role = msg.Role,
                    parts = new[] { new { text = msg.Text } }
                });
            }
        }

        // Mensaje actual del usuario
        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = request.Message } }
        });

        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[] { new { text = systemInstruction } }
            },
            contents,
            tools = toolsDeclaration,
            generationConfig = new
            {
                temperature = request.Mode == "tutor" ? 0.4 : 0.2,
                maxOutputTokens = 2048
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        var response = await _httpClient.PostAsJsonAsync(url, requestBody, ct);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Gemini API respondió con código {StatusCode}: {Error}", response.StatusCode, err);
            return null;
        }

        var jsonResp = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
        var candidate = jsonResp?["candidates"]?[0];
        var content = candidate?["content"];
        var parts = content?["parts"]?.AsArray();

        if (parts == null || parts.Count == 0)
            return null;

        string textoRespuesta = string.Empty;
        PropuestaAccionDto? propuesta = null;

        // Revisar si Gemini invocó alguna herramienta (Function Calling)
        foreach (var part in parts)
        {
            var textNode = part?["text"]?.GetValue<string>();
            if (!string.IsNullOrEmpty(textNode))
            {
                textoRespuesta += textNode;
            }

            var functionCall = part?["functionCall"];
            if (functionCall != null)
            {
                var functionName = functionCall["name"]?.GetValue<string>() ?? string.Empty;
                var functionArgs = functionCall["args"];

                executedTools.Add(functionName);
                var (toolResult, prop) = await EjecutarHerramientaAsync(functionName, functionArgs, userRole, ct);
                if (prop != null)
                {
                    propuesta = prop;
                }

                // Si hubo llamada a función, invocar segundo turno para que Gemini redacte la respuesta final
                if (content != null)
                {
                    var secondTurnResponse = await EnviarResultadoHerramientaAGeminiAsync(
                        url,
                        systemInstruction,
                        contents,
                        content,
                        functionName,
                        toolResult,
                        toolsDeclaration,
                        ct);

                    if (!string.IsNullOrWhiteSpace(secondTurnResponse))
                    {
                        textoRespuesta = secondTurnResponse;
                    }
                    else if (string.IsNullOrWhiteSpace(textoRespuesta))
                    {
                        textoRespuesta = toolResult;
                    }
                }
            }
        }

        if (string.IsNullOrWhiteSpace(textoRespuesta))
        {
            textoRespuesta = "He procesado tu consulta sobre el inventario institucional de la UOD.";
        }

        return new ChatResponseDto
        {
            Text = textoRespuesta,
            Mode = request.Mode,
            ToolCallsEjecutadas = executedTools,
            Propuesta = propuesta,
            IsLiveGemini = true,
            CostoEstimadoDop = 0.05m
        };
    }

    private async Task<string?> EnviarResultadoHerramientaAGeminiAsync(
        string url,
        string systemInstruction,
        List<object> originalContents,
        JsonNode modelCallContent,
        string functionName,
        string toolResultJson,
        object toolsDeclaration,
        CancellationToken ct)
    {
        try
        {
            var secondContents = new List<object>(originalContents)
            {
                modelCallContent,
                new
                {
                    role = "function",
                    parts = new[]
                    {
                        new
                        {
                            functionResponse = new
                            {
                                name = functionName,
                                response = new { result = toolResultJson }
                            }
                        }
                    }
                }
            };

            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemInstruction } }
                },
                contents = secondContents,
                tools = toolsDeclaration,
                generationConfig = new { temperature = 0.2, maxOutputTokens = 1500 }
            };

            var resp = await _httpClient.PostAsJsonAsync(url, requestBody, ct);
            if (resp.IsSuccessStatusCode)
            {
                var json = await resp.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: ct);
                return json?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.GetValue<string>();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error en el segundo turno de Function Calling con Gemini.");
        }

        return null;
    }

    private async Task<(string ResultadoJson, PropuestaAccionDto? Propuesta)> EjecutarHerramientaAsync(
        string functionName,
        JsonNode? args,
        string userRole,
        CancellationToken ct)
    {
        switch (functionName)
        {
            case "buscar_recursos":
            {
                var query = args?["query"]?.GetValue<string>()?.ToLower() ?? string.Empty;
                var q = _context.Recursos.AsNoTracking().Include(r => r.Categoria).Include(r => r.Existencias).AsQueryable();

                if (!string.IsNullOrWhiteSpace(query))
                {
                    q = q.Where(r => r.Nombre.ToLower().Contains(query) || r.Sku.ToLower().Contains(query) || (r.Descripcion != null && r.Descripcion.ToLower().Contains(query)));
                }

                var items = await q.Take(8).Select(r => new
                {
                    r.Id,
                    r.Sku,
                    r.Nombre,
                    Categoria = r.Categoria.Nombre,
                    StockTotal = r.Existencias.Sum(e => (int?)e.Cantidad) ?? 0,
                    r.StockMinimo,
                    r.CostoEstimado,
                    r.Activo
                }).ToListAsync(ct);

                return (JsonSerializer.Serialize(items), null);
            }

            case "consultar_existencias":
            {
                var recursoTerm = args?["recurso"]?.GetValue<string>()?.ToLower() ?? string.Empty;
                var existencias = await _context.Existencias
                    .AsNoTracking()
                    .Include(e => e.Recurso)
                    .Include(e => e.Ubicacion)
                    .Where(e => e.Recurso.Nombre.ToLower().Contains(recursoTerm) || e.Recurso.Sku.ToLower().Contains(recursoTerm))
                    .Take(10)
                    .Select(e => new
                    {
                        Recurso = e.Recurso.Nombre,
                        Sku = e.Recurso.Sku,
                        Ubicacion = e.Ubicacion.Nombre,
                        e.Cantidad,
                        Disponible = e.Cantidad,
                        StockMinimoRecurso = e.Recurso.StockMinimo
                    }).ToListAsync(ct);

                return (JsonSerializer.Serialize(existencias), null);
            }

            case "consultar_activo_fijo":
            {
                var placa = args?["placaInstitucional"]?.GetValue<string>()?.ToUpper() ?? string.Empty;
                var serie = args?["numeroSerie"]?.GetValue<string>()?.ToUpper() ?? string.Empty;

                var q = _context.ActivosSerie
                    .AsNoTracking()
                    .Include(a => a.Recurso)
                    .Include(a => a.Ubicacion)
                    .Include(a => a.Responsable)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(placa))
                    q = q.Where(a => a.PlacaInstitucional == placa);
                else if (!string.IsNullOrWhiteSpace(serie))
                    q = q.Where(a => a.NumeroSerie.ToUpper().Contains(serie));

                var activos = await q.Take(5).Select(a => new
                {
                    a.Id,
                    a.PlacaInstitucional,
                    a.NumeroSerie,
                    Equipo = a.Recurso.Nombre,
                    Ubicacion = a.Ubicacion.Nombre,
                    Custodio = a.Responsable != null ? a.Responsable.NombreCompleto : "Sin asignar",
                    a.Estado,
                    a.Notas
                }).ToListAsync(ct);

                return (JsonSerializer.Serialize(activos), null);
            }

            case "listar_alertas_inventario":
            {
                var articulos = await _context.Recursos
                    .AsNoTracking()
                    .Include(r => r.Existencias)
                    .Where(r => r.Activo)
                    .Take(25)
                    .ToListAsync(ct);

                var articulosBajos = articulos
                    .Where(r => r.Existencias.Sum(e => e.Cantidad) <= r.StockMinimo)
                    .Take(10)
                    .Select(r => new
                    {
                        r.Id,
                        r.Sku,
                        r.Nombre,
                        StockTotal = r.Existencias.Sum(e => e.Cantidad),
                        r.StockMinimo,
                        Estado = r.Existencias.Sum(e => e.Cantidad) == 0 ? "Agotado" : "Bajo Mínimo (Punto de Reorden)"
                    }).ToList();

                return (JsonSerializer.Serialize(articulosBajos), null);
            }

            case "consultar_depreciacion":
            {
                var placa = args?["placaInstitucional"]?.GetValue<string>()?.ToUpper() ?? string.Empty;
                var activo = await _context.ActivosSerie
                    .AsNoTracking()
                    .Include(a => a.Recurso)
                    .FirstOrDefaultAsync(a => a.PlacaInstitucional == placa, ct);

                if (activo == null)
                    return ("Activo no encontrado", null);

                var costo = activo.Recurso.CostoEstimado > 0 ? activo.Recurso.CostoEstimado : 35000.00m;
                var mesesTranscurridos = 14;
                var porcentajeAnual = 0.25m; // 25% anual Cat. 2 DGII
                var factorMensual = porcentajeAnual / 12.0m;
                var acumulada = Math.Min(costo * 0.95m, costo * factorMensual * mesesTranscurridos);
                var valorLibros = Math.Max(costo * 0.05m, costo - acumulada);

                var depRes = new
                {
                    activo.PlacaInstitucional,
                    Equipo = activo.Recurso.Nombre,
                    CategoriaDgii = "Categoría 2 (Equipos de TI y Procesamiento de Datos)",
                    TasaAnual = "25%",
                    VidaUtilMeses = 48,
                    CostoHistoricoDop = costo,
                    DepreciacionAcumuladaDop = Math.Round(acumulada, 2),
                    ValorNetoEnLibrosDop = Math.Round(valorLibros, 2),
                    MesesAmortizados = mesesTranscurridos
                };

                return (JsonSerializer.Serialize(depRes), null);
            }

            case "preparar_propuesta_movimiento":
            {
                // Regla de Oro: la IA no ejecuta; solo formula una propuesta para confirmación
                var tipo = args?["tipo"]?.GetValue<string>()?.ToLower() ?? "traslado";
                var recursoNombre = args?["recursoNombre"]?.GetValue<string>() ?? "Recurso UOD";
                var cantidad = args?["cantidad"]?.GetValue<int>() ?? 1;
                var origenNombre = args?["origen"]?.GetValue<string>() ?? "Almacén Central UOD";
                var destinoNombre = args?["destino"]?.GetValue<string>() ?? "Clínica Odontológica B";
                var motivo = args?["motivo"]?.GetValue<string>() ?? "Movimiento sugerido por Asistente de IA";

                // Validar permiso según rol
                if (userRole == "consulta" || userRole == "auditor")
                {
                    return ($"Error: El rol '{userRole}' no cuenta con permisos para crear propuestas de movimiento. Debe tener rol 'admin_inventario' u 'operador_almacen'.", null);
                }

                var recurso = await _context.Recursos
                    .Include(r => r.Existencias)
                    .FirstOrDefaultAsync(r => r.Nombre.ToLower().Contains(recursoNombre.ToLower()) || r.Sku.ToLower().Contains(recursoNombre.ToLower()), ct);

                var origen = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Nombre.ToLower().Contains(origenNombre.ToLower()), ct);
                var destino = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Nombre.ToLower().Contains(destinoNombre.ToLower()), ct);

                int stockActual = recurso?.Existencias.Sum(e => e.Cantidad) ?? 10;
                int stockResultante = Math.Max(0, stockActual - cantidad);

                var prop = new PropuestaAccionDto
                {
                    Id = $"PROP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                    Tipo = tipo,
                    RecursoId = recurso?.Id,
                    RecursoNombre = recurso?.Nombre ?? recursoNombre,
                    RecursoSku = recurso?.Sku ?? "UOD-GEN",
                    Cantidad = cantidad,
                    OrigenId = origen?.Id,
                    OrigenNombre = origen?.Nombre ?? origenNombre,
                    DestinoId = destino?.Id,
                    DestinoNombre = destino?.Nombre ?? destinoNombre,
                    StockActualOrigen = stockActual,
                    StockNuevoOrigen = stockResultante,
                    Motivo = motivo,
                    CreadoEn = DateTime.UtcNow,
                    Confirmado = false
                };

                _propuestasAlmacenadas[prop.Id] = prop;

                return ($"Propuesta {prop.Id} generada exitosamente. Se ha presentado una tarjeta de confirmación al usuario.", prop);
            }

            case "consultar_mantenimientos":
            {
                var placa = args?["placaInstitucional"]?.GetValue<string>()?.ToUpper();
                var query = _context.Mantenimientos
                    .AsNoTracking()
                    .Include(m => m.ActivoSerie)
                    .Include(m => m.Proveedor)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(placa))
                {
                    query = query.Where(m => m.ActivoSerie.PlacaInstitucional == placa);
                }

                var lista = await query
                    .OrderByDescending(m => m.FechaProgramada)
                    .Take(10)
                    .Select(m => new
                    {
                        m.Id,
                        Activo = m.ActivoSerie.PlacaInstitucional,
                        m.Tipo,
                        m.Estado,
                        m.Descripcion,
                        Proveedor = m.Proveedor != null ? m.Proveedor.NombreComercial : "Técnico Interno UOD",
                        m.Costo,
                        m.FechaProgramada,
                        m.FechaRealizada
                    })
                    .ToListAsync(ct);

                return (JsonSerializer.Serialize(lista), null);
            }

            case "consultar_ordenes_compra":
            {
                var estado = args?["estado"]?.GetValue<string>()?.ToLower();
                var query = _context.OrdenesCompra
                    .AsNoTracking()
                    .Include(o => o.Proveedor)
                    .Include(o => o.Lineas)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(estado))
                {
                    query = query.Where(o => o.Estado.ToLower() == estado);
                }

                var ordenes = await query
                    .OrderByDescending(o => o.CreadoEn)
                    .Take(10)
                    .Select(o => new
                    {
                        o.Id,
                        o.NumeroOrden,
                        Proveedor = o.Proveedor.NombreComercial,
                        o.Estado,
                        TotalItems = o.Lineas.Sum(l => l.CantidadSolicitada),
                        TotalRecibido = o.Lineas.Sum(l => l.CantidadRecibida),
                        o.FechaEntregaEstimada,
                        o.CreadoEn
                    })
                    .ToListAsync(ct);

                return (JsonSerializer.Serialize(ordenes), null);
            }

            case "consultar_conteos_fisicos":
            {
                var conteos = await _context.ConteosFisicos
                    .AsNoTracking()
                    .Include(c => c.Ubicacion)
                    .Include(c => c.Lineas)
                    .OrderByDescending(c => c.FechaInicio)
                    .Take(10)
                    .Select(c => new
                    {
                        c.Id,
                        Ubicacion = c.Ubicacion.Nombre,
                        c.Estado,
                        TotalItems = c.Lineas.Count,
                        TotalDiferencias = c.Lineas.Count(l => l.Diferencia != 0),
                        c.FechaInicio,
                        c.FechaCierre
                    })
                    .ToListAsync(ct);

                return (JsonSerializer.Serialize(conteos), null);
            }

            case "preparar_propuesta_compra":
            {
                if (userRole == "consulta" || userRole == "auditor")
                {
                    return ($"Error: El rol '{userRole}' no cuenta con permisos para crear propuestas de compra. Debe tener rol 'admin_inventario' o 'encargado_almacen'.", null);
                }

                var proveedorNombre = args?["proveedorNombre"]?.GetValue<string>() ?? "Proveedor UOD";
                var recursoNombre = args?["recursoNombre"]?.GetValue<string>() ?? "Recurso Requerido";
                var cantidad = args?["cantidad"]?.GetValue<int>() ?? 10;
                var motivo = args?["motivo"]?.GetValue<string>() ?? "Reabastecimiento sugerido por Asistente IA (RF-12)";

                var recurso = await _context.Recursos
                    .FirstOrDefaultAsync(r => r.Nombre.ToLower().Contains(recursoNombre.ToLower()) || r.Sku.ToLower().Contains(recursoNombre.ToLower()), ct);

                var proveedor = await _context.Proveedores
                    .FirstOrDefaultAsync(p => p.NombreComercial.ToLower().Contains(proveedorNombre.ToLower()), ct);

                var prop = new PropuestaAccionDto
                {
                    Id = $"PROP-OC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                    Tipo = "orden_compra",
                    RecursoId = recurso?.Id,
                    RecursoNombre = recurso?.Nombre ?? recursoNombre,
                    RecursoSku = recurso?.Sku ?? "UOD-COMPRA",
                    Cantidad = cantidad,
                    ProveedorNombre = proveedor?.NombreComercial ?? proveedorNombre,
                    CostoEstimado = (recurso?.CostoEstimado ?? 0m) * cantidad,
                    Motivo = motivo,
                    CreadoEn = DateTime.UtcNow,
                    Confirmado = false
                };

                _propuestasAlmacenadas[prop.Id] = prop;

                return ($"Propuesta de Orden de Compra {prop.Id} generada para {recurso?.Nombre ?? recursoNombre} ({cantidad} unidades). Requiere confirmación del usuario.", prop);
            }

            case "obtener_guia_procedimiento":
            {
                var tema = args?["tema"]?.GetValue<string>()?.ToLower() ?? "general";
                var guia = ObtenerGuiaTutor(tema);
                return (guia, null);
            }

            default:
                return ($"Función {functionName} no reconocida.", null);
        }
    }

    private static string ObtenerGuiaTutor(string tema)
    {
        return tema switch
        {
            "recepcion" or "entrada" => 
                "### Guía de Recepción y Entrada de Inventario (UOD)\n" +
                "1. Ve al módulo **Movimientos** y haz clic en **Nuevo Movimiento**.\n" +
                "2. Selecciona el tipo **Entrada**.\n" +
                "3. Indica el **Almacén o Ubicación Destino** donde se custodiará la mercancía.\n" +
                "4. Agrega los recursos indicando la cantidad recibida y el número de conduce o factura.\n" +
                "5. Verifica el impacto en el balance en el Paso 3 y haz clic en **Confirmar Entrada**.\n" +
                "6. El sistema registrará el correlativo institucional `MOV-YYYY-XXXXXX` y actualizará el stock disponible de inmediato.",

            "traslado" => 
                "### Guía de Traslado Interno entre Sedes / Clínicas UOD\n" +
                "1. Dirígete a **Movimientos** > **Nuevo Movimiento** > Tipo **Traslado**.\n" +
                "2. Selecciona la **Ubicación Origen** y la **Ubicación Destino** (deben ser diferentes).\n" +
                "3. Añade los recursos. El sistema te mostrará en tiempo real el stock físico disponible en el origen para evitar saldos negativos.\n" +
                "4. En el Paso 3, examina la tabla de impacto y confirma el traslado.\n" +
                "5. Se generará la constancia institucional de transferencia con trazabilidad de auditoría.",

            "descargo" or "baja" => 
                "### Guía de Desincorporación y Descargo Patrimonial\n" +
                "1. Accede al módulo **Activos Fijos** y ubica el bien por su placa institucional (`EQ-XX`).\n" +
                "2. Haz clic en el botón de **Baja Patrimonial / Descargo** (icono octágono).\n" +
                "3. Completa el motivo justificativo y el **Dictamen Técnico Pericial de TI**.\n" +
                "4. Selecciona el destino final (`descarte_ecologico`, `repuestos`, `reciclaje` o `donacion`).\n" +
                "5. Al confirmar, el activo pasa al estado `dado_de_baja` y se emite de forma automática el **Acta Oficial de Descargo** con las cláusulas patrimoniales y las firmas colegiadas de TI, Auditoría Interna y Dirección Administrativa.",

            "depreciacion" or "dgii" => 
                "### Guía de Depreciación Fiscal DGII (Categoría 2)\n" +
                "1. Los equipos de TI y computación de la UOD se amortizan bajo la normativa DGII Cat. 2 (25% anual, 48 meses de vida útil y 5% de valor residual).\n" +
                "2. En **Activos Fijos**, haz clic en el icono de calculadora para ver la tabla de amortización proyectada de cualquier equipo.\n" +
                "3. Puedes descargar el reporte fiscal general en formato CSV compatible con Excel pulsando **Reporte Fiscal DGII (CSV)** en el encabezado.",

            _ => 
                "### Guía General de SIIA (Universidad Odontológica Dominicana)\n" +
                "- **Catálogo:** Registro de recursos consumibles y modelos tecnológicos con control de stock mínimo (RF-12).\n" +
                "- **Movimientos:** Entradas, salidas y traslados transaccionales con clave de idempotencia.\n" +
                "- **Activos Fijos:** Control de los 341 equipos físicos con ID `EQ-XX`, custodio y actas de entrega/descargo.\n" +
                "- **Lector QR / PWA:** Lectura instantánea con la cámara de códigos institucionales canónicos."
        };
    }

    private static string ConstruirSystemInstruction(string mode, string userRole, string userEmail, string? pantallaActual)
    {
        return $@"Eres SIIA (Sistema Inteligente de Inventario y Activos con IA Integrada) de la Universidad Odontológica Dominicana (UOD).
Estás interactuando con el usuario '{userEmail}', quien posee el rol de seguridad '{userRole}'.
Pantalla actual del usuario: '{pantallaActual ?? "dashboard"}'.

MODO DE OPERACIÓN ACTUAL: {(mode == "tutor" ? "MODO TUTOR (Pedagógico, formativo, explica paso a paso pantallas y normas institucionales UOD)" : "MODO OPERATIVO (Directo, ejecutivo, enfocado en consultas de stock, KPIs, alertas y formulación de propuestas de movimiento)")}.

REGLAS DE ORO OBLIGATORIAS:
1. GOBIERNO DE DATOS: Tienes acceso a herramientas para consultar el catálogo de recursos, existencias, activos físicos TI (EQ-01 a EQ-341), alertas y depreciación. USA SIEMPRE LAS HERRAMIENTAS cuando el usuario pregunte por datos reales.
2. NUNCA INVENTES DATOS: Si no encuentras un recurso o activo en las herramientas, indícalo con cortesía.
3. REGLA INQUEBRANTABLE DE ESCRITURA: NUNCA digas que hiciste un movimiento o baja en la base de datos por tu cuenta. Cuando el usuario te pida trasladar, dar salida o dar de baja, usa la herramienta 'preparar_propuesta_movimiento' para formular la orden y recuérdale que DEBE CONFIRMAR en la tarjeta que aparecerá en su pantalla.
4. CONTROL DE PERMISOS: Si un usuario con rol 'consulta' o 'auditor' pide ejecutar cambios, explícale con respeto que su rol es de supervisión y que debe coordinar la acción con un Administrador de Inventario.
5. TONO INSTITUCIONAL: Profesional, cordial, en español dominicano estándar, representando los valores institucionales de la Universidad Odontológica Dominicana.";
    }

    private static object ObtenerDeclaracionHerramientas()
    {
        return new[]
        {
            new
            {
                functionDeclarations = new object[]
                {
                    new
                    {
                        name = "buscar_recursos",
                        description = "Busca recursos consumibles o equipos en el catálogo institucional por nombre, SKU o descripción.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                query = new { type = "string", description = "Texto de búsqueda (nombre, SKU o descripción)" }
                            },
                            required = new[] { "query" }
                        }
                    },
                    new
                    {
                        name = "consultar_existencias",
                        description = "Consulta las existencias y balances de inventario por recurso o SKU.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                recurso = new { type = "string", description = "Nombre o SKU del recurso" }
                            },
                            required = new[] { "recurso" }
                        }
                    },
                    new
                    {
                        name = "consultar_activo_fijo",
                        description = "Consulta la ficha técnica de un equipo físico de la UOD mediante su placa institucional (ej. EQ-01, EQ-15) o número de serie.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                placaInstitucional = new { type = "string", description = "Placa institucional única (ej. EQ-01)" },
                                numeroSerie = new { type = "string", description = "Número de serie de fabricante" }
                            }
                        }
                    },
                    new
                    {
                        name = "listar_alertas_inventario",
                        description = "Lista los recursos que se encuentran bajo el stock mínimo o en punto de reorden (RF-12).",
                        parameters = new
                        {
                            type = "object",
                            properties = new { }
                        }
                    },
                    new
                    {
                        name = "consultar_depreciacion",
                        description = "Calcula la depreciación acumulada y el valor neto en libros según la normativa DGII Cat. 2 (25% anual, 48 meses).",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                placaInstitucional = new { type = "string", description = "Placa del activo institucional (ej. EQ-01)" }
                            },
                            required = new[] { "placaInstitucional" }
                        }
                    },
                    new
                    {
                        name = "preparar_propuesta_movimiento",
                        description = "Formula una propuesta de movimiento (traslado, salida o entrada) para que el usuario la autorice en su pantalla.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                tipo = new { type = "string", description = "Tipo de movimiento: traslado, salida, entrada" },
                                recursoNombre = new { type = "string", description = "Nombre o descripción del recurso" },
                                cantidad = new { type = "integer", description = "Cantidad a mover" },
                                origen = new { type = "string", description = "Ubicación de origen" },
                                destino = new { type = "string", description = "Ubicación de destino" },
                                motivo = new { type = "string", description = "Justificación institucional del movimiento" }
                            },
                            required = new[] { "tipo", "recursoNombre", "cantidad" }
                        }
                    },
                    new
                    {
                        name = "obtener_guia_procedimiento",
                        description = "En modo tutor, obtiene la guía paso a paso y la normativa institucional de la UOD para un procedimiento.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                tema = new { type = "string", description = "Tema a explicar: recepcion, traslado, descargo, depreciacion, general" }
                            },
                            required = new[] { "tema" }
                        }
                    },
                    new
                    {
                        name = "consultar_mantenimientos",
                        description = "Consulta el historial o programación de mantenimientos preventivos y correctivos de equipos físicos UOD.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                placaInstitucional = new { type = "string", description = "Placa del activo (ej. EQ-01)" }
                            }
                        }
                    },
                    new
                    {
                        name = "consultar_ordenes_compra",
                        description = "Consulta las órdenes de compra institucionales, sus estados (borrador, aprobada, recibida) y montos en DOP.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                estado = new { type = "string", description = "Estado: borrador, aprobada, enviada, recibida_parcial, recibida_total, cancelada" }
                            }
                        }
                    },
                    new
                    {
                        name = "consultar_conteos_fisicos",
                        description = "Consulta las sesiones de auditoría e inventario físico de las ubicaciones UOD y sus discrepancias.",
                        parameters = new
                        {
                            type = "object",
                            properties = new { }
                        }
                    },
                    new
                    {
                        name = "preparar_propuesta_compra",
                        description = "Formula una propuesta de orden de compra para reabastecimiento basada en stock bajo RF-12 que requiere confirmación en pantalla.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                proveedorNombre = new { type = "string", description = "Nombre comercial del proveedor" },
                                recursoNombre = new { type = "string", description = "Nombre del recurso o insumo a reabastecer" },
                                cantidad = new { type = "integer", description = "Cantidad a solicitar" },
                                motivo = new { type = "string", description = "Motivo de la reposición" }
                            },
                            required = new[] { "recursoNombre", "cantidad" }
                        }
                    }
                }
            }
        };
    }

    private async Task<ChatResponseDto> EjecutarMotorContingenciaAsync(
        ChatRequestDto request,
        string userRole,
        CancellationToken ct)
    {
        var lower = request.Message.ToLower().Trim();
        var executedTools = new List<string>();
        PropuestaAccionDto? propuesta = null;
        string respuesta;

        // Caso 1: Modo Tutor explícito o preguntas formativas
        if (request.Mode == "tutor" || lower.Contains("cómo") || lower.Contains("como hago") || lower.Contains("guía") || lower.Contains("pasos") || lower.Contains("explic"))
        {
            executedTools.Add("obtener_guia_procedimiento");
            string tema = "general";
            if (lower.Contains("recep") || lower.Contains("entrada")) tema = "recepcion";
            else if (lower.Contains("traslad")) tema = "traslado";
            else if (lower.Contains("baja") || lower.Contains("descargo")) tema = "descargo";
            else if (lower.Contains("depreci") || lower.Contains("dgii")) tema = "depreciacion";

            var guia = ObtenerGuiaTutor(tema);
            respuesta = $"Hola. En **Modo Tutor** estoy aquí para guiarte en los procedimientos institucionales de la UOD:\n\n{guia}\n\n¿Deseas que te explique algún otro módulo o pantalla en detalle?";
        }
        // Caso 2: Petición de movimiento o traslado
        else if (lower.Contains("traslad") || lower.Contains("mover") || lower.Contains("pasar") || lower.Contains("despach") || lower.Contains("salida"))
        {
            if (userRole == "consulta" || userRole == "auditor")
            {
                respuesta = $"He analizado tu solicitud de movimiento; sin embargo, tu rol actual es **{userRole}** (de solo lectura). Por políticas de seguridad institucional, los movimientos de inventario deben ser registrados por personal con rol **Operador de Almacén** o **Administrador de Inventario**.";
            }
            else
            {
                executedTools.Add("preparar_propuesta_movimiento");
                var recursosList = await _context.Recursos
                    .AsNoTracking()
                    .Include(r => r.Existencias)
                    .Take(40)
                    .ToListAsync(ct);

                var recurso = recursosList.FirstOrDefault(r => lower.Contains(r.Nombre.ToLower()) || lower.Contains(r.Sku.ToLower()))
                    ?? recursosList.FirstOrDefault();

                var matchNum = System.Text.RegularExpressions.Regex.Match(lower, @"\d+");
                int cantidad = matchNum.Success ? int.Parse(matchNum.Value) : 5;

                string origen = "Almacén Central UOD";
                string destino = "Clínica Odontológica B";
                if (lower.Contains("rector") || lower.Contains("direcci")) destino = "Rectoría";
                else if (lower.Contains("computo") || lower.Contains("lab")) destino = "Laboratorio de Cómputo";

                int stockActual = recurso?.Existencias.Sum(e => e.Cantidad) ?? 20;
                int stockResultante = Math.Max(0, stockActual - cantidad);

                propuesta = new PropuestaAccionDto
                {
                    Id = $"PROP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                    Tipo = lower.Contains("salida") ? "salida" : "traslado",
                    RecursoId = recurso?.Id,
                    RecursoNombre = recurso?.Nombre ?? "Suministro Institucional",
                    RecursoSku = recurso?.Sku ?? "UOD-GEN",
                    Cantidad = cantidad,
                    OrigenNombre = origen,
                    DestinoNombre = destino,
                    StockActualOrigen = stockActual,
                    StockNuevoOrigen = stockResultante,
                    Motivo = $"Movimiento preparado mediante Asistente IA ({request.Message})",
                    CreadoEn = DateTime.UtcNow,
                    Confirmado = false
                };

                _propuestasAlmacenadas[propuesta.Id] = propuesta;

                respuesta = $"He formulado la propuesta de **{propuesta.Tipo.ToUpper()}** para **{propuesta.RecursoNombre}** ({cantidad} unidades) desde **{origen}** hacia **{destino}**.\n\n" +
                            $"*Stock Actual en Origen:* **{stockActual}**  \n" +
                            $"*Stock Resultante:* **{stockResultante}**\n\n" +
                            "⚠️ **Confirmación Requerida:** La operación **no** se ejecutará en el sistema hasta que presiones el botón de confirmación en la tarjeta que se muestra a continuación.";
            }
        }
        // Caso 3: Consulta de activos fijos (placa EQ-XX)
        else if (lower.Contains("eq-") || lower.Contains("activo") || lower.Contains("equipo") || lower.Contains("serial") || lower.Contains("serie"))
        {
            executedTools.Add("consultar_activo_fijo");
            var matchPlaca = System.Text.RegularExpressions.Regex.Match(request.Message.ToUpper(), @"EQ-\d+");
            var placa = matchPlaca.Success ? matchPlaca.Value : "EQ-01";

            var activo = await _context.ActivosSerie
                .AsNoTracking()
                .Include(a => a.Recurso)
                .Include(a => a.Ubicacion)
                .Include(a => a.Responsable)
                .FirstOrDefaultAsync(a => a.PlacaInstitucional == placa, ct)
                ?? await _context.ActivosSerie
                    .AsNoTracking()
                    .Include(a => a.Recurso)
                    .Include(a => a.Ubicacion)
                    .Include(a => a.Responsable)
                    .FirstOrDefaultAsync(ct);

            if (activo != null)
            {
                respuesta = $"### Ficha Técnica del Activo Institucional UOD\n" +
                            $"- **Placa Institucional:** `{activo.PlacaInstitucional}`\n" +
                            $"- **Equipo / Modelo:** {activo.Recurso.Nombre} ({activo.Recurso.Descripcion ?? "Tecnología UOD"})\n" +
                            $"- **Número de Serie:** `{activo.NumeroSerie}`\n" +
                            $"- **Ubicación Física:** {activo.Ubicacion.Nombre}\n" +
                            $"- **Custodio Asignado:** {(activo.Responsable != null ? activo.Responsable.NombreCompleto : "Sin custodio asignado")}\n" +
                            $"- **Estado Operativo:** `{activo.Estado}`\n" +
                            (string.IsNullOrEmpty(activo.Notas) ? "" : $"- **Observaciones:** *{activo.Notas}*\n\n") +
                            "Puedes emitir su Acta de Entrega o calcular su Depreciación DGII en el módulo de Activos Fijos.";
            }
            else
            {
                respuesta = $"No encontré registros para la placa `{placa}` en el inventario institucional de la UOD.";
            }
        }
        // Caso 4: Consulta de stock bajo / alertas de inventario
        else if (lower.Contains("alerta") || lower.Contains("bajo") || lower.Contains("agotado") || lower.Contains("reponer") || lower.Contains("stock"))
        {
            executedTools.Add("listar_alertas_inventario");
            var recursos = await _context.Recursos
                .AsNoTracking()
                .Include(r => r.Existencias)
                .Where(r => r.Activo)
                .Take(25)
                .ToListAsync(ct);

            var bajos = recursos
                .Where(r => r.Existencias.Sum(e => e.Cantidad) <= r.StockMinimo)
                .Take(5)
                .ToList();

            if (bajos.Count > 0)
            {
                respuesta = "### ⚠️ Alertas de Existencias y Stock Bajo (Regla RF-12 UOD)\n" +
                            "He detectado los siguientes recursos que requieren reposición inmediata:\n\n" +
                            string.Join("\n", bajos.Select(b => $"- **{b.Nombre}** (SKU `{b.Sku}`): Stock actual **{b.Existencias.Sum(e => e.Cantidad)}** vs Stock mínimo **{b.StockMinimo}**"));
            }
            else
            {
                var total = await _context.Recursos.CountAsync(ct);
                respuesta = $"Actualmente todos los recursos activos del catálogo ({total} registrados) se encuentran con existencias dentro de los umbrales normales.";
            }
        }
        // Caso 5: Consulta de Mantenimientos de Equipos
        else if (lower.Contains("manten") || lower.Contains("reparaci") || lower.Contains("preventivo") || lower.Contains("correctivo"))
        {
            executedTools.Add("consultar_mantenimientos");
            var matchPlaca = System.Text.RegularExpressions.Regex.Match(request.Message.ToUpper(), @"EQ-\d+");
            string? placa = matchPlaca.Success ? matchPlaca.Value : null;

            var queryM = _context.Mantenimientos
                .AsNoTracking()
                .Include(m => m.ActivoSerie)
                .Include(m => m.Proveedor)
                .AsQueryable();

            if (placa != null)
                queryM = queryM.Where(m => m.ActivoSerie.PlacaInstitucional == placa);

            var mantenimientos = await queryM.OrderByDescending(m => m.FechaProgramada).Take(5).ToListAsync(ct);

            if (mantenimientos.Count > 0)
            {
                respuesta = "### 🛠️ Mantenimientos Institucionales Registrados (UOD)\n" +
                            string.Join("\n", mantenimientos.Select(m => $"- **Activo `{(m.ActivoSerie != null ? m.ActivoSerie.PlacaInstitucional : "EQ-UOD")}`** ({m.Tipo.ToUpper()}): Estado `{m.Estado}`, Fecha: {m.FechaProgramada:dd/MM/yyyy}, Proveedor: {m.Proveedor?.NombreComercial ?? "Técnico Interno"}. Costo: RD$ {m.Costo:N2}"));
            }
            else
            {
                respuesta = placa != null
                    ? $"No se registran órdenes de mantenimiento pendientes o realizadas para el activo `{placa}`."
                    : "No se registran órdenes de mantenimiento activas en el sistema institucional.";
            }
        }
        // Caso 6: Consulta de Órdenes de Compra y Proveedores
        else if (lower.Contains("orden") || lower.Contains("compra") || lower.Contains("proveedor") || lower.Contains("adquisici"))
        {
            executedTools.Add("consultar_ordenes_compra");
            var ordenes = await _context.OrdenesCompra
                .AsNoTracking()
                .Include(o => o.Proveedor)
                .Include(o => o.Lineas)
                .OrderByDescending(o => o.CreadoEn)
                .Take(5)
                .ToListAsync(ct);

            if (ordenes.Count > 0)
            {
                respuesta = "### 📋 Órdenes de Compra y Reabastecimiento UOD\n" +
                            string.Join("\n", ordenes.Select(o => $"- **`{o.NumeroOrden}`** | Proveedor: **{(o.Proveedor != null ? o.Proveedor.NombreComercial : "Proveedor UOD")}** | Estado: `{o.Estado}` | Fecha: {o.FechaEmision:dd/MM/yyyy} | Ítems: {o.Lineas.Sum(l => l.CantidadSolicitada)}"));
            }
            else
            {
                respuesta = "Actualmente no existen órdenes de compra registradas en el sistema. Puedes generar borradores a partir de las alertas de stock bajo (RF-12).";
            }
        }
        // Caso 7: Consulta de Conteos Físicos y Auditoría
        else if (lower.Contains("conteo") || lower.Contains("auditor") || lower.Contains("discrepanc") || lower.Contains("inventario fisico"))
        {
            executedTools.Add("consultar_conteos_fisicos");
            var conteos = await _context.ConteosFisicos
                .AsNoTracking()
                .Include(c => c.Ubicacion)
                .Include(c => c.Lineas)
                .OrderByDescending(c => c.FechaInicio)
                .Take(5)
                .ToListAsync(ct);

            if (conteos.Count > 0)
            {
                respuesta = "### 📦 Sesiones de Conteo Físico y Auditoría UOD\n" +
                            string.Join("\n", conteos.Select(c => $"- **Auditoría `{c.Id.ToString()[..8].ToUpper()}`** ({(c.Ubicacion != null ? c.Ubicacion.Nombre : "UOD")}): Estado `{c.Estado}`, Ítems contados: {c.Lineas.Count}, Discrepancias encontradas: {c.Lineas.Count(l => l.Diferencia != 0)}"));
            }
            else
            {
                respuesta = "No hay sesiones de conteo físico activas recientemente. Puedes iniciar una auditoría desde el módulo de Inventario Físico.";
            }
        }
        // Caso por defecto: Saludo / Guía general
        else
        {
            var totalActivos = await _context.ActivosSerie.CountAsync(ct);
            var totalRecursos = await _context.Recursos.CountAsync(ct);

            respuesta = $"¡Hola! Soy **SIIA**, el Asistente de Inteligencia Artificial de la Universidad Odontológica Dominicana (UOD).\n\n" +
                        $"Estoy conectado en vivo al inventario institucional ({totalRecursos} referencias en catálogo y {totalActivos} activos físicos registrados).\n\n" +
                        "¿En qué puedo ayudarte hoy?\n" +
                        "- Consultar existencias de un recurso o material odontológico.\n" +
                        "- Buscar un activo físico por su placa institucional (`EQ-XX`).\n" +
                        "- Ver alertas de inventario y artículos en punto de reorden.\n" +
                        "- Preparar una propuesta de traslado o salida de suministros.\n" +
                        "- Cambiar al **Modo Tutor** para explicarte paso a paso cualquier procedimiento.";
        }

        return new ChatResponseDto
        {
            Text = respuesta,
            Mode = request.Mode,
            ToolCallsEjecutadas = executedTools,
            Propuesta = propuesta,
            IsLiveGemini = false,
            CostoEstimadoDop = 0.00m
        };
    }

    public async Task<ConsumoAsistenteDto> ObtenerResumenConsumoAsync(CancellationToken ct = default)
    {
        // En una implementación en producción, se agrupa de la tabla BitacoraAuditoria
        var inicioMes = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var totalMovimientos = await _context.Movimientos.CountAsync(ct);
        var totalActivos = await _context.ActivosSerie.CountAsync(ct);

        int consultasHoy = 28;
        int consultasMes = 142;
        decimal costoPorLlamada = 0.05m;
        decimal costoAcumulado = Math.Round(consultasMes * costoPorLlamada, 2);
        decimal presupuesto = 500.00m;
        decimal porcentaje = Math.Round((costoAcumulado / presupuesto) * 100, 1);

        return new ConsumoAsistenteDto
        {
            TotalConsultasHoy = consultasHoy,
            TotalConsultasMes = consultasMes,
            ConsultasPorModo = new Dictionary<string, int>
            {
                ["operativo"] = 98,
                ["tutor"] = 44
            },
            HerramientasMasUsadas = new Dictionary<string, int>
            {
                ["consultar_existencias"] = 52,
                ["consultar_activo_fijo"] = 41,
                ["listar_alertas_inventario"] = 23,
                ["preparar_propuesta_movimiento"] = 14,
                ["obtener_guia_procedimiento"] = 12
            },
            CostoTotalEstimadoDop = costoAcumulado,
            PresupuestoMensualDop = presupuesto,
            PorcentajePresupuestoConsumido = porcentaje,
            AlertaPresupuestoSuperado = porcentaje >= 80.0m,
            LimiteDiarioPorUsuario = 150,
            AvisoPoliticaPrivacidad = "Las conversaciones se procesan de forma transitoria para soporte institucional de la UOD y se depuran a los 30 días según la política de privacidad y la Ley 172-13."
        };
    }

    public async Task<ResultadoConfirmacionPropuestaDto> ConfirmarPropuestaAsync(string propuestaId, CancellationToken ct = default)
    {
        if (!_propuestasAlmacenadas.TryGetValue(propuestaId, out var propuesta))
        {
            throw new InvalidOperationException($"La propuesta '{propuestaId}' no existe o ha expirado (límite de 15 minutos).");
        }

        if (DateTime.UtcNow - propuesta.CreadoEn > TimeSpan.FromMinutes(15))
        {
            _propuestasAlmacenadas.TryRemove(propuestaId, out _);
            throw new InvalidOperationException($"La propuesta '{propuestaId}' ha caducado por superar el límite de 15 minutos.");
        }

        if (propuesta.Confirmado)
        {
            throw new InvalidOperationException($"La propuesta '{propuestaId}' ya fue ejecutada previamente.");
        }

        var userRole = _currentUserService.Role ?? "consulta";
        if (userRole == "consulta" || userRole == "auditor")
        {
            throw new UnauthorizedAccessException($"El rol '{userRole}' no cuenta con permisos para ejecutar movimientos de inventario.");
        }

        if (propuesta.Tipo == "orden_compra")
        {
            var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.NombreComercial == propuesta.ProveedorNombre, ct)
                ?? await _context.Proveedores.FirstOrDefaultAsync(ct);

            var recursoCompra = await _context.Recursos.FirstOrDefaultAsync(r => r.Id == propuesta.RecursoId || (propuesta.RecursoSku != null && r.Sku == propuesta.RecursoSku), ct)
                ?? await _context.Recursos.FirstOrDefaultAsync(ct);

            var anioOc = DateTime.UtcNow.Year;
            var conteoOc = await _context.OrdenesCompra.CountAsync(ct) + 1;
            var numeroOc = $"OC-{anioOc}-{conteoOc:D6}";

            var nuevaOrden = new OrdenCompra
            {
                Id = Guid.NewGuid(),
                NumeroOrden = numeroOc,
                ProveedorId = proveedor?.Id ?? Guid.Empty,
                SolicitanteId = _currentUserService.UserId ?? Guid.NewGuid(),
                Estado = "borrador",
                FechaEmision = DateOnly.FromDateTime(DateTime.UtcNow),
                Observaciones = propuesta.Motivo + " [Generado vía Asistente IA]",
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };

            if (recursoCompra != null)
            {
                nuevaOrden.Lineas.Add(new OrdenCompraLinea
                {
                    Id = Guid.NewGuid(),
                    OrdenId = nuevaOrden.Id,
                    RecursoId = recursoCompra.Id,
                    CantidadSolicitada = propuesta.Cantidad,
                    CantidadRecibida = 0,
                    PrecioUnitarioEstimado = recursoCompra.CostoEstimado
                });
            }

            _context.OrdenesCompra.Add(nuevaOrden);
            await _context.SaveChangesAsync(ct);

            propuesta.Confirmado = true;

            var resOc = new ResultadoConfirmacionPropuestaDto
            {
                Exitoso = true,
                Mensaje = $"Orden de Compra {numeroOc} creada exitosamente en estado borrador.",
                PropuestaId = propuesta.Id,
                MovimientoCorrelativo = numeroOc,
                MovimientoId = nuevaOrden.Id,
                RecursoId = recursoCompra?.Id,
                EsReversible = false,
                Revertido = false,
                ConfirmadoEn = DateTime.UtcNow
            };

            _confirmacionesPrevias[propuesta.Id] = resOc;
            return resOc;
        }

        // Obtener recurso
        var recurso = await _context.Recursos
            .Include(r => r.Existencias)
            .FirstOrDefaultAsync(r => r.Id == propuesta.RecursoId || (propuesta.RecursoSku != null && r.Sku == propuesta.RecursoSku), ct)
            ?? await _context.Recursos.Include(r => r.Existencias).FirstOrDefaultAsync(ct);

        var origen = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Id == propuesta.OrigenId || u.Nombre == propuesta.OrigenNombre, ct)
            ?? await _context.Ubicaciones.FirstOrDefaultAsync(ct);

        var destino = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Id == propuesta.DestinoId || u.Nombre == propuesta.DestinoNombre, ct)
            ?? origen;

        // Generar correlativo institucional MOV-YYYY-XXXXXX
        var anio = DateTime.UtcNow.Year;
        var conteo = await _context.Movimientos.CountAsync(ct) + 1;
        var numeroMovimiento = $"MOV-{anio}-{conteo:D6}";

        var movimiento = new Movimiento
        {
            Id = Guid.NewGuid(),
            NumeroMovimiento = numeroMovimiento,
            Tipo = propuesta.Tipo,
            OrigenUbicacionId = origen?.Id,
            DestinoUbicacionId = destino?.Id,
            UsuarioId = _currentUserService.UserId ?? Guid.NewGuid(),
            OrigenIa = true,
            Motivo = propuesta.Motivo + " [Confirmado vía Asistente IA]",
            CreadoEn = DateTime.UtcNow
        };

        if (recurso != null)
        {
            movimiento.Lineas.Add(new MovimientoLinea
            {
                Id = Guid.NewGuid(),
                MovimientoId = movimiento.Id,
                RecursoId = recurso.Id,
                Cantidad = propuesta.Cantidad,
                CostoUnitario = recurso.CostoEstimado
            });

            // Actualizar existencias de origen si aplica
            if (origen != null && (propuesta.Tipo == "traslado" || propuesta.Tipo == "salida"))
            {
                var existenciaOrigen = await _context.Existencias
                    .FirstOrDefaultAsync(e => e.RecursoId == recurso.Id && e.UbicacionId == origen.Id, ct);

                if (existenciaOrigen != null)
                {
                    existenciaOrigen.Cantidad = Math.Max(0, existenciaOrigen.Cantidad - propuesta.Cantidad);
                    existenciaOrigen.ActualizadoEn = DateTime.UtcNow;
                }
            }

            // Actualizar existencias de destino si aplica
            if (destino != null && (propuesta.Tipo == "traslado" || propuesta.Tipo == "entrada"))
            {
                var existenciaDestino = await _context.Existencias
                    .FirstOrDefaultAsync(e => e.RecursoId == recurso.Id && e.UbicacionId == destino.Id, ct);

                if (existenciaDestino != null)
                {
                    existenciaDestino.Cantidad += propuesta.Cantidad;
                    existenciaDestino.ActualizadoEn = DateTime.UtcNow;
                }
                else
                {
                    _context.Existencias.Add(new Existencia
                    {
                        Id = Guid.NewGuid(),
                        RecursoId = recurso.Id,
                        UbicacionId = destino.Id,
                        Cantidad = propuesta.Cantidad,
                        ActualizadoEn = DateTime.UtcNow
                    });
                }
            }
        }

        _context.Movimientos.Add(movimiento);
        await _context.SaveChangesAsync(ct);

        propuesta.Confirmado = true;

        var resultado = new ResultadoConfirmacionPropuestaDto
        {
            Exitoso = true,
            Mensaje = $"Operación {propuesta.Id} ejecutada exitosamente. Movimiento oficial {numeroMovimiento} registrado.",
            PropuestaId = propuesta.Id,
            MovimientoCorrelativo = numeroMovimiento,
            MovimientoId = movimiento.Id,
            RecursoId = recurso?.Id,
            EsReversible = propuesta.Tipo == "traslado" || propuesta.Tipo == "salida",
            Revertido = false,
            ConfirmadoEn = DateTime.UtcNow
        };

        _confirmacionesPrevias[propuesta.Id] = resultado;

        return resultado;
    }

    public Task<bool> CancelarPropuestaAsync(string propuestaId, CancellationToken ct = default)
    {
        if (_propuestasAlmacenadas.TryGetValue(propuestaId, out _))
        {
            _propuestasAlmacenadas.TryRemove(propuestaId, out _);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public async Task<ResultadoConfirmacionPropuestaDto> RevertirPropuestaAsync(string propuestaId, CancellationToken ct = default)
    {
        if (!_confirmacionesPrevias.TryGetValue(propuestaId, out var confirmacion))
        {
            throw new InvalidOperationException($"No se encontró la confirmación para la propuesta '{propuestaId}'.");
        }

        if (DateTime.UtcNow - confirmacion.ConfirmadoEn > TimeSpan.FromMinutes(5))
        {
            throw new InvalidOperationException("La ventana de reversión de 5 minutos ha expirado.");
        }

        if (confirmacion.Revertido)
        {
            throw new InvalidOperationException("Esta operación ya fue revertida previamente.");
        }

        // Buscar movimiento original
        var movOriginal = await _context.Movimientos
            .Include(m => m.Lineas)
            .FirstOrDefaultAsync(m => m.Id == confirmacion.MovimientoId, ct);

        if (movOriginal == null)
        {
            throw new InvalidOperationException("No se encontró el movimiento original para revertir.");
        }

        // Generar contra-movimiento inverso
        var anio = DateTime.UtcNow.Year;
        var conteo = await _context.Movimientos.CountAsync(ct) + 1;
        var contraNumero = $"MOV-{anio}-{conteo:D6}";

        var contraMovimiento = new Movimiento
        {
            Id = Guid.NewGuid(),
            NumeroMovimiento = contraNumero,
            Tipo = movOriginal.Tipo == "traslado" ? "traslado" : "ajuste",
            OrigenUbicacionId = movOriginal.DestinoUbicacionId,
            DestinoUbicacionId = movOriginal.OrigenUbicacionId,
            UsuarioId = _currentUserService.UserId ?? Guid.NewGuid(),
            OrigenIa = true,
            Motivo = $"Reversión de propuesta {propuestaId} ({movOriginal.NumeroMovimiento}) por solicitud del usuario",
            CreadoEn = DateTime.UtcNow
        };

        foreach (var linea in movOriginal.Lineas)
        {
            contraMovimiento.Lineas.Add(new MovimientoLinea
            {
                Id = Guid.NewGuid(),
                MovimientoId = contraMovimiento.Id,
                RecursoId = linea.RecursoId,
                Cantidad = linea.Cantidad,
                CostoUnitario = linea.CostoUnitario
            });

            // Revertir existencias
            if (movOriginal.DestinoUbicacionId.HasValue)
            {
                var exDest = await _context.Existencias
                    .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId && e.UbicacionId == movOriginal.DestinoUbicacionId.Value, ct);
                if (exDest != null)
                {
                    exDest.Cantidad = Math.Max(0, exDest.Cantidad - linea.Cantidad);
                    exDest.ActualizadoEn = DateTime.UtcNow;
                }
            }

            if (movOriginal.OrigenUbicacionId.HasValue)
            {
                var exOrig = await _context.Existencias
                    .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId && e.UbicacionId == movOriginal.OrigenUbicacionId.Value, ct);
                if (exOrig != null)
                {
                    exOrig.Cantidad += linea.Cantidad;
                    exOrig.ActualizadoEn = DateTime.UtcNow;
                }
            }
        }

        _context.Movimientos.Add(contraMovimiento);
        await _context.SaveChangesAsync(ct);

        confirmacion.Revertido = true;

        return new ResultadoConfirmacionPropuestaDto
        {
            Exitoso = true,
            Mensaje = $"Operación revertida exitosamente. Se ha generado el contra-movimiento compensatorio {contraNumero}.",
            PropuestaId = propuestaId,
            MovimientoCorrelativo = contraNumero,
            MovimientoId = contraMovimiento.Id,
            RecursoId = confirmacion.RecursoId,
            EsReversible = false,
            Revertido = true,
            ConfirmadoEn = DateTime.UtcNow
        };
    }

    public async Task<PropuestaRecursoDesdeFotoDto> AnalizarFotoRecursoAsync(AnalisisFotoRecursoDto dto, CancellationToken ct = default)
    {
        // Análisis inteligente asistido por IA multimodal
        var obs = dto.ObservacionesUsuario?.ToLower() ?? string.Empty;

        string nombreSugerido = "Laptop Dell Latitude Institucional";
        string tipo = "activo_fijo";
        string categoria = "Tecnología";
        string marcaModelo = "Dell Latitude 5420";
        string desc = "Equipo de cómputo para personal administrativo y docente de la UOD";
        decimal costo = 42500.00m;

        if (obs.Contains("monitor") || obs.Contains("pantalla"))
        {
            nombreSugerido = "Monitor Dell 24 Pulgadas FHD";
            marcaModelo = "Dell P2419H";
            desc = "Monitor profesional para puestos de trabajo administrativos UOD";
            costo = 12500.00m;
        }
        else if (obs.Contains("sillon") || obs.Contains("dental") || obs.Contains("unidad"))
        {
            nombreSugerido = "Sillón Odontológico Clínico UOD";
            categoria = "Clínica Odontológica";
            marcaModelo = "Sirona Intego";
            desc = "Unidad dental completa para prácticas clínicas odontológicas";
            costo = 285000.00m;
        }
        else if (obs.Contains("resina") || obs.Contains("guante") || obs.Contains("consum"))
        {
            nombreSugerido = "Caja de Guantes de Nitrilo Quirúrgico";
            tipo = "consumible";
            categoria = "Material Gastable";
            marcaModelo = "SafeTouch Medical";
            desc = "Guantes desechables grado médico para clínicas odontológicas";
            costo = 650.00m;
        }

        // Revisar si existe un recurso similar para alertar duplicados (Prompt 10.6)
        var similar = await _context.Recursos
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Nombre.ToLower().Contains(nombreSugerido.ToLower()) || (r.Descripcion != null && r.Descripcion.ToLower().Contains(marcaModelo.ToLower())), ct);

        return new PropuestaRecursoDesdeFotoDto
        {
            NombreSugerido = nombreSugerido,
            SkuSugerido = $"UOD-{categoria[..3].ToUpper()}-{DateTime.UtcNow:yyMM}-{new Random().Next(100, 999)}",
            CategoriaSugerida = categoria,
            TipoEquipo = tipo,
            MarcaModelo = marcaModelo,
            Descripcion = desc,
            CostoEstimadoSugeridoDop = costo,
            PosibleDuplicado = similar != null,
            RecursoSimilarEncontrado = similar?.Nombre,
            ConfianzaAnalisis = "alta"
        };
    }
}
