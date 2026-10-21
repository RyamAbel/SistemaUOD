'use client';

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  ShieldAlert,
  FileText,
  DollarSign,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  apiClient,
  ActivoSerieDto,
  DarDeBajaActivoDto,
  ResultadoBajaActivoDto
} from '@/lib/apiClient';

interface DecommissionAssetModalProps {
  activo: {
    id: string;
    placa_institucional: string;
    recurso_nombre: string;
    numero_serie: string;
    ubicacion_nombre: string;
    responsable: string;
  } | null;
  onClose: () => void;
  onSuccess: (resultado: ResultadoBajaActivoDto) => void;
}

export const DecommissionAssetModal: React.FC<DecommissionAssetModalProps> = ({
  activo,
  onClose,
  onSuccess
}) => {
  const [motivo, setMotivo] = useState<string>('');
  const [dictamenTecnico, setDictamenTecnico] = useState<string>('');
  const [destinoFinalBien, setDestinoFinalBien] = useState<string>('descarte_ecologico');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!activo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 5) {
      setError('El motivo de la baja es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const dto: DarDeBajaActivoDto = {
        motivo: motivo.trim(),
        dictamenTecnico: dictamenTecnico.trim() || undefined,
        destinoFinalBien
      };

      const res = await apiClient.procesarBajaPatrimonial(activo.id, dto);
      onSuccess(res);
    } catch (err: any) {
      console.error('Error al procesar baja:', err);
      setError(err?.message || 'Error al procesar la baja patrimonial del activo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decommission-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="bg-rose-900 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-300 border border-white/20">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 id="decommission-modal-title" className="text-base font-bold text-white tracking-wide">
                Baja y Descargo Patrimonial
              </h2>
              <p className="text-xs text-rose-200">
                Placa: <span className="font-mono font-bold text-white">{activo.placa_institucional}</span> • Emisión de Acta Oficial UOD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tarjeta Informativa del Activo */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Equipo a Desincorporar:</span>
              <span className="font-bold text-slate-900 text-sm block">{activo.recurso_nombre}</span>
              <span className="text-slate-400 font-mono text-[11px] block">Serial: {activo.numero_serie}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-600">
              <span>Ubicación: <strong>{activo.ubicacion_nombre}</strong></span>
              <span>Custodio: <strong>{activo.responsable}</strong></span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
            ⚠️ <strong>Acción Irreversible:</strong> Al dar de baja este equipo, se liberará al custodio de su custodia patrimonial, se desincorporará del inventario activo y se generará el <strong>Acta Oficial de Descargo</strong> con correlativo institucional para contabilidad y auditoría.
          </div>

          {/* Motivo Justificado */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motivo Justificado de la Baja <span className="text-rose-600">*</span>
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-rose-800 focus:outline-none mb-1.5"
            >
              <option value="">Seleccione o escriba el motivo...</option>
              <option value="Obsolescencia tecnológica y fin de vida útil operativa">Obsolescencia tecnológica y fin de vida útil</option>
              <option value="Daño físico irreparable o coste de reparación inviable">Daño físico irreparable / Reparación inviable</option>
              <option value="Desgaste natural de componentes electrónicos sin repuestos">Desgaste natural sin repuestos disponibles</option>
              <option value="Sustitución por renovación tecnológica programada">Sustitución por renovación tecnológica</option>
              <option value="Avería por sobretensión o siniestro eléctrico">Avería por siniestro eléctrico</option>
            </select>
            <input
              type="text"
              placeholder="O ingrese un motivo personalizado..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-rose-800 focus:outline-none"
              required
            />
          </div>

          {/* Dictamen Técnico */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Dictamen Técnico de Evaluación (TI)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Equipo revisado por laboratorio TI; tarjeta madre dañada sin posibilidad de reemplazo económico..."
              value={dictamenTecnico}
              onChange={(e) => setDictamenTecnico(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-rose-800 focus:outline-none"
            />
          </div>

          {/* Destino Final del Bien */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Destino Final del Bien
            </label>
            <select
              value={destinoFinalBien}
              onChange={(e) => setDestinoFinalBien(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-rose-800 focus:outline-none"
            >
              <option value="descarte_ecologico">Descarte Ecológico y Gestión de RAEE (Norma Ambiental)</option>
              <option value="repuestos">Canibalización de partes y piezas para repuestos</option>
              <option value="reciclaje">Reciclaje institucional de chatarra electrónica</option>
              <option value="donacion">Donación institucional autorizada</option>
            </select>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {guardando ? 'Procesando Baja...' : 'Confirmar Baja y Emitir Acta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
