using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class EmailQueueBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailQueueBackgroundService> _logger;

    public EmailQueueBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailQueueBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio en segundo plano de cola de correos (EmailQueueBackgroundService) iniciado.");

        // Pequeño retardo inicial al arrancar el backend
        await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarLotePendientesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado en ciclo de procesamiento de cola de correos: {Mensaje}", ex.Message);
            }

            try
            {
                // Esperar 10 segundos antes del siguiente ciclo
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Servicio en segundo plano de cola de correos finalizado.");
    }

    public async Task<int> ProcesarLotePendientesAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

        var pendientes = await context.ColaCorreos
            .Where(c => c.Estado == "pendiente" && c.Intentos < 3)
            .OrderBy(c => c.CreadoEn)
            .Take(10)
            .ToListAsync(ct);

        if (pendientes.Count == 0) return 0;

        _logger.LogInformation("Procesando lote de {Count} correos pendientes en la cola...", pendientes.Count);

        var procesados = 0;
        foreach (var correo in pendientes)
        {
            correo.Intentos++;

            try
            {
                var enviado = await emailSender.EnviarCorreoAsync(
                    correo.Destinatario,
                    correo.Asunto,
                    correo.CuerpoHtml,
                    ct
                );

                if (enviado)
                {
                    correo.Estado = "enviado";
                    correo.ProcesadoEn = DateTime.UtcNow;
                    correo.UltimoError = null;
                    procesados++;
                }
                else
                {
                    correo.UltimoError = "El proveedor de correo no confirmó el envío.";
                    if (correo.Intentos >= 3)
                    {
                        correo.Estado = "fallido";
                        correo.ProcesadoEn = DateTime.UtcNow;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo al enviar correo id {Id} (intento {Intento}): {Mensaje}", correo.Id, correo.Intentos, ex.Message);
                correo.UltimoError = ex.Message;
                if (correo.Intentos >= 3)
                {
                    correo.Estado = "fallido";
                    correo.ProcesadoEn = DateTime.UtcNow;
                }
            }
        }

        await context.SaveChangesAsync(ct);
        return procesados;
    }
}
