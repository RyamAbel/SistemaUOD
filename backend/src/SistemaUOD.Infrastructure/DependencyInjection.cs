using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Infrastructure.Data;
using SistemaUOD.Infrastructure.Services;

namespace SistemaUOD.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SupabaseDatabase")
            ?? configuration["ConnectionStrings:SupabaseDatabase"];

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (!string.IsNullOrEmpty(connectionString) && !connectionString.Contains("[TU_PASSWORD_DE_SUPABASE]"))
            {
                options.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history", "public");
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorCodesToAdd: null);
                });
            }
            else
            {
                // Fallback con base de datos en memoria para desarrollo local sin credenciales de PostgreSQL
                options.UseInMemoryDatabase("SistemaUOD_DevDb");
            }
        });

        services.AddMemoryCache();
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<ICategoriaService, CategoriaService>();
        services.AddScoped<IProveedorService, ProveedorService>();
        services.AddScoped<IRecursoService, RecursoService>();

        services.AddHttpClient<IStorageService, SupabaseStorageService>();
        services.AddScoped<IRecursoFotoService, RecursoFotoService>();
        services.AddScoped<ICodigoService, CodigoService>();
        services.AddScoped<IUbicacionService, UbicacionService>();
        services.AddScoped<IExistenciaService, ExistenciaService>();
        services.AddScoped<IMovimientoService, MovimientoService>();
        services.AddScoped<IActivoService, ActivoService>();
        services.AddScoped<IDepreciacionService, DepreciacionService>();
        services.AddScoped<IMantenimientoService, MantenimientoService>();
        services.AddHttpClient<IAssistantService, AssistantService>();

        return services;
    }
}
