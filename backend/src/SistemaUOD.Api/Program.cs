using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
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
    });

// 3. Políticas de Autorización Basadas en Roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.ExigirSuperAdmin, policy =>
        policy.RequireRole(RolesUsuario.SuperAdmin));

    options.AddPolicy(Policies.ExigirGestionInventario, policy =>
        policy.RequireRole(Policies.RolesGestionInventario));

    options.AddPolicy(Policies.ExigirOperacionAlmacen, policy =>
        policy.RequireRole(Policies.RolesOperacionAlmacen));

    options.AddPolicy(Policies.ExigirAuditoria, policy =>
        policy.RequireRole(Policies.RolesAuditoria));

    options.AddPolicy(Policies.ExigirUsuarioActivo, policy =>
        policy.RequireAuthenticatedUser());
});

// 4. Configuración de CORS limitado al Frontend
const string PoliticaCorsFrontend = "PoliticaCorsFrontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(PoliticaCorsFrontend, policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
}

app.UseCors(PoliticaCorsFrontend);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// 8. Endpoints de la API (/api/v1)
app.MapMeEndpoints();
app.MapCategoriasEndpoints();
app.MapProveedoresEndpoints();
app.MapRecursosEndpoints();
app.MapRecursosFotosEndpoints();
app.MapCodigosEndpoints();

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

app.Run();

// Clase parcial para soportar pruebas con WebApplicationFactory
public partial class Program { }
