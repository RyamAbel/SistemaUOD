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
                // Fallback de configuración para entorno de desarrollo o inicialización
                options.UseNpgsql(connectionString ?? "Host=localhost;Database=siia_db");
            }
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<ICategoriaService, CategoriaService>();
        services.AddScoped<IProveedorService, ProveedorService>();
        services.AddScoped<IRecursoService, RecursoService>();

        services.AddHttpClient<IStorageService, SupabaseStorageService>();
        services.AddScoped<IRecursoFotoService, RecursoFotoService>();
        services.AddScoped<ICodigoService, CodigoService>();

        return services;
    }
}
