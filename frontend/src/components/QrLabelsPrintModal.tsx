'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, Check, LayoutGrid, FileText } from 'lucide-react';
import { RecursoDto, apiClient } from '@/lib/apiClient';

interface QrLabelsPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoDto[];
}

export const QrLabelsPrintModal: React.FC<QrLabelsPrintModalProps> = ({
  isOpen,
  onClose,
  recursos
}) => {
  const [tamanoEtiqueta, setTamanoEtiqueta] = React.useState<'estandar' | 'compacta' | 'grande'>('estandar');
  const [incluirFoto, setIncluirFoto] = React.useState(false);
  const [copiasPorItem, setCopiasPorItem] = React.useState(1);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || recursos.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Expandir copias
  const etiquetasAImprimir = recursos.flatMap(r => Array(copiasPorItem).fill(r));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
        {/* Header (No se imprime) */}
        <div className="p-5 border-b border-slate-200 bg-[#1C3177] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Printer className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Generador de Etiquetas QR Institucionales</h3>
              <p className="text-xs text-blue-100">
                {recursos.length} recurso{recursos.length > 1 ? 's' : ''} seleccionado{recursos.length > 1 ? 's' : ''} • {etiquetasAImprimir.length} etiqueta{etiquetasAImprimir.length > 1 ? 's' : ''} en total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar de configuración (No se imprime) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tamaño */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-600">Formato:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setTamanoEtiqueta('compacta')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    tamanoEtiqueta === 'compacta' ? 'bg-[#1C3177] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compacta (45x25mm)
                </button>
                <button
                  type="button"
                  onClick={() => setTamanoEtiqueta('estandar')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    tamanoEtiqueta === 'estandar' ? 'bg-[#1C3177] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Estándar (60x35mm)
                </button>
                <button
                  type="button"
                  onClick={() => setTamanoEtiqueta('grande')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    tamanoEtiqueta === 'grande' ? 'bg-[#1C3177] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grande (80x50mm)
                </button>
              </div>
            </div>

            {/* Copias por recurso */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-600">Copias c/u:</span>
              <select
                value={copiasPorItem}
                onChange={e => setCopiasPorItem(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:border-[#1C3177]"
              >
                <option value={1}>1 copia</option>
                <option value={2}>2 copias</option>
                <option value={3}>3 copias</option>
                <option value={5}>5 copias</option>
                <option value={10}>10 copias</option>
              </select>
            </div>

            {/* Incluir foto */}
            <label className="flex items-center space-x-2 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={incluirFoto}
                onChange={e => setIncluirFoto(e.target.checked)}
                className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
              />
              <span>Incluir foto</span>
            </label>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#3DAA5C] hover:bg-[#2D8246] text-white font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>

        {/* Vista previa / Contenido imprimible */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-6 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div
            className={`grid gap-3 mx-auto ${
              tamanoEtiqueta === 'compacta'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3'
                : tamanoEtiqueta === 'grande'
                ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2'
            }`}
          >
            {etiquetasAImprimir.map((r, idx) => (
              <div
                key={`${r.id}-${idx}`}
                className={`bg-white rounded-xl border border-slate-300/80 p-3 shadow-xs flex flex-col justify-between print:rounded-none print:border-black print:shadow-none print:break-inside-avoid print:p-2 ${
                  tamanoEtiqueta === 'compacta' ? 'min-h-[110px]' : tamanoEtiqueta === 'grande' ? 'min-h-[170px]' : 'min-h-[140px]'
                }`}
              >
                {/* Cabecera de la etiqueta */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5 print:border-black">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-[10px] tracking-wider text-[#1C3177] print:text-black">
                      UOD • SIIA
                    </span>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-slate-500 uppercase print:text-black">
                    {r.tipo === 'activo_fijo' ? 'Activo Fijo' : 'Consumible'}
                  </span>
                </div>

                {/* Contenido principal: QR + Datos */}
                <div className="flex items-center gap-2 flex-1">
                  {/* QR Image */}
                  <div className="flex-shrink-0 bg-white p-1 rounded border border-slate-200 print:border-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apiClient.obtenerUrlDescargaQr(r.id)}
                      alt={`QR ${r.sku}`}
                      className={`object-contain ${
                        tamanoEtiqueta === 'compacta' ? 'w-14 h-14' : tamanoEtiqueta === 'grande' ? 'w-24 h-24' : 'w-18 h-18'
                      }`}
                    />
                  </div>

                  {/* Foto opcional */}
                  {incluirFoto && r.fotoPrincipalUrl && (
                    <div className="hidden sm:block flex-shrink-0 w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 print:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.fotoPrincipalUrl} alt={r.nombre} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Textos */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="font-mono text-[11px] font-black text-[#1C3177] truncate print:text-black block">
                      {r.sku}
                    </span>
                    <h4 className="text-[10px] font-bold text-slate-900 line-clamp-2 leading-tight mt-0.5 print:text-black">
                      {r.nombre}
                    </h4>
                    <span className="text-[8px] text-slate-500 truncate block mt-0.5 print:text-black">
                      {r.categoriaNombre}
                    </span>
                  </div>
                </div>

                {/* Pie de la etiqueta con micro-código y fecha */}
                <div className="border-t border-slate-100 pt-1 mt-1 flex items-center justify-between text-[8px] text-slate-400 print:border-black print:text-black">
                  <span>siia.uod.edu.do</span>
                  <span className="font-mono">{new Date().toISOString().slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (No se imprime) */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Tip: Al pulsar imprimir, selecciona tu impresora térmica de etiquetas o «Guardar como PDF» en formato horizontal/vertical.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
