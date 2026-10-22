using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private const string BaseHtmlHeader = @"
<!DOCTYPE html>
<html lang=""es"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>SIIA - Notificación Institucional UOD</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F9FC; color: #1E293B; margin: 0; padding: 24px; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #1C3177; padding: 24px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
        .badge-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
        .badge-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
        .badge-info { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
        .content { padding: 32px 28px; }
        .content h2 { margin-top: 0; font-size: 18px; color: #0F172A; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .details-table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
        .details-table td.label { font-weight: 600; color: #64748B; width: 38%; }
        .details-table td.val { color: #0F172A; font-weight: 700; }
        .btn { display: inline-block; background: #1C3177; color: #FFFFFF !important; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 20px; text-align: center; }
        .btn:hover { background: #2B4BA0; }
        .footer { background: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
        .footer p { margin: 4px 0; }
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>UNIVERSIDAD ODONTOLÓGICA DOMINICANA</h1>
            <p>SIIA · Sistema Inteligente de Inventario y Activos</p>
        </div>
        <div class=""content"">
";

    private const string BaseHtmlFooter = @"
            <div style=""text-align: center; margin-top: 28px;"">
                <a href=""https://siia.uod.edu.do"" class=""btn"" target=""_blank"">Acceder al Sistema SIIA</a>
            </div>
        </div>
        <div class=""footer"">
            <p><strong>Universidad Odontológica Dominicana (UOD)</strong></p>
            <p>Santo Domingo, República Dominicana · Notificación Automática Oficial</p>
            <p style=""font-size: 10px; margin-top: 8px;"">Este correo fue generado automáticamente en cumplimiento con las políticas institucionales de control de inventario (Ley 172-13).</p>
        </div>
    </div>
</body>
</html>
";

    public string GenerarAlertaStockBajoHtml(string recursoNombre, string sku, int stockActual, int stockMinimo, int? puntoReorden)
    {
        var badgeClass = stockActual <= 0 ? "badge-danger" : "badge-warning";
        var estadoTexto = stockActual <= 0 ? "EXISTENCIA AGOTADA" : "STOCK BAJO MÍNIMO (RF-12)";

        return $@"{BaseHtmlHeader}
            <span class=""badge {badgeClass}"">{estadoTexto}</span>
            <h2>Alerta de Reabastecimiento de Inventario</h2>
            <p>Se ha detectado una condición crítica de existencias para el siguiente recurso en las bodegas y clínicas institucionales:</p>
            
            <table class=""details-table"">
                <tr>
                    <td class=""label"">Recurso / Insumo:</td>
                    <td class=""val"">{recursoNombre}</td>
                </tr>
                <tr>
                    <td class=""label"">Código SKU:</td>
                    <td class=""val"" style=""font-family: monospace;"">{sku}</td>
                </tr>
                <tr>
                    <td class=""label"">Stock Actual:</td>
                    <td class=""val"" style=""color: {(stockActual <= 0 ? "#DC2626" : "#D97706")};"">{stockActual} unidades</td>
                </tr>
                <tr>
                    <td class=""label"">Stock Mínimo Sugerido:</td>
                    <td class=""val"">{stockMinimo} unidades</td>
                </tr>
                {(puntoReorden.HasValue ? $@"<tr><td class=""label"">Punto de Reorden:</td><td class=""val"">{puntoReorden.Value} unidades</td></tr>" : "")}
            </table>
            
            <p style=""font-size: 13px; color: #475569;"">
                Por favor, tramite la solicitud de reposición correspondiente para prevenir retrasos en las clínicas odontológicas y dependencias académicas.
            </p>
{BaseHtmlFooter}";
    }

    public string GenerarAlertaVencimientoLoteHtml(string recursoNombre, string numeroLote, string fechaVencimiento, int diasRestantes)
    {
        var esVencido = diasRestantes <= 0;
        var badgeClass = esVencido ? "badge-danger" : "badge-warning";
        var estadoTexto = esVencido ? "LOTE CLÍNICO VENCIDO" : $"PRÓXIMO A VENCER EN {diasRestantes} DÍAS";

        return $@"{BaseHtmlHeader}
            <span class=""badge {badgeClass}"">{estadoTexto}</span>
            <h2>Alerta de Control de Caducidad de Lote Clínico</h2>
            <p>El sistema de trazabilidad clínica ha emitido una advertencia preventiva sobre la fecha de vencimiento del siguiente insumo:</p>
            
            <table class=""details-table"">
                <tr>
                    <td class=""label"">Insumo Odontológico:</td>
                    <td class=""val"">{recursoNombre}</td>
                </tr>
                <tr>
                    <td class=""label"">Número de Lote:</td>
                    <td class=""val"" style=""font-family: monospace;"">{numeroLote}</td>
                </tr>
                <tr>
                    <td class=""label"">Fecha de Vencimiento:</td>
                    <td class=""val"" style=""color: {(esVencido ? "#DC2626" : "#D97706")};"">{fechaVencimiento}</td>
                </tr>
                <tr>
                    <td class=""label"">Estado Operativo:</td>
                    <td class=""val"">{(esVencido ? "Retirar de circulación inmediatamente" : $"Vence en {diasRestantes} días calendario")}</td>
                </tr>
            </table>
            
            <p style=""font-size: 13px; color: #475569;"">
                De acuerdo con las normativas sanitarias y estándares de las clínicas odontológicas UOD, los lotes vencidos deben ser aislados y descargados formalmente.
            </p>
{BaseHtmlFooter}";
    }

    public string GenerarAlertaMantenimientoHtml(string placa, string modelo, string fechaProgramada, string tipo, int diasRestantes)
    {
        var esVencido = diasRestantes < 0;
        var badgeClass = esVencido ? "badge-danger" : "badge-warning";
        var estadoTexto = esVencido ? "SERVICIO TÉCNICO VENCIDO" : $"MANTENIMIENTO PROGRAMADO ({diasRestantes} DÍAS)";

        return $@"{BaseHtmlHeader}
            <span class=""badge {badgeClass}"">{estadoTexto}</span>
            <h2>Aviso de Mantenimiento y Calibración de Equipo TI / Odontológico</h2>
            <p>Se requiere atención técnica preventiva o correctiva para el siguiente activo patrimonial de la institución:</p>
            
            <table class=""details-table"">
                <tr>
                    <td class=""label"">Placa Institucional:</td>
                    <td class=""val"" style=""font-family: monospace; color: #1C3177;"">{placa}</td>
                </tr>
                <tr>
                    <td class=""label"">Equipo / Modelo:</td>
                    <td class=""val"">{modelo}</td>
                </tr>
                <tr>
                    <td class=""label"">Tipo de Servicio:</td>
                    <td class=""val"" style=""text-transform: capitalize;"">{tipo}</td>
                </tr>
                <tr>
                    <td class=""label"">Fecha Programada:</td>
                    <td class=""val"">{fechaProgramada}</td>
                </tr>
            </table>
            
            <p style=""font-size: 13px; color: #475569;"">
                Por favor, coordine con el departamento de Tecnología o el proveedor técnico autorizado para la ejecución del servicio y su registro en SIIA.
            </p>
{BaseHtmlFooter}";
    }

    public string GenerarAvisoTrasladoActivoHtml(string placa, string modelo, string origen, string destino, string custodio, string numeroActa)
    {
        return $@"{BaseHtmlHeader}
            <span class=""badge badge-info"">MOVIMIENTO PATRIMONIAL REGISTRADO</span>
            <h2>Acta Oficial de Traslado y Asignación de Activo Fijo</h2>
            <p>Se ha registrado un movimiento físico de reubicación patrimonial para el bien especificado a continuación:</p>
            
            <table class=""details-table"">
                <tr>
                    <td class=""label"">No. de Acta Oficial:</td>
                    <td class=""val"" style=""font-family: monospace; color: #1C3177;"">{numeroActa}</td>
                </tr>
                <tr>
                    <td class=""label"">Placa Institucional:</td>
                    <td class=""val"" style=""font-family: monospace;"">{placa}</td>
                </tr>
                <tr>
                    <td class=""label"">Equipo:</td>
                    <td class=""val"">{modelo}</td>
                </tr>
                <tr>
                    <td class=""label"">Ubicación Origen:</td>
                    <td class=""val"">{origen}</td>
                </tr>
                <tr>
                    <td class=""label"">Ubicación Destino:</td>
                    <td class=""val"" style=""color: #3DAA5C;"">{destino}</td>
                </tr>
                <tr>
                    <td class=""label"">Custodio Asignado:</td>
                    <td class=""val"">{custodio}</td>
                </tr>
            </table>
            
            <p style=""font-size: 13px; color: #475569;"">
                Este movimiento ha quedado asentado de forma inmutable en la bitácora de auditoría de activos institucionales de la UOD.
            </p>
{BaseHtmlFooter}";
    }
}
