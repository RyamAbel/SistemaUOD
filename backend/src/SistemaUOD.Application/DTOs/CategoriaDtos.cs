using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class CategoriaDto
{
    public Guid Id { get; set; }
    public Guid? CategoriaPadreId { get; set; }
    public string? CategoriaPadreNombre { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public int SubcategoriasCount { get; set; }
    public int RecursosCount { get; set; }
}

public class CrearCategoriaDto
{
    public Guid? CategoriaPadreId { get; set; }

    [Required(ErrorMessage = "El código de la categoría es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El código debe tener entre 2 y 50 caracteres.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de la categoría es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "La descripción no puede exceder los 500 caracteres.")]
    public string? Descripcion { get; set; }

    public bool Activa { get; set; } = true;
}

public class ActualizarCategoriaDto
{
    public Guid? CategoriaPadreId { get; set; }

    [Required(ErrorMessage = "El código de la categoría es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El código debe tener entre 2 y 50 caracteres.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de la categoría es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "La descripción no puede exceder los 500 caracteres.")]
    public string? Descripcion { get; set; }

    public bool Activa { get; set; } = true;
}

public class CambiarEstadoDto
{
    public bool Activo { get; set; }
}
