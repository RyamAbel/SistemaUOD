using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Application.Common.Security;

public static class Policies
{
    public const string ExigirSuperAdmin = "ExigirSuperAdmin";
    public const string ExigirGestionInventario = "ExigirGestionInventario";
    public const string ExigirOperacionAlmacen = "ExigirOperacionAlmacen";
    public const string ExigirAuditoria = "ExigirAuditoria";
    public const string ExigirUsuarioActivo = "ExigirUsuarioActivo";

    public static readonly string[] RolesGestionInventario = [
        RolesUsuario.SuperAdmin,
        RolesUsuario.AdminInventario
    ];

    public static readonly string[] RolesOperacionAlmacen = [
        RolesUsuario.SuperAdmin,
        RolesUsuario.AdminInventario,
        RolesUsuario.EncargadoAlmacen
    ];

    public static readonly string[] RolesAuditoria = [
        RolesUsuario.SuperAdmin,
        RolesUsuario.AdminInventario,
        RolesUsuario.Auditor
    ];
}
