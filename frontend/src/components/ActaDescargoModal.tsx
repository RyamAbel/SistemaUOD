'use client';

import React from 'react';
import {
  X,
  Printer,
  FileCheck2,
  Building2,
  ShieldAlert,
  User,
  Calendar,
  DollarSign,
  AlertOctagon,
  Trash2
} from 'lucide-react';
import { ActaDescargoPatrimonialDto } from '@/lib/apiClient';

interface ActaDescargoModalProps {
  acta: ActaDescargoPatrimonialDto | null;
  onClose: () => void;
  onDeleteAsset?: (activoId: string) => void;
}

export const ActaDescargoModal: React.FC<ActaDescargoModalProps> = ({
  acta,
  onClose,
  onDeleteAsset
}) => {
  if (!acta) return null;

  const handleImprimir = () => {
    window.print();
  };

  const formatearDOP = (monto: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(monto);
  };

  const getDestinoTexto = (destino: string) => {
    switch (destino) {
      case 'descarte_ecologico':
        return 'Descarte Ecológico y Gestión de RAEE';
      case 'donacion':
        return 'Donación Institucional Autorizada';
      case 'reciclaje':
        return 'Reciclaje de Materiales';
      case 'repuestos':
        return 'Canibalización para Repuestos Operativos';
      default:
        return destino;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="acta-descargo-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Cabecera de control (oculta al imprimir) */}
        <div className="bg-rose-900 px-6 py-4 text-white flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-300 border border-white/20">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="acta-descargo-title" className="text-lg font-bold text-white tracking-wide">
                  Acta Oficial de Descargo Patrimonial
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  Baja Definitiva
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Documento legal institucional • {acta.numeroActa}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors border border-white/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            {onDeleteAsset && (
              <button
                type="button"
                onClick={() => onDeleteAsset(acta.activoId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-100 bg-rose-800/80 hover:bg-rose-700 hover:text-white rounded-lg transition-colors border border-rose-500/40 cursor-pointer shadow-xs"
                title="Eliminar este activo definitivamente del sistema"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Definitivamente
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Documento Imprimible Oficial (Membrete UOD) */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-6 text-slate-800 bg-white print:p-6 print:overflow-visible font-sans">
          {/* Membrete Institucional UOD */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-[#1C3177] text-white flex items-center justify-center font-bold text-xl border-2 border-[#3DAA5C]">
                UOD
              </div>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C3177] tracking-wider uppercase">
              Universidad Odontológica Dominicana (UOD)
            </h1>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
              Comisión de Gestión Patrimonial, Inventario y Auditoría Interna
            </p>
            <p className="text-[11px] text-slate-500">
              Santo Domingo, República Dominicana • Sistema Inteligente de Inventario y Activos (SIIA)
            </p>
          </div>

          {/* Título y Código Oficial del Acta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block">
                Acta de Descargo y Desincorporación
              </span>
              <h2 className="text-base font-extrabold text-slate-900 font-mono">
                {acta.numeroActa}
              </h2>
            </div>
            <div className="sm:text-right text-xs">
              <span className="text-slate-400 block font-medium">Fecha de Emisión:</span>
              <span className="font-bold text-slate-800 font-mono">
                {new Date(acta.fechaBaja).toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Preámbulo Legal */}
          <p className="text-xs leading-relaxed text-slate-700 text-justify">
            Por medio de la presente, la <strong>Comisión de Gestión Patrimonial e Inventario TI</strong> de la{' '}
            <strong>Universidad Odontológica Dominicana (UOD)</strong>, en cumplimiento con las normas internas
            de administración de bienes patrimoniales y la Ley 172-13, hace constar formalmente el descargo,
            desincorporación y baja definitiva del inventario activo institucional del bien tecnológico que se detalla a continuación:
          </p>

          {/* Ficha Técnica y Contable del Bien Descargado */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-xs text-slate-800 border-b border-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
              Especificaciones del Bien Descargado
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Placa Institucional</span>
                <span className="font-mono font-bold text-rose-900 text-sm bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                  {acta.placaInstitucional}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Número de Serie</span>
                <span className="font-mono font-bold text-slate-800 mt-1 block">
                  {acta.numeroSerie || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Código SKU</span>
                <span className="font-mono font-medium text-slate-700 mt-1 block">
                  {acta.recursoSku || 'N/A'}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Descripción del Equipo</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {acta.recursoNombre}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Categoría</span>
                <span className="font-medium text-slate-700 mt-0.5 block">
                  {acta.categoriaNombre}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Última Ubicación Física</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {acta.ultimaUbicacion}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Custodio Liberado</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {acta.ultimoCustodio || 'Sin custodio'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Destino del Bien</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {getDestinoTexto(acta.destinoFinalBien)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Costo Histórico (DOP)</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                  {formatearDOP(acta.valorHistoricoDop)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Valor en Libros Neto (DOP)</span>
                <span className="font-mono font-bold text-emerald-800 mt-0.5 block">
                  {formatearDOP(acta.valorEnLibrosDop)}
                </span>
              </div>
            </div>
          </div>

          {/* Motivo de la Baja y Dictamen Técnico */}
          <div className="space-y-3">
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-1">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Motivo Justificado de la Baja:
              </span>
              <p className="text-xs text-rose-950 font-medium">
                {acta.motivoBaja}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Dictamen Técnico de TI:
              </span>
              <p className="text-xs text-slate-800 leading-relaxed italic">
                "{acta.dictamenTecnico}"
              </p>
            </div>
          </div>

          {/* Cláusulas Oficiales de Descargo */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cláusulas de Descargo y Responsabilidad Patrimonial:
            </h3>
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700 leading-relaxed">
              {acta.clausulasDescargo.map((clausula, idx) => (
                <p key={idx} className="text-justify">
                  {clausula}
                </p>
              ))}
            </div>
          </div>

          {/* Firmas Oficiales de las 3 Partes */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            {/* Responsable de TI */}
            <div className="space-y-2 flex flex-col justify-end">
              <div className="border-t border-slate-900 pt-2 w-4/5 mx-auto font-bold text-slate-900">
                {acta.firmaResponsableTi}
              </div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                Comisión de Tecnología (TI)
              </span>
            </div>

            {/* Auditoría Interna */}
            <div className="space-y-2 flex flex-col justify-end">
              <div className="border-t border-slate-900 pt-2 w-4/5 mx-auto font-bold text-slate-900">
                {acta.firmaAuditoriaInterna}
              </div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                Auditoría Interna
              </span>
            </div>

            {/* Rectoría / Administración */}
            <div className="space-y-2 flex flex-col justify-end">
              <div className="border-t border-slate-900 pt-2 w-4/5 mx-auto font-bold text-slate-900">
                {acta.firmaRectoriaAdministracion}
              </div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                Dirección Administrativa
              </span>
            </div>
          </div>

          {/* Pie de página institucional */}
          <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-200">
            Documento emitido electrónicamente con validez legal interna • Universidad Odontológica Dominicana (UOD) • SIIA 2026
          </div>
        </div>
      </div>
    </div>
  );
};
