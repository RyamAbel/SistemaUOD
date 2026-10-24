'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Plus,
  Cpu,
  Building2,
  User,
  Tag,
  DollarSign,
  FileCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import {
  apiClient,
  RecursoDto,
  UbicacionDto,
  CrearActivoSerieDto,
  ActivoSerieDto
} from '@/lib/apiClient';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (nuevoActivo: ActivoSerieDto) => void;
  ubicaciones: UbicacionDto[];
  siguientePlacaSugerida?: string;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  ubicaciones,
  siguientePlacaSugerida = 'EQ-342'
}) => {
  const [recursos, setRecursos] = useState<RecursoDto[]>([]);
  const [cargandoRecursos, setCargandoRecursos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos
  const [recursoId, setRecursoId] = useState('');
  const [nuevoRecursoNombre, setNuevoRecursoNombre] = useState('');
  const [esNuevoRecurso, setEsNuevoRecurso] = useState(false);
  const [placa, setPlaca] = useState(siguientePlacaSugerida);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [estado, setEstado] = useState<'en_uso' | 'disponible' | 'danado'>('en_uso');
  const [costoAdquisicion, setCostoAdquisicion] = useState<string>('');
  const [notas, setNotas] = useState('');

  // Factura
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPlaca(siguientePlacaSugerida);
      setErrorMsg(null);
      // Cargar lista de recursos del catálogo para vincular
      const cargarRecursos = async () => {
        try {
          setCargandoRecursos(true);
          const res = await apiClient.listarRecursos({ pageSize: 300, activo: true });
          setRecursos(res.items);
          if (res.items.length > 0 && !recursoId) {
            setRecursoId(res.items[0].id);
          }
        } catch (err) {
          console.warn('Error cargando recursos de catálogo:', err);
        } finally {
          setCargandoRecursos(false);
        }
      };
      cargarRecursos();

      // Preseleccionar primera ubicación si no hay seleccionada
      if (ubicaciones.length > 0 && !ubicacionId) {
        setUbicacionId(ubicaciones[0].id);
      }
    }
  }, [isOpen, siguientePlacaSugerida, ubicaciones]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('El archivo de la factura no debe exceder los 10 MB.');
        return;
      }
      setArchivoFactura(file);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!numeroSerie.trim()) {
      setErrorMsg('El número de serie de fábrica es obligatorio.');
      return;
    }

    if (!ubicacionId) {
      setErrorMsg('Debes seleccionar una ubicación física.');
      return;
    }

    let idRecursoFinal = recursoId;

    setGuardando(true);
    try {
      // 1. Si es un modelo nuevo que no está en catálogo, crearlo primero
      if (esNuevoRecurso && nuevoRecursoNombre.trim()) {
        const catDefault = recursos[0]?.categoriaId || '00000000-0000-0000-0000-000000000001';
        const nuevoRec = await apiClient.crearRecurso({
          nombre: nuevoRecursoNombre.trim(),
          sku: `TI-${Date.now().toString().slice(-6)}`,
          tipo: 'activo_fijo',
          categoriaId: catDefault,
          unidadMedida: 'unidad',
          stockMinimo: 1,
          costoEstimado: costoAdquisicion ? parseFloat(costoAdquisicion) : 0,
          activo: true
        });
        idRecursoFinal = nuevoRec.id;
      } else if (!idRecursoFinal && recursos.length > 0) {
        idRecursoFinal = recursos[0].id;
      }

      if (!idRecursoFinal) {
        setErrorMsg('Selecciona o ingresa el modelo o recurso del equipo.');
        setGuardando(false);
        return;
      }

      // 2. Crear el activo físico serializado en BD
      const dto: CrearActivoSerieDto = {
        recursoId: idRecursoFinal,
        numeroSerie: numeroSerie.trim(),
        placaInstitucional: placa.trim() || undefined,
        ubicacionId,
        estado,
        costoAdquisicion: costoAdquisicion ? parseFloat(costoAdquisicion) : null,
        notas: notas.trim() ? (responsableNombre.trim() ? `${notas.trim()} | Responsable: ${responsableNombre.trim()}` : notas.trim()) : (responsableNombre.trim() ? `Responsable: ${responsableNombre.trim()}` : null)
      };

      let activoCreado = await apiClient.crearActivo(dto);

      // 3. Si se adjuntó factura, subirla directamente
      if (archivoFactura) {
        try {
          activoCreado = await apiClient.subirFacturaActivo(activoCreado.id, archivoFactura);
        } catch (facturaErr: any) {
          console.warn('El activo se creó pero hubo error al subir la factura:', facturaErr);
        }
      }

      onCreated(activoCreado);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar el activo fijo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1C3177] text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Activo Fijo TI</h3>
              <p className="text-xs text-slate-500">
                Incorporación patrimonial física con placa institucional y factura digital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Modelo/Recurso */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#1C3177]" />
                Modelo / Recurso Tecnológico <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setEsNuevoRecurso(!esNuevoRecurso)}
                className="text-[11px] font-semibold text-[#1C3177] hover:underline cursor-pointer"
              >
                {esNuevoRecurso ? '← Seleccionar de catálogo existente' : '+ Crear nuevo modelo'}
              </button>
            </div>

            {esNuevoRecurso ? (
              <input
                type="text"
                required
                value={nuevoRecursoNombre}
                onChange={e => setNuevoRecursoNombre(e.target.value)}
                placeholder="Ej: Laptop Lenovo ThinkPad T14 Gen 4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              />
            ) : (
              <select
                value={recursoId}
                onChange={e => setRecursoId(e.target.value)}
                disabled={cargandoRecursos}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              >
                {cargandoRecursos ? (
                  <option value="">Cargando catálogo institucional...</option>
                ) : (
                  recursos.map(rec => (
                    <option key={rec.id} value={rec.id}>
                      {rec.nombre} ({rec.sku})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Fila 2: Placa Institucional y Serie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Placa Institucional UOD
              </label>
              <input
                type="text"
                value={placa}
                onChange={e => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ej: EQ-342"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Sugerido correlativo según inventario físico.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Serie <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={numeroSerie}
                onChange={e => setNumeroSerie(e.target.value)}
                placeholder="Ej: 5CD2348ABC"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              />
            </div>
          </div>

          {/* Fila 3: Ubicación y Custodio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1C3177]" />
                Ubicación Física UOD <span className="text-rose-500">*</span>
              </label>
              <select
                value={ubicacionId}
                onChange={e => setUbicacionId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              >
                <option value="">Selecciona ubicación...</option>
                {ubicaciones.map(ubi => (
                  <option key={ubi.id} value={ubi.id}>
                    {ubi.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#3DAA5C]" />
                Custodio / Responsable Real
              </label>
              <input
                type="text"
                value={responsableNombre}
                onChange={e => setResponsableNombre(e.target.value)}
                placeholder="Ej: Lic. María Santos"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              />
            </div>
          </div>

          {/* Fila 4: Estado y Costo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado Operativo
              </label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
              >
                <option value="en_uso">En Uso (Asignado)</option>
                <option value="disponible">Disponible (Almacén / Depósito)</option>
                <option value="danado">Dañado / Para Mantenimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Costo de Adquisición (DOP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costoAdquisicion}
                onChange={e => setCostoAdquisicion(e.target.value)}
                placeholder="RD$ 0.00"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
              />
            </div>
          </div>

          {/* Fila 5: Factura Digital de Compra */}
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#1C3177]" />
              Factura Digital de Adquisición (PDF o Imagen)
            </label>
            <p className="text-[11px] text-slate-600">
              Adjunta el comprobante de compra institucional para el soporte contable y auditoría (máx 10 MB).
            </p>

            {archivoFactura ? (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#1C3177] shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {archivoFactura.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(archivoFactura.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivoFactura(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Quitar archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1C3177] bg-white rounded-xl p-3 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-[#1C3177]">
                  Haz clic para seleccionar el archivo de factura
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Formatos permitidos: PDF, JPG, PNG, WebP
                </span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          {/* Fila 6: Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones del Levantamiento / Notas
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Detalles sobre accesorios, estado o motivo de asignación..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={guardando}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1C3177] hover:bg-[#2B4BA0] rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando activo...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Activo Fijo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
