namespace SistemaUOD.Domain.Enums;

public enum RolUsuario
{
    SuperAdmin,
    AdminInventario,
    EncargadoAlmacen,
    Solicitante,
    Auditor,
    Consulta
}

public enum TipoArticulo
{
    Consumible,
    ActivoFijo
}

public enum TipoMovimiento
{
    Entrada,
    Salida,
    Traslado,
    AjustePositivo,
    AjusteNegativo,
    Baja,
    Devolucion
}

public enum EstadoActivo
{
    Disponible,
    Asignado,
    EnPrestamo,
    EnMantenimiento,
    DadoDeBaja
}

public enum EstadoOrdenCompra
{
    Borrador,
    Solicitada,
    Aprobada,
    RecibidaParcial,
    RecibidaTotal,
    Cancelada
}

public enum EstadoPrestamo
{
    Activo,
    Devuelto,
    Vencido,
    ConIncidencia
}
