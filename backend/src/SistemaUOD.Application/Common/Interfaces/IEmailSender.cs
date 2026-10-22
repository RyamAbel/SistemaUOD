namespace SistemaUOD.Application.Common.Interfaces;

public interface IEmailSender
{
    Task<bool> EnviarCorreoAsync(string destinatario, string asunto, string cuerpoHtml, CancellationToken ct = default);
}
