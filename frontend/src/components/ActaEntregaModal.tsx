'use client';

import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  Calendar,
  Tag,
  Cpu,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { ActaEntregaRecepcionDto } from '@/lib/apiClient';

interface ActaEntregaModalProps {
  acta: ActaEntregaRecepcionDto | null;
  onClose: () => void;
}

export const ActaEntregaModal: React.FC<ActaEntregaModalProps> = ({ acta, onClose }) => {
  if (!acta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:m-0 print:p-0 print:h-auto print:max-h-none">
        
        {/* Barra superior de acciones (oculta en impresión) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1C3177] flex items-center justify-center text-white shadow-inner">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Acta Oficial de Entrega / Recepción</h2>
              <p className="text-xs text-slate-400 font-mono">{acta.numeroActa}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#3DAA5C] hover:bg-[#2D8246] text-white text-xs font-semibold shadow transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible del Acta Oficial */}
        <div className="p-8 overflow-y-auto print:overflow-visible print:p-12 text-slate-800 font-sans leading-relaxed">
          
          {/* Membrete Institucional UOD */}
          <div className="flex items-center justify-between border-b-2 border-[#1C3177] pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#1C3177] text-white flex flex-col items-center justify-center font-black shadow-md border-2 border-emerald-400/30">
                <span className="text-xl tracking-tighter">UOD</span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">SIIA</span>
              </div>
              <div>
                <h1 className="text-lg font-black text-[#1C3177] tracking-tight uppercase">
                  {acta.institucion}
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {acta.departamentoEmisor}
                </p>
                <p className="text-[11px] text-slate-400">
                  Sistema Inteligente de Inventario y Activos Fijos (SIIA)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-blue-50 text-[#1C3177] border border-blue-200 rounded-lg text-xs font-black tracking-wider uppercase font-mono">
                {acta.numeroActa}
              </span>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-end gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(acta.fechaEmision).toLocaleDateString('es-DO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Título de la operación */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-[#1C3177] uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#3DAA5C]" />
              Acta de Asignación y Traslado de Activo Institucional
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Por medio del presente documento se hace constar formalmente el traslado físico y la asignación bajo custodia del equipo tecnológico detallado a continuación, en estricto cumplimiento con las normativas de control patrimonial de la institución y la Ley 172-13.
            </p>
          </div>

          {/* Ficha Técnica del Activo */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <div className="bg-[#1C3177]/5 px-4 py-2 border-b border-slate-200 font-bold text-xs text-[#1C3177] uppercase flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#1C3177]" />
              Identificación del Bien Institucional
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Placa Institucional:</span>
                <span className="font-mono font-black text-sm text-[#1C3177]">{acta.placaInstitucional}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Número de Serie:</span>
                <span className="font-mono font-bold text-slate-800">{acta.numeroSerie}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">SKU Institucional:</span>
                <span className="font-mono text-slate-700">{acta.recursoSku}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Categoría:</span>
                <span className="font-semibold text-slate-700">{acta.categoriaNombre}</span>
              </div>
              <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">Descripción / Modelo:</span>
                <span className="font-bold text-slate-800 text-sm">{acta.recursoNombre}</span>
              </div>
            </div>
          </div>

          {/* Trazabilidad: Ubicación y Custodio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            {/* Ubicación */}
            <div className="border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Ubicación Física
              </span>
              {acta.ubicacionAnterior ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 line-through">{acta.ubicacionAnterior}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-bold text-[#1C3177]">{acta.ubicacionNueva}</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-[#1C3177]">{acta.ubicacionNueva}</p>
              )}
            </div>

            {/* Custodio */}
            <div className="border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-2">
                <User className="h-4 w-4 text-emerald-600" />
                Custodio / Responsable Asignado
              </span>
              <p className="text-xs font-bold text-slate-800">{acta.custodioNuevo}</p>
              {acta.custodioNuevoCorreo && (
                <p className="text-[11px] text-slate-500 font-mono">{acta.custodioNuevoCorreo}</p>
              )}
              {acta.custodioNuevoDepartamento && (
                <p className="text-[11px] text-slate-500 font-medium">{acta.custodioNuevoDepartamento}</p>
              )}
            </div>

          </div>

          {/* Motivo y Observaciones */}
          <div className="border border-slate-200 rounded-xl p-4 mb-6 text-xs">
            <span className="font-bold text-slate-700 uppercase block mb-1">Motivo Institucional:</span>
            <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
              {acta.motivo}
            </p>
            {acta.observaciones && (
              <p className="text-slate-500 mt-2 italic text-[11px]">
                Nota adicional: {acta.observaciones}
              </p>
            )}
          </div>

          {/* Cláusulas Oficiales de Responsabilidad */}
          <div className="border border-slate-200 rounded-xl p-4 mb-8 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
              Cláusulas de Custodia Patrimonial y Responsabilidad
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              {acta.clausulasResponsabilidad.map((clausula, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{clausula}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recuadros Oficiales para Firmas */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 mt-8">
            <div className="text-center">
              <div className="border-b-2 border-slate-400 h-16 mb-2"></div>
              <p className="text-xs font-bold text-slate-800 uppercase">{acta.firmaEmisorNombre}</p>
              <p className="text-[11px] text-slate-500">{acta.firmaEmisorCargo}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Emisor / TI UOD</p>
            </div>

            <div className="text-center">
              <div className="border-b-2 border-slate-400 h-16 mb-2"></div>
              <p className="text-xs font-bold text-slate-800 uppercase">{acta.firmaReceptorNombre}</p>
              <p className="text-[11px] text-slate-500">{acta.firmaReceptorCargo}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">Custodio Receptor</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
