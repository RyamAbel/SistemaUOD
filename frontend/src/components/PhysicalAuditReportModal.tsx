'use client';

import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  ShieldCheck,
  Calendar,
  Check,
  XCircle,
  Clock,
  Layers,
  Trash2
} from 'lucide-react';
import { ConteoFisicoDto } from '@/lib/apiClient';
import { ActivoTI } from '@/lib/inventoryData';

export interface ActivoVerificadoAudit {
  activo: ActivoTI;
  estadoVerificado: 'encontrado' | 'no_encontrado' | 'danado';
  observaciones?: string;
  horaVerificacion?: string;
}

interface PhysicalAuditReportModalProps {
  conteo: ConteoFisicoDto;
  activosAuditados: ActivoVerificadoAudit[];
  isOpen: boolean;
  onClose: () => void;
  onConciliar?: () => Promise<void>;
  onEliminar?: () => Promise<void>;
  submitting?: boolean;
}

export const PhysicalAuditReportModal: React.FC<PhysicalAuditReportModalProps> = ({
  conteo,
  activosAuditados,
  isOpen,
  onClose,
  onConciliar,
  onEliminar,
  submitting = false
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalActivos = activosAuditados.length;
  const encontrados = activosAuditados.filter(a => a.estadoVerificado === 'encontrado').length;
  const faltantes = activosAuditados.filter(a => a.estadoVerificado === 'no_encontrado').length;
  const danados = activosAuditados.filter(a => a.estadoVerificado === 'danado').length;
  const porcentaje = totalActivos > 0 ? Math.round((encontrados / totalActivos) * 100) : 0;

  const fechaFormateada = new Date(conteo.fechaInicio).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const horaFormateada = new Date(conteo.fechaInicio).toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const numeroActa = `ACTA-AUD-${conteo.ubicacionCodigo || 'UOD'}-${new Date(conteo.fechaInicio).getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:max-w-none print:h-auto print:max-h-none print:overflow-visible">
        
        {/* Barra superior de control (Oculta al imprimir / PDF) */}
        <div className="px-6 py-4 bg-[#1C3177] text-white flex items-center justify-between border-b border-blue-900 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Acta Oficial de Auditoría e Inventario Físico</h2>
              <p className="text-xs text-blue-200 font-mono">{numeroActa}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
              title="Imprimir o exportar como documento PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Guardar en PDF</span>
            </button>

            {conteo.estado === 'abierto' && onConciliar && (
              <button
                onClick={onConciliar}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#3DAA5C] hover:bg-[#2D8246] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirmar y Conciliar</span>
              </button>
            )}

            {onEliminar && (
              <button
                onClick={onEliminar}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-200 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                title="Eliminar conteo de prueba (sin dejar residuos en base de datos)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido del Documento Imprimible (Formato Institucional UOD) */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-6 text-slate-800 print:p-6 print:overflow-visible text-xs">
          
          {/* Membrete Institucional UOD */}
          <div className="flex items-start justify-between border-b-2 border-[#1C3177] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-widest text-[#1C3177] uppercase">
                  Universidad Odontológica Dominicana (UOD)
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 uppercase">
                Dirección Administrativa y Departamento de Tecnología (TI)
              </p>
              <p className="text-[10px] text-slate-400">
                Sistema Inteligente de Inventario y Almacén (SIIA) • RNC: 401-01234-5
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 font-mono font-black text-xs text-[#1C3177] border border-slate-200">
                {numeroActa}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Fecha de Emisión: <strong>{fechaFormateada}</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                Hora: {horaFormateada}
              </p>
            </div>
          </div>

          {/* Título Principal */}
          <div className="text-center py-2">
            <h1 className="text-base font-black text-[#1C3177] uppercase tracking-wide">
              Acta de Verificación Patrimonial e Inventario Físico In Situ
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Certificación de existencias físicas reales, correspondencia de activos y levantamiento de discrepancias
            </p>
          </div>

          {/* Datos Generales de la Auditoría */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Ubicación Auditada</span>
              <span className="font-bold text-slate-900 text-xs">{conteo.ubicacionNombre}</span>
              <span className="text-[10px] text-slate-500 block font-mono">Código: {conteo.ubicacionCodigo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Auditor Responsable</span>
              <span className="font-bold text-slate-900 text-xs">{conteo.responsableNombre || 'Admin UOD'}</span>
              <span className="text-[10px] text-slate-500 block truncate">{conteo.responsableCorreo || 'ti@uod.edu.do'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado de la Sesión</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                conteo.estado === 'conciliado'
                  ? 'bg-emerald-100 text-[#2D8246]'
                  : conteo.estado === 'abierto'
                  ? 'bg-blue-100 text-[#1C3177]'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {conteo.estado.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Coincidencia Física</span>
              <span className="font-black text-xs text-[#1C3177]">{porcentaje}% Conforme</span>
              <span className="text-[10px] text-slate-500 block">
                {encontrados} de {totalActivos} equipos
              </span>
            </div>
          </div>

          {/* Resumen Ejecutivo de Métricas */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-[#1C3177] uppercase block">Total en Sistema</span>
              <span className="text-base font-black text-[#1C3177]">{totalActivos}</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Encontrados</span>
              <span className="text-base font-black text-emerald-700">{encontrados}</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">No Encontrados</span>
              <span className="text-base font-black text-rose-700">{faltantes}</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-900 uppercase block">Con Avería / Daño</span>
              <span className="text-base font-black text-amber-800">{danados}</span>
            </div>
          </div>

          {/* Tabla de Activos Físicos Auditados */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1. Detalle de Equipos Tecnológicos Verificados
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Placa / ID</th>
                    <th className="py-2 px-3">Descripción / Modelo</th>
                    <th className="py-2 px-3">Número de Serie</th>
                    <th className="py-2 px-3">Custodio Asignado</th>
                    <th className="py-2 px-3 text-center">Estado Verificado</th>
                    <th className="py-2 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activosAuditados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No se registraron activos específicos en esta ubicación.
                      </td>
                    </tr>
                  ) : (
                    activosAuditados.map((item, idx) => (
                      <tr key={item.activo.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-bold text-[#1C3177]">
                          {item.activo.placa_institucional || 'S/P'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.activo.recurso_nombre}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {item.activo.numero_serie || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {item.activo.responsable || 'Por asignar'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.estadoVerificado === 'encontrado' && (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 text-[10px]">
                              <Check className="h-3 w-3 text-emerald-600" /> Presente
                            </span>
                          )}
                          {item.estadoVerificado === 'no_encontrado' && (
                            <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-bold border border-rose-200 text-[10px]">
                              <XCircle className="h-3 w-3 text-rose-600" /> Faltante
                            </span>
                          )}
                          {item.estadoVerificado === 'danado' && (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200 text-[10px]">
                              <AlertTriangle className="h-3 w-3 text-amber-600" /> Dañado
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic">
                          {item.observaciones || 'Sin incidencias'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dictamen / Observaciones de Auditoría */}
          {conteo.observaciones && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Dictamen / Observaciones Generales</span>
              <p className="text-xs text-slate-700 leading-relaxed font-mono">
                {conteo.observaciones}
              </p>
            </div>
          )}

          {/* Bloque de Firmas Oficiales */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-[10px] print:pt-12">
            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                <span className="font-bold text-slate-800">{conteo.responsableNombre || 'Admin UOD'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Auditor Responsable</span>
                <span className="text-slate-500 block">Departamento de Tecnología (TI)</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                <span className="font-bold text-slate-800">Custodio Titular</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Encargado de la Ubicación</span>
                <span className="text-slate-500 block">{conteo.ubicacionNombre}</span>
              </div>
            </div>

            <div className="space-y-8 col-span-2 sm:col-span-1">
              <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                <span className="font-bold text-slate-800 text-[10px] text-slate-400">Sello Oficial UOD</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Dirección Administrativa</span>
                <span className="text-slate-500 block">Universidad Odontológica Dominicana</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
