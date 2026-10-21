using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ChatMessageDto
{
    [Required]
    public string Role { get; set; } = "user"; // "user", "model", "system"

    [Required]
    public string Text { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ChatRequestDto
{
    [Required(ErrorMessage = "El mensaje del usuario es obligatorio.")]
    [MinLength(1, ErrorMessage = "El mensaje no puede estar vacío.")]
    public string Message { get; set; } = string.Empty;

    public List<ChatMessageDto> History { get; set; } = new();

    public string Mode { get; set; } = "operativo"; // "operativo" o "tutor"

    public string? PantallaActual { get; set; } // "catalogo", "activos", "movimientos", "dashboard", etc.
}

public class PropuestaAccionDto
{
    public string Id { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty; // "traslado", "salida", "entrada", "descargo", "mantenimiento"
    public Guid? RecursoId { get; set; }
    public string RecursoNombre { get; set; } = string.Empty;
    public string? RecursoSku { get; set; }
    public Guid? ActivoId { get; set; }
    public string? PlacaInstitucional { get; set; }
    public int Cantidad { get; set; } = 1;
    public Guid? OrigenId { get; set; }
    public string? OrigenNombre { get; set; }
    public Guid? DestinoId { get; set; }
    public string? DestinoNombre { get; set; }
    public int? StockActualOrigen { get; set; }
    public int? StockNuevoOrigen { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? DictamenTecnico { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public bool Confirmado { get; set; } = false;
}

public class ChatResponseDto
{
    public string Text { get; set; } = string.Empty;
    public string Mode { get; set; } = "operativo";
    public List<string> ToolCallsEjecutadas { get; set; } = new();
    public PropuestaAccionDto? Propuesta { get; set; }
    public bool IsLiveGemini { get; set; } = true;
    public decimal CostoEstimadoDop { get; set; } = 0.00m;
}

public class ConsumoAsistenteDto
{
    public int TotalConsultasHoy { get; set; }
    public int TotalConsultasMes { get; set; }
    public Dictionary<string, int> ConsultasPorModo { get; set; } = new();
    public Dictionary<string, int> HerramientasMasUsadas { get; set; } = new();
    public decimal CostoTotalEstimadoDop { get; set; }
    public decimal PresupuestoMensualDop { get; set; } = 500.00m;
    public decimal PorcentajePresupuestoConsumido { get; set; }
    public bool AlertaPresupuestoSuperado { get; set; } = false;
    public int LimiteDiarioPorUsuario { get; set; } = 150;
    public string AvisoPoliticaPrivacidad { get; set; } = "Las conversaciones se procesan de forma transitoria para soporte institucional y se depuran a los 30 días según la política de privacidad UOD y la Ley 172-13.";
}

public class ResultadoConfirmacionPropuestaDto
{
    public bool Exitoso { get; set; } = true;
    public string Mensaje { get; set; } = string.Empty;
    public string PropuestaId { get; set; } = string.Empty;
    public string? MovimientoCorrelativo { get; set; }
    public Guid? MovimientoId { get; set; }
    public Guid? RecursoId { get; set; }
    public Guid? ActivoId { get; set; }
    public string? PlacaInstitucional { get; set; }
    public bool EsReversible { get; set; } = true;
    public bool Revertido { get; set; } = false;
    public DateTime ConfirmadoEn { get; set; } = DateTime.UtcNow;
}

public class AnalisisFotoRecursoDto
{
    [Required(ErrorMessage = "La imagen o captura es obligatoria.")]
    public string FotoBase64 { get; set; } = string.Empty;

    public string MimeType { get; set; } = "image/jpeg";

    public string? ObservacionesUsuario { get; set; }
}

public class PropuestaRecursoDesdeFotoDto
{
    public string NombreSugerido { get; set; } = string.Empty;
    public string? SkuSugerido { get; set; }
    public string CategoriaSugerida { get; set; } = "Tecnología";
    public string TipoEquipo { get; set; } = "activo_fijo"; // consumible o activo_fijo
    public string MarcaModelo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal CostoEstimadoSugeridoDop { get; set; } = 0.00m;
    public bool PosibleDuplicado { get; set; } = false;
    public string? RecursoSimilarEncontrado { get; set; }
    public string ConfianzaAnalisis { get; set; } = "alta"; // alta, media, baja
}
