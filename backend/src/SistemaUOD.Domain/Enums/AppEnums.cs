namespace SistemaUOD.Domain.Enums;

public static class RolesUsuario
{
    public const string SuperAdmin = "super_admin";
    public const string AdminInventario = "admin_inventario";
    public const string EncargadoAlmacen = "encargado_almacen";
    public const string Solicitante = "solicitante";
    public const string Auditor = "auditor";
    public const string Consulta = "consulta";

    public static readonly string[] Todos = [
        SuperAdmin,
        AdminInventario,
        EncargadoAlmacen,
        Solicitante,
        Auditor,
        Consulta
    ];
}

public static class TiposRecurso
{
    public const string Consumible = "consumible";
    public const string ActivoFijo = "activo_fijo";
}

public static class EstadosRecurso
{
    public const string Disponible = "disponible";
    public const string EnUso = "en_uso";
    public const string Prestado = "prestado";
    public const string EnMantenimiento = "en_mantenimiento";
    public const string Danado = "danado";
    public const string DadoDeBaja = "dado_de_baja";
}

public static class TiposUbicacion
{
    public const string Sede = "sede";
    public const string Edificio = "edificio";
    public const string Almacen = "almacen";
    public const string Clinica = "clinica";
    public const string Laboratorio = "laboratorio";
    public const string AreaQuirurgica = "area_quirurgica";
}

public static class TiposCodigo
{
    public const string QrPropio = "qr_propio";
    public const string BarraEan13 = "barra_ean13";
    public const string Upc = "upc";
    public const string ReferenciaFabricante = "referencia_fabricante";
}

public static class TiposMovimiento
{
    public const string Entrada = "entrada";
    public const string Salida = "salida";
    public const string Traslado = "traslado";
    public const string Ajuste = "ajuste";
    public const string Devolucion = "devolucion";
    public const string Baja = "baja";
}

public static class TiposAsignacion
{
    public const string AsignacionFija = "asignacion_fija";
    public const string PrestamoTemporal = "prestamo_temporal";
}

public static class EstadosAsignacion
{
    public const string Activo = "activo";
    public const string Devuelto = "devuelto";
    public const string Vencido = "vencido";
}

public static class OrígenesAuditoria
{
    public const string Humano = "humano";
    public const string AsistenteIa = "asistente_ia";
    public const string SistemaBackground = "sistema_background";
}
