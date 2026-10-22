namespace SistemaUOD.Application.Common.Interfaces;

public interface IEmailTemplateService
{
    string GenerarAlertaStockBajoHtml(string recursoNombre, string sku, int stockActual, int stockMinimo, int? puntoReorden);
    string GenerarAlertaVencimientoLoteHtml(string recursoNombre, string numeroLote, string fechaVencimiento, int diasRestantes);
    string GenerarAlertaMantenimientoHtml(string placa, string modelo, string fechaProgramada, string tipo, int diasRestantes);
    string GenerarAvisoTrasladoActivoHtml(string placa, string modelo, string origen, string destino, string custodio, string numeroActa);
}
