using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class ScheduledInventoryAlertService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ScheduledInventoryAlertService> _logger;

    public ScheduledInventoryAlertService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<ScheduledInventoryAlertService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio programado de evaluación de inventario y alertas (ScheduledInventoryAlertService) iniciado.");

        // Esperar 15 segundos al inicio para permitir inicialización completa de la base de datos
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        var intervalHours = int.TryParse(_configuration["Alerts:EvaluationIntervalHours"], out var h) ? h : 24;
        if (intervalHours <= 0) intervalHours = 24;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EjecutarEvaluacionAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo durante la evaluación programada del motor de alertas: {Mensaje}", ex.Message);
            }

            try
            {
                _logger.LogInformation("Próxima evaluación programada de inventario en {Horas} horas.", intervalHours);
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Servicio programado de evaluación de inventario y alertas finalizado.");
    }

    public async Task EjecutarEvaluacionAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var alertaService = scope.ServiceProvider.GetRequiredService<IAlertaService>();

        _logger.LogInformation("Iniciando evaluación periódica automática de reglas de inventario (Stock, Lotes Clínicos, Mantenimientos)...");
        var resultado = await alertaService.EvaluarReglasAsync(ct);

        _logger.LogInformation(
            "Evaluación de inventario finalizada: {Generadas} alertas generadas, {Omitidas} omitidas por existir previamente.",
            resultado.AlertasGeneradas,
            resultado.AlertasOmitidasExistentes
        );
    }
}
