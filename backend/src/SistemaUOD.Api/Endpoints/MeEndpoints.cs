using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Api.Endpoints;

public static class MeEndpoints
{
    public static IEndpointRouteBuilder MapMeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/me")
            .WithTags("Usuario Autenticado")
            .RequireAuthorization();

        group.MapGet("/", async (
            ICurrentUserService currentUser,
            IApplicationDbContext dbContext,
            IHostEnvironment env,
            CancellationToken ct) =>
        {
            var userId = currentUser.UserId;
            if (userId == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "No autenticado",
                    detail: "El token JWT provisto no contiene un identificador de usuario válido.");
            }

            var perfil = await dbContext.Perfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == userId.Value, ct);

            if (perfil == null)
            {
                if (env.IsDevelopment() && userId == Guid.Parse("00000000-0000-0000-0000-000000000001"))
                {
                    return Results.Ok(new PerfilDto
                    {
                        Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                        Correo = "admin@uod.edu.do",
                        NombreCompleto = "Administrador UOD (Desarrollo)",
                        Rol = RolesUsuario.SuperAdmin,
                        Departamento = "Tecnología e Información",
                        Activo = true,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow,
                        Permisos = ["usuarios:gestionar", "recursos:crear", "recursos:editar", "movimientos:crear", "ia:usar"]
                    });
                }

                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Acceso denegado",
                    detail: "No se encontró un perfil institucional activo vinculado a esta cuenta.");
            }

            if (!perfil.Activo)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Cuenta desactivada",
                    detail: "La cuenta institucional del usuario ha sido desactivada por administración.");
            }

            var dto = new PerfilDto
            {
                Id = perfil.Id,
                Correo = perfil.Correo,
                NombreCompleto = perfil.NombreCompleto,
                Rol = perfil.Rol,
                Departamento = perfil.Departamento,
                Telefono = perfil.Telefono,
                Activo = perfil.Activo,
                CreadoEn = perfil.CreadoEn,
                ActualizadoEn = perfil.ActualizadoEn,
                Permisos = ObtenerPermisosPorRol(perfil.Rol)
            };

            return Results.Ok(dto);
        })
        .WithName("ObtenerMiPerfil")
        .WithSummary("Obtiene el perfil institucional y los permisos del usuario autenticado");

        return app;
    }

    private static List<string> ObtenerPermisosPorRol(string rol)
    {
        return rol switch
        {
            "super_admin" => [
                "usuarios:gestionar", "recursos:crear", "recursos:editar", "recursos:eliminar",
                "movimientos:crear", "conteos:crear", "conteos:conciliar", "bitacora:ver",
                "alertas:gestionar", "ia:usar", "configuracion:modificar"
            ],
            "admin_inventario" => [
                "recursos:crear", "recursos:editar", "movimientos:crear",
                "conteos:crear", "conteos:conciliar", "bitacora:ver", "alertas:gestionar", "ia:usar"
            ],
            "encargado_almacen" => [
                "recursos:ver", "movimientos:crear", "conteos:crear", "alertas:ver", "ia:usar"
            ],
            "solicitante" => [
                "recursos:ver", "solicitudes:crear", "prestamos:solicitar", "ia:usar"
            ],
            "auditor" => [
                "recursos:ver", "movimientos:ver", "conteos:ver", "bitacora:ver", "reportes:exportar"
            ],
            _ => ["recursos:ver"]
        };
    }
}
