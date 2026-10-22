using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class AlertaDto
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Severidad { get; set; } = string.Empty;
    public Guid? RecursoId { get; set; }
    public string? RecursoNombre { get; set; }
    public string? RecursoSku { get; set; }
    public Guid? UbicacionId { get; set; }
    public string? UbicacionNombre { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Leida { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class AlertaFiltrosDto
{
    public string? Tipo { get; set; }
    public string? Severidad { get; set; }
    public bool? Leida { get; set; }
    public Guid? RecursoId { get; set; }
    public Guid? UbicacionId { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 20;
}

public class CrearAlertaDto
{
    [Required(ErrorMessage = "El tipo de alerta es obligatorio.")]
    public string Tipo { get; set; } = "sistema";

    [Required(ErrorMessage = "La severidad es obligatoria.")]
    public string Severidad { get; set; } = "info";

    public Guid? RecursoId { get; set; }
    public Guid? UbicacionId { get; set; }

    [Required(ErrorMessage = "El título de la alerta es obligatorio.")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder 200 caracteres.")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El mensaje de la alerta es obligatorio.")]
    public string Mensaje { get; set; } = string.Empty;
}

public class ResumenAlertasDto
{
    public int TotalNoLeidas { get; set; }
    public int TotalUrgentes { get; set; }
    public int TotalAdvertencias { get; set; }
    public int TotalInfo { get; set; }
    public Dictionary<string, int> PorTipo { get; set; } = new();
}

public class EvaluacionAlertasResultadoDto
{
    public int AlertasGeneradas { get; set; }
    public int AlertasOmitidasExistentes { get; set; }
    public List<string> Mensajes { get; set; } = new();
}

public class NotificacionPreferenciaDto
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public bool RecibirAlertasStock { get; set; } = true;
    public bool RecibirAlertasMantenimiento { get; set; } = true;
    public bool RecibirResumenSemanal { get; set; } = false;
    public DateTime ActualizadoEn { get; set; }
}

public class ActualizarPreferenciaDto
{
    public bool RecibirAlertasStock { get; set; } = true;
    public bool RecibirAlertasMantenimiento { get; set; } = true;
    public bool RecibirResumenSemanal { get; set; } = false;
}

public class ColaCorreoDto
{
    public Guid Id { get; set; }
    public string Destinatario { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Estado { get; set; } = "pendiente";
    public int Intentos { get; set; }
    public string? UltimoError { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime? ProcesadoEn { get; set; }
}
