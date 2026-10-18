namespace SistemaUOD.Application.DTOs;

public class PerfilDto
{
    public Guid Id { get; set; }
    public string Correo { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string? Departamento { get; set; }
    public string? Telefono { get; set; }
    public bool Activo { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public List<string> Permisos { get; set; } = new();
}
