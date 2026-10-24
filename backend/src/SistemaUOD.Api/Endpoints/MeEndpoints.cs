using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Api.Endpoints;

public static class MeEndpoints
{
    private const long MaxTamanoAvatarBytes = 5 * 1024 * 1024; // 5 MB
    private const string BucketAvatars = "recursos-fotos";

    public static IEndpointRouteBuilder MapMeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/me")
            .WithTags("Usuario Autenticado")
            .RequireAuthorization();

        // 1. Obtener mi perfil institucional
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
                        NombreCompleto = "Administrador UOD",
                        Rol = RolesUsuario.SuperAdmin,
                        Cargo = "Administrador de Sistemas TI",
                        Departamento = "Tecnología e Inventario",
                        Telefono = "(809) 555-0100",
                        AvatarUrl = null,
                        Activo = true,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow,
                        Permisos = ["usuarios:gestionar", "recursos:crear", "recursos:editar", "movimientos:crear", "ia:usar"]
                    });
                }

                // Auto-provisionar perfil para cualquier usuario autenticado con Google OAuth
                var correoAuth = currentUser.Email ?? "usuario@uod.edu.do";
                var nombreAuth = correoAuth.Contains('@') ? correoAuth.Split('@')[0] : "Usuario";

                var nuevoPerfil = new SistemaUOD.Domain.Entities.Perfil
                {
                    Id = userId.Value,
                    Correo = correoAuth,
                    NombreCompleto = nombreAuth,
                    Rol = RolesUsuario.AdminInventario,
                    Cargo = "Personal Autorizado",
                    Departamento = "Inventario y Almacén",
                    Activo = true,
                    CreadoEn = DateTime.UtcNow,
                    ActualizadoEn = DateTime.UtcNow
                };

                try
                {
                    dbContext.Perfiles.Add(nuevoPerfil);
                    await dbContext.SaveChangesAsync(ct);
                    perfil = nuevoPerfil;
                }
                catch
                {
                    perfil = await dbContext.Perfiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == userId.Value, ct) ?? nuevoPerfil;
                }
            }

            if (!perfil.Activo)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Cuenta desactivada",
                    detail: "La cuenta institucional del usuario ha sido desactivada por administración.");
            }

            // Si el perfil aún no tiene AvatarUrl configurado (es nulo y no se ha marcado como "none"), intentar extraerlo de Google OAuth
            if (perfil.AvatarUrl == null && dbContext is DbContext concreteDb)
            {
                try
                {
                    var avatarGoogle = await concreteDb.Database
                        .SqlQueryRaw<string>("SELECT COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture') FROM auth.users WHERE id = {0}", perfil.Id)
                        .FirstOrDefaultAsync(ct);

                    if (!string.IsNullOrWhiteSpace(avatarGoogle))
                    {
                        var perfilDb = await dbContext.Perfiles.FirstOrDefaultAsync(p => p.Id == perfil.Id, ct);
                        if (perfilDb != null)
                        {
                            perfilDb.AvatarUrl = avatarGoogle;
                            await dbContext.SaveChangesAsync(ct);
                            perfil.AvatarUrl = avatarGoogle;
                        }
                    }
                }
                catch
                {
                    // Ignorar si no se puede consultar auth.users directamente
                }
            }

            var dto = new PerfilDto
            {
                Id = perfil.Id,
                Correo = perfil.Correo,
                NombreCompleto = perfil.NombreCompleto,
                Rol = perfil.Rol,
                Cargo = perfil.Cargo,
                Departamento = perfil.Departamento,
                Telefono = perfil.Telefono,
                AvatarUrl = perfil.AvatarUrl,
                Preferencias = perfil.Preferencias,
                Activo = perfil.Activo,
                CreadoEn = perfil.CreadoEn,
                ActualizadoEn = perfil.ActualizadoEn,
                Permisos = ObtenerPermisosPorRol(perfil.Rol)
            };

            return Results.Ok(dto);
        })
        .WithName("ObtenerMiPerfil")
        .WithSummary("Obtiene el perfil institucional y los permisos del usuario autenticado");

        // 2. Actualizar datos de mi propio perfil (nombre, cargo, depto, teléfono)
        group.MapPut("/", async (
            ActualizarPerfilDto request,
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

            if (string.IsNullOrWhiteSpace(request.NombreCompleto) || request.NombreCompleto.Trim().Length < 2)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Nombre inválido",
                    detail: "El nombre completo es obligatorio y debe tener al menos 2 caracteres.");
            }

            var perfil = await dbContext.Perfiles.FirstOrDefaultAsync(p => p.Id == userId.Value, ct);

            if (perfil == null)
            {
                if (env.IsDevelopment() && userId == Guid.Parse("00000000-0000-0000-0000-000000000001"))
                {
                    // Crear perfil en dev si no existe
                    perfil = new Perfil
                    {
                        Id = userId.Value,
                        Correo = "admin@uod.edu.do",
                        NombreCompleto = request.NombreCompleto.Trim(),
                        Rol = RolesUsuario.SuperAdmin,
                        Cargo = request.Cargo?.Trim(),
                        Departamento = request.Departamento?.Trim(),
                        Telefono = request.Telefono?.Trim(),
                        AvatarUrl = request.AvatarUrl,
                        Activo = true,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow
                    };
                    dbContext.Perfiles.Add(perfil);
                }
                else
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Perfil no encontrado",
                        detail: "No se encontró el registro de perfil correspondiente al usuario.");
                }
            }
            else
            {
                perfil.NombreCompleto = request.NombreCompleto.Trim();
                perfil.Cargo = string.IsNullOrWhiteSpace(request.Cargo) ? null : request.Cargo.Trim();
                perfil.Departamento = string.IsNullOrWhiteSpace(request.Departamento) ? null : request.Departamento.Trim();
                perfil.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
                if (request.AvatarUrl != null)
                {
                    perfil.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl;
                }
                perfil.ActualizadoEn = DateTime.UtcNow;
            }

            // Registrar en bitácora de auditoría inmutable (Ley 172-13)
            dbContext.BitacoraAuditorias.Add(new BitacoraAuditoria
            {
                Id = Guid.NewGuid(),
                UsuarioId = perfil.Id,
                Origen = "humano",
                Accion = "UPDATE",
                Entidad = "perfiles",
                RegistroId = perfil.Id.ToString(),
                ValoresNuevos = System.Text.Json.JsonSerializer.Serialize(new { perfil.NombreCompleto, perfil.Cargo, perfil.Departamento, perfil.Telefono }),
                CreadoEn = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(ct);

            var resultadoDto = new PerfilDto
            {
                Id = perfil.Id,
                Correo = perfil.Correo,
                NombreCompleto = perfil.NombreCompleto,
                Rol = perfil.Rol,
                Cargo = perfil.Cargo,
                Departamento = perfil.Departamento,
                Telefono = perfil.Telefono,
                AvatarUrl = perfil.AvatarUrl,
                Preferencias = perfil.Preferencias,
                Activo = perfil.Activo,
                CreadoEn = perfil.CreadoEn,
                ActualizadoEn = perfil.ActualizadoEn,
                Permisos = ObtenerPermisosPorRol(perfil.Rol)
            };

            return Results.Ok(resultadoDto);
        })
        .WithName("ActualizarMiPerfil")
        .WithSummary("Actualiza los datos personales (nombre, cargo, departamento, teléfono) del usuario autenticado");

        // 3. Subir foto de avatar de perfil (Multipart form-data, max 5 MB, JPG/PNG/WebP)
        group.MapPost("/avatar", async (
            IFormFile file,
            ICurrentUserService currentUser,
            IApplicationDbContext dbContext,
            IStorageService storageService,
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

            if (file == null || file.Length == 0)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Archivo no provisto",
                    detail: "Debe adjuntar un archivo de imagen válido (JPG, PNG o WebP de hasta 5 MB).");
            }

            if (file.Length > MaxTamanoAvatarBytes)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Tamaño excedido",
                    detail: "La foto de perfil excede el tamaño máximo permitido de 5 MB.");
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, ct);
            memoryStream.Position = 0;

            var (esValido, extensionReal, mimeReal) = ValidarCabeceraBinaria(memoryStream);
            if (!esValido)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Formato no admitido",
                    detail: "El formato de la imagen no es válido. Solo se admiten archivos JPG, PNG o WebP certificados.");
            }

            var perfil = await dbContext.Perfiles.FirstOrDefaultAsync(p => p.Id == userId.Value, ct);
            if (perfil == null)
            {
                if (env.IsDevelopment() && userId == Guid.Parse("00000000-0000-0000-0000-000000000001"))
                {
                    perfil = new Perfil
                    {
                        Id = userId.Value,
                        Correo = "admin@uod.edu.do",
                        NombreCompleto = "Administrador UOD",
                        Rol = RolesUsuario.SuperAdmin,
                        Activo = true,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow
                    };
                    dbContext.Perfiles.Add(perfil);
                }
                else
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Perfil no encontrado",
                        detail: "No se encontró el registro de perfil correspondiente al usuario.");
                }
            }

            string avatarUrl;
            try
            {
                memoryStream.Position = 0;
                var rutaDestino = $"avatars/{perfil.Id}_{DateTime.UtcNow.Ticks}{extensionReal}";
                avatarUrl = await storageService.SubirArchivoAsync(BucketAvatars, rutaDestino, memoryStream, mimeReal, ct);
            }
            catch
            {
                memoryStream.Position = 0;
                var base64 = Convert.ToBase64String(memoryStream.ToArray());
                avatarUrl = $"data:{mimeReal};base64,{base64}";
            }

            perfil.AvatarUrl = avatarUrl;
            perfil.ActualizadoEn = DateTime.UtcNow;

            dbContext.BitacoraAuditorias.Add(new BitacoraAuditoria
            {
                Id = Guid.NewGuid(),
                UsuarioId = perfil.Id,
                Origen = "humano",
                Accion = "UPDATE",
                Entidad = "perfiles",
                RegistroId = perfil.Id.ToString(),
                ValoresNuevos = System.Text.Json.JsonSerializer.Serialize(new { Accion = "ACTUALIZAR_AVATAR" }),
                CreadoEn = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(ct);

            var resultadoDto = new PerfilDto
            {
                Id = perfil.Id,
                Correo = perfil.Correo,
                NombreCompleto = perfil.NombreCompleto,
                Rol = perfil.Rol,
                Cargo = perfil.Cargo,
                Departamento = perfil.Departamento,
                Telefono = perfil.Telefono,
                AvatarUrl = perfil.AvatarUrl,
                Preferencias = perfil.Preferencias,
                Activo = perfil.Activo,
                CreadoEn = perfil.CreadoEn,
                ActualizadoEn = perfil.ActualizadoEn,
                Permisos = ObtenerPermisosPorRol(perfil.Rol)
            };

            return Results.Ok(resultadoDto);
        })
        .WithName("SubirAvatarPerfil")
        .WithSummary("Sube y asocia una foto de perfil personalizada (máx. 5 MB, JPG/PNG/WebP) al usuario autenticado")
        .DisableAntiforgery();

        // 4. Eliminar foto de avatar (volver a iniciales)
        group.MapDelete("/avatar", async (
            ICurrentUserService currentUser,
            IApplicationDbContext dbContext,
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

            var perfil = await dbContext.Perfiles.FirstOrDefaultAsync(p => p.Id == userId.Value, ct);
            if (perfil == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Perfil no encontrado",
                    detail: "No se encontró el registro de perfil correspondiente al usuario.");
            }

            perfil.AvatarUrl = "none";
            perfil.ActualizadoEn = DateTime.UtcNow;

            dbContext.BitacoraAuditorias.Add(new BitacoraAuditoria
            {
                Id = Guid.NewGuid(),
                UsuarioId = perfil.Id,
                Origen = "humano",
                Accion = "UPDATE",
                Entidad = "perfiles",
                RegistroId = perfil.Id.ToString(),
                ValoresNuevos = System.Text.Json.JsonSerializer.Serialize(new { Accion = "ELIMINAR_AVATAR" }),
                CreadoEn = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(ct);

            return Results.Ok(new { mensaje = "Foto de perfil eliminada correctamente" });
        })
        .WithName("EliminarAvatarPerfil")
        .WithSummary("Elimina la foto de perfil del usuario autenticado");

        // 5. Guardar preferencias de usuario (Tema, Densidad, Alertas)
        group.MapPut("/preferencias", async (
            ActualizarPreferenciasDto request,
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

            var perfil = await dbContext.Perfiles.FirstOrDefaultAsync(p => p.Id == userId.Value, ct);
            if (perfil == null)
            {
                if (env.IsDevelopment() && userId == Guid.Parse("00000000-0000-0000-0000-000000000001"))
                {
                    perfil = new Perfil
                    {
                        Id = userId.Value,
                        Correo = "admin@uod.edu.do",
                        NombreCompleto = "Administrador UOD",
                        Rol = RolesUsuario.SuperAdmin,
                        Preferencias = request.Preferencias,
                        Activo = true,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow
                    };
                    dbContext.Perfiles.Add(perfil);
                }
                else
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Perfil no encontrado",
                        detail: "No se encontró el registro de perfil correspondiente al usuario.");
                }
            }
            else
            {
                perfil.Preferencias = request.Preferencias;
                perfil.ActualizadoEn = DateTime.UtcNow;
            }

            dbContext.BitacoraAuditorias.Add(new BitacoraAuditoria
            {
                Id = Guid.NewGuid(),
                UsuarioId = perfil.Id,
                Origen = "humano",
                Accion = "UPDATE",
                Entidad = "perfiles",
                RegistroId = perfil.Id.ToString(),
                ValoresNuevos = System.Text.Json.JsonSerializer.Serialize(new { Accion = "ACTUALIZAR_PREFERENCIAS", request.Preferencias }),
                CreadoEn = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                mensaje = "Preferencias guardadas exitosamente",
                preferencias = perfil.Preferencias
            });
        })
        .WithName("ActualizarPreferencias")
        .WithSummary("Actualiza las preferencias de interfaz y notificaciones del usuario autenticado");

        return app;
    }

    private static (bool esValido, string extension, string mime) ValidarCabeceraBinaria(Stream stream)
    {
        if (stream.Length < 12) return (false, "", "");

        var buffer = new byte[12];
        stream.Position = 0;
        var bytesLeidos = stream.Read(buffer, 0, 12);
        stream.Position = 0;

        if (bytesLeidos < 12) return (false, "", "");

        // 1. JPEG: FF D8 FF
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
        {
            return (true, ".jpg", "image/jpeg");
        }

        // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
        if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 &&
            buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A)
        {
            return (true, ".png", "image/png");
        }

        // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
        if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
            buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
        {
            return (true, ".webp", "image/webp");
        }

        return (false, "", "");
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
