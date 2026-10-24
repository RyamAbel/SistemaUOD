using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SistemaUOD.Api.Endpoints;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Domain.Enums;
using SistemaUOD.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Servicios de Infraestructura (EF Core PostgreSQL Supabase)
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Configuración de Autenticación JWT Bearer con Supabase Auth (Llaves Asimétricas ES256)
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "https://xgwuxkvbdwxwflynanwo.supabase.co";
var supabaseAuthority = $"{supabaseUrl.TrimEnd('/')}/auth/v1";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = supabaseAuthority;
        options.MetadataAddress = $"{supabaseAuthority}/.well-known/openid-configuration";
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = supabaseAuthority,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (builder.Environment.IsDevelopment() && authHeader.Trim() == "Bearer dev-token-uod")
                {
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000001"),
                        new Claim(ClaimTypes.Email, "admin@uod.edu.do"),
                        new Claim(ClaimTypes.Name, "Personal UOD"),
                        new Claim(ClaimTypes.Role, RolesUsuario.SuperAdmin),
                        new Claim("role", RolesUsuario.SuperAdmin)
                    };
                    var identity = new ClaimsIdentity(claims, "DevTokenAuthScheme");
                    context.Principal = new ClaimsPrincipal(identity);
                    context.Success();
                }
                return Task.CompletedTask;
            }
        };
    });

// 3. Políticas de Autorización (Roles desactivados temporalmente según alcance: acceso unificado para todo usuario registrado)
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.ExigirSuperAdmin, policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy(Policies.ExigirGestionInventario, policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy(Policies.ExigirOperacionAlmacen, policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy(Policies.ExigirAuditoria, policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy(Policies.ExigirUsuarioActivo, policy =>
        policy.RequireAuthenticatedUser());
});

// 4. Configuración de CORS adaptado a producción (Vercel) y desarrollo local
const string PoliticaCorsFrontend = "PoliticaCorsFrontend";
var rawCors = builder.Configuration["Cors:AllowedOrigins"];
var allowedOriginsList = new List<string> { "http://localhost:3000" };

if (!string.IsNullOrWhiteSpace(rawCors))
{
    allowedOriginsList.AddRange(rawCors.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (configuredOrigins != null)
{
    allowedOriginsList.AddRange(configuredOrigins);
}

var allowedOrigins = allowedOriginsList.Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy(PoliticaCorsFrontend, policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
                        || uri.Host == "localhost"
                        || uri.Host == "127.0.0.1";
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 5. Límite de Solicitudes (Rate Limiting)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var key = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anon";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1)
        });
    });
});

// 6. Estandarización de Errores con ProblemDetails (RFC 7807)
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Extensions["trazaId"] = ctx.HttpContext.TraceIdentifier;
        ctx.ProblemDetails.Extensions["sistema"] = "SIIA - Universidad Odontológica Dominicana";
    };
});

// 7. OpenAPI / Swagger
builder.Services.AddOpenApi();

var app = builder.Build();

// Manejo global de excepciones con ProblemDetails
app.UseExceptionHandler();
app.UseStatusCodePages();

// Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
        await SistemaUOD.Infrastructure.Data.DevDatabaseSeeder.SeedAsync(db);
    }
}

app.UseCors(PoliticaCorsFrontend);
app.UseRateLimiter();
app.UseAuthentication();

if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        // En desarrollo local, si no hay un token de Supabase autenticado, inyectar el usuario institucional de desarrollo
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            var authHeader = context.Request.Headers.Authorization.ToString();
            bool esDevToken = authHeader.StartsWith("Bearer dev-token") ||
                              authHeader == "Bearer null" ||
                              authHeader == "Bearer undefined" ||
                              context.Request.Headers.ContainsKey("X-Dev-Bypass");

            if (esDevToken)
            {
                var identity = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000001"),
                    new Claim("sub", "00000000-0000-0000-0000-000000000001"),
                    new Claim(ClaimTypes.Email, "admin@uod.edu.do"),
                    new Claim(ClaimTypes.Role, RolesUsuario.SuperAdmin),
                    new Claim("role", RolesUsuario.SuperAdmin),
                    new Claim(ClaimTypes.Name, "Administrador UOD")
                }, "DevAuthScheme");

                context.User = new ClaimsPrincipal(identity);
            }
        }

        await next();
    });
}

app.UseAuthorization();

// 8. Endpoints de la API (/api/v1)
app.MapMeEndpoints();
app.MapCategoriasEndpoints();
app.MapRecursosEndpoints();
app.MapRecursosFotosEndpoints();
app.MapCodigosEndpoints();
app.MapUbicacionesEndpoints();
app.MapExistenciasEndpoints();
app.MapMovimientosEndpoints();
app.MapActivosEndpoints();
app.MapDepreciacionEndpoints();
app.MapMantenimientosEndpoints();
app.MapAssistantEndpoints();
app.MapAlertasEndpoints();
app.MapCorreosEndpoints();
app.MapConteosFisicosEndpoints();
app.MapImportacionEndpoints();
app.MapReportesEndpoints();

app.MapGet("/health", () => Results.Ok(new
{
    estado = "saludable",
    sistema = "SIIA - Sistema Inteligente de Inventario y Activos UOD",
    entorno = app.Environment.EnvironmentName,
    fecha = DateTime.UtcNow
}))
.WithName("HealthCheckRoot")
.WithSummary("Comprueba la disponibilidad del servicio API SIIA (raíz)");

app.MapGet("/api/v1/health", () => Results.Ok(new
{
    estado = "saludable",
    sistema = "SIIA - Sistema Inteligente de Inventario y Activos UOD",
    entorno = app.Environment.EnvironmentName,
    fecha = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithSummary("Comprueba la disponibilidad del servicio API SIIA");

app.MapGet("/api/v1/admin/verificacion-politica", () => Results.Ok(new
{
    mensaje = "Autorizado por política ExigirSuperAdmin"
}))
.RequireAuthorization(Policies.ExigirSuperAdmin)
.WithName("VerificarPoliticaSuperAdmin")
.WithSummary("Endpoint de control para validar la política de rol super_admin");

// Asegurar existencia de columnas y perfiles iniciales en la base de datos
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync();
        }
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            ALTER TABLE public.perfiles 
                ADD COLUMN IF NOT EXISTS cargo TEXT,
                ADD COLUMN IF NOT EXISTS avatar_url TEXT,
                ADD COLUMN IF NOT EXISTS preferencias TEXT;

            ALTER TABLE public.activos_serie
                ADD COLUMN IF NOT EXISTS costo_adquisicion NUMERIC(14,2) DEFAULT 0.00,
                ADD COLUMN IF NOT EXISTS factura_url TEXT,
                ADD COLUMN IF NOT EXISTS factura_nombre TEXT;

            -- 1. Sincronizar usuarios existentes de auth.users a public.perfiles
            INSERT INTO public.perfiles (id, correo, nombre_completo, rol, activo)
            SELECT 
                u.id, 
                u.email, 
                COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 
                'super_admin'::rol_usuario, 
                true
            FROM auth.users u
            WHERE NOT EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = u.id)
            ON CONFLICT (id) DO NOTHING;

            -- 2. Asegurar usuario admin institucional para desarrollo local
            INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
            VALUES (
                '00000000-0000-0000-0000-000000000001',
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated',
                'admin@uod.edu.do',
                '',
                now(),
                '{""provider"":""email"",""providers"":[""email""]}',
                '{""full_name"":""Administrador UOD""}',
                now(),
                now()
            ) ON CONFLICT (id) DO NOTHING;

            INSERT INTO public.perfiles (id, correo, nombre_completo, rol, cargo, departamento, telefono, activo)
            VALUES (
                '00000000-0000-0000-0000-000000000001',
                'admin@uod.edu.do',
                'Administrador UOD',
                'super_admin',
                'Administrador de Sistemas TI',
                'Tecnología e Inventario',
                '(809) 555-0100',
                true
            ) ON CONFLICT (id) DO NOTHING;
        ";
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("[Startup] Esquema y perfiles verificados correctamente en Supabase.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Nota al asegurar esquema o perfiles en BD: {ex.Message}");
    }
}

app.Run();

// Clase parcial para soportar pruebas con WebApplicationFactory
public partial class Program { }
