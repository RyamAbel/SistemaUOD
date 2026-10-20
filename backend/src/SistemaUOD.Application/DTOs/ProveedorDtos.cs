using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ProveedorDto
{
    public Guid Id { get; set; }
    public string Rnc { get; set; } = string.Empty;
    public string NombreComercial { get; set; } = string.Empty;
    public string? RazonSocial { get; set; }
    public string? ContactoNombre { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public int PlazoCreditoDias { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public int ActivosSuministradosCount { get; set; }
}

public class CrearProveedorDto
{
    [Required(ErrorMessage = "El RNC o cédula del proveedor es obligatorio.")]
    [RegularExpression(@"^[0-9]{9,11}$", ErrorMessage = "El RNC debe contener exclusivamente entre 9 y 11 dígitos numéricos sin guiones.")]
    public string Rnc { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre comercial del proveedor es obligatorio.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "El nombre comercial debe tener entre 2 y 200 caracteres.")]
    public string NombreComercial { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La razón social no puede exceder los 200 caracteres.")]
    public string? RazonSocial { get; set; }

    [StringLength(100, ErrorMessage = "El nombre de contacto no puede exceder los 100 caracteres.")]
    public string? ContactoNombre { get; set; }

    [Phone(ErrorMessage = "El número telefónico provisto no tiene un formato válido.")]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico provisto no tiene un formato válido.")]
    public string? Correo { get; set; }

    [StringLength(300, ErrorMessage = "La dirección no puede exceder los 300 caracteres.")]
    public string? Direccion { get; set; }

    [Range(0, 365, ErrorMessage = "El plazo de crédito en días debe estar comprendido entre 0 y 365 días.")]
    public int PlazoCreditoDias { get; set; } = 30;

    public bool Activo { get; set; } = true;
}

public class ActualizarProveedorDto
{
    [Required(ErrorMessage = "El RNC o cédula del proveedor es obligatorio.")]
    [RegularExpression(@"^[0-9]{9,11}$", ErrorMessage = "El RNC debe contener exclusivamente entre 9 y 11 dígitos numéricos sin guiones.")]
    public string Rnc { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre comercial del proveedor es obligatorio.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "El nombre comercial debe tener entre 2 y 200 caracteres.")]
    public string NombreComercial { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "La razón social no puede exceder los 200 caracteres.")]
    public string? RazonSocial { get; set; }

    [StringLength(100, ErrorMessage = "El nombre de contacto no puede exceder los 100 caracteres.")]
    public string? ContactoNombre { get; set; }

    [Phone(ErrorMessage = "El número telefónico provisto no tiene un formato válido.")]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico provisto no tiene un formato válido.")]
    public string? Correo { get; set; }

    [StringLength(300, ErrorMessage = "La dirección no puede exceder los 300 caracteres.")]
    public string? Direccion { get; set; }

    [Range(0, 365, ErrorMessage = "El plazo de crédito en días debe estar comprendido entre 0 y 365 días.")]
    public int PlazoCreditoDias { get; set; } = 30;

    public bool Activo { get; set; } = true;
}
