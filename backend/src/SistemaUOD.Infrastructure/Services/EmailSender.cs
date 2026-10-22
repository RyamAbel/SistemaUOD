using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class EmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> EnviarCorreoAsync(string destinatario, string asunto, string cuerpoHtml, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(destinatario))
        {
            _logger.LogWarning("Intento de envío de correo omitido: destinatario vacío.");
            return false;
        }

        var provider = _configuration["Email:Provider"] ?? "Mock";
        var smtpHost = _configuration["Email:Smtp:Host"];

        // Si está configurado un servidor SMTP institucional real
        if (!string.IsNullOrWhiteSpace(smtpHost) && provider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var port = int.TryParse(_configuration["Email:Smtp:Port"], out var p) ? p : 587;
                var user = _configuration["Email:Smtp:User"];
                var pass = _configuration["Email:Smtp:Password"];
                var fromAddress = _configuration["Email:From"] ?? "notificaciones-siia@uod.edu.do";
                var fromName = _configuration["Email:FromName"] ?? "SIIA - Universidad Odontológica Dominicana";

                using var client = new SmtpClient(smtpHost, port)
                {
                    EnableSsl = bool.TryParse(_configuration["Email:Smtp:EnableSsl"], out var ssl) ? ssl : true,
                    Credentials = (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
                        ? new NetworkCredential(user, pass)
                        : CredentialCache.DefaultNetworkCredentials
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress(fromAddress, fromName),
                    Subject = asunto,
                    Body = cuerpoHtml,
                    IsBodyHtml = true
                };
                mail.To.Add(destinatario);

                await client.SendMailAsync(mail, ct);
                _logger.LogInformation("Correo enviado exitosamente vía SMTP a {Destinatario}. Asunto: {Asunto}", destinatario, asunto);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo al enviar correo vía SMTP a {Destinatario}: {Mensaje}", destinatario, ex.Message);
                throw;
            }
        }

        // Modo Mock institucional / Simulado para desarrollo y pruebas
        _logger.LogInformation(
            "[EMAIL MOCK SIIA UOD] Enviado a: {Destinatario} | Asunto: {Asunto} | Tamaño HTML: {Tamano} bytes",
            destinatario,
            asunto,
            cuerpoHtml.Length
        );

        // Simular latencia de red mínima
        await Task.Delay(10, ct);
        return true;
    }
}
