'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  FileText,
  Upload,
  Download,
  Eye,
  Camera,
  QrCode,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  User,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  Image as ImageIcon,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';
import {
  apiClient,
  ActivoSerieDto,
  ActivoSerieDetalleDto,
  ActivoHistorialCambioDto,
  RecursoFotoDto
} from '@/lib/apiClient';
import {
  CATEGORIAS_ORIGINALES,
  UBICACIONES_ORIGINALES,
  ActivoTI
} from '@/lib/inventoryData';
import { QrLabelsPrintModal } from './QrLabelsPrintModal';

interface EditAssetModalProps {
  activoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (activoActualizado: ActivoSerieDto) => void;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  activoId,
  isOpen,
  onClose,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'datos' | 'factura' | 'fotos' | 'qr' | 'historial'>('datos');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFactura, setSubiendoFactura] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Datos detallados del activo
  const [detalle, setDetalle] = useState<ActivoSerieDetalleDto | null>(null);
  const [historial, setHistorial] = useState<ActivoHistorialCambioDto[]>([]);

  // Campos del formulario
  const [placa, setPlaca] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [recursoNombre, setRecursoNombre] = useState('');
  const [recursoDescripcion, setRecursoDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estado, setEstado] = useState('disponible');
  const [ubicacionId, setUbicacionId] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [fechaAdquisicion, setFechaAdquisicion] = useState('');
  const [costoAdquisicion, setCostoAdquisicion] = useState<string>('');
  const [notas, setNotas] = useState('');

  // Factura
  const [facturaUrl, setFacturaUrl] = useState<string | null>(null);
  const [facturaNombre, setFacturaNombre] = useState<string | null>(null);
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const [previewFacturaUrl, setPreviewFacturaUrl] = useState<string | null>(null);

  // Fotos
  const [fotos, setFotos] = useState<RecursoFotoDto[]>([]);
  const [modalImprimirQr, setModalImprimirQr] = useState(false);

  const fileInputFacturaRef = useRef<HTMLInputElement>(null);
  const fileInputFotoRef = useRef<HTMLInputElement>(null);

  // Cargar datos del activo al abrir
  useEffect(() => {
    if (!isOpen || !activoId) return;

    let cancelado = false;
    const cargarDatos = async () => {
      setCargando(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const act = await apiClient.obtenerActivoPorId(activoId);
        if (cancelado) return;

        setDetalle(act);
        setPlaca(act.placaInstitucional || '');
        setNumeroSerie(act.numeroSerie || '');
        setRecursoNombre(act.recursoNombre || '');
        setRecursoDescripcion(act.recursoDescripcion || '');
        setCategoriaId(act.categoriaId || CATEGORIAS_ORIGINALES[0].id);
        setEstado(act.estado || 'disponible');
        setUbicacionId(act.ubicacionId || UBICACIONES_ORIGINALES[0].id);
        setResponsableNombre(act.responsableNombre || '');
        setProveedorNombre(act.proveedorNombre || '');
        setFechaAdquisicion(act.fechaAdquisicion || '');
        setCostoAdquisicion(act.costoAdquisicion ? String(act.costoAdquisicion) : '');
        setNotas(act.notas || '');
        setFacturaUrl(act.facturaUrl || null);
        setFacturaNombre(act.facturaNombre || null);
        setFotos(act.fotos || []);

        // Cargar historial
        if (act.historialCambios && act.historialCambios.length > 0) {
          setHistorial(act.historialCambios);
        } else {
          try {
            const h = await apiClient.obtenerHistorialActivo(activoId);
            if (!cancelado) setHistorial(h);
          } catch {
            // Historial opcional si no hay registros
          }
        }
      } catch (err: any) {
        console.error('Error al cargar datos del activo:', err);
        setErrorMsg('No se pudieron obtener todos los detalles del servidor. Puedes editar los campos locales.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [isOpen, activoId]);

  if (!isOpen || !activoId) return null;

  // Manejador de selección de factura
  const handleSelectFactura = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo de factura no puede exceder 10 MB.');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Formato inválido. Solo se admiten archivos PDF o imágenes (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setArchivoFactura(file);
    setPreviewFacturaUrl(URL.createObjectURL(file));
  };

  // Subir factura inmediatamente
  const handleSubirFactura = async () => {
    if (!archivoFactura || !activoId) return;

    try {
      setSubiendoFactura(true);
      setErrorMsg(null);
      const res = await apiClient.subirFacturaActivo(activoId, archivoFactura);
      setFacturaUrl(res.facturaUrl || null);
      setFacturaNombre(res.facturaNombre || archivoFactura.name);
      setArchivoFactura(null);
      setSuccessMsg('Factura digital vinculada exitosamente al activo.');
      // Refrescar historial
      try {
        const h = await apiClient.obtenerHistorialActivo(activoId);
        setHistorial(h);
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Error al subir la factura digital.');
    } finally {
      setSubiendoFactura(false);
    }
  };

  // Subir nueva foto
  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detalle?.recursoId) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La imagen no puede exceder 5 MB.');
      return;
    }

    try {
      setSubiendoFoto(true);
      setErrorMsg(null);
      const res = await apiClient.subirFotoRecurso(detalle.recursoId, file, fotos.length === 0);
      setFotos(prev => [...prev, res]);
      setSuccessMsg('Fotografía agregada con éxito al catálogo del bien.');
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Error al subir la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Guardar formulario general
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroSerie.trim()) {
      setErrorMsg('El número de serie es un campo obligatorio.');
      return;
    }
    if (!ubicacionId) {
      setErrorMsg('Debe seleccionar una ubicación física de la UOD.');
      return;
    }

    try {
      setGuardando(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Si hay una factura pendiente de subir, subirla primero
      let fUrl = facturaUrl;
      let fNom = facturaNombre;
      if (archivoFactura) {
        try {
          const resFac = await apiClient.subirFacturaActivo(activoId, archivoFactura);
          fUrl = resFac.facturaUrl || null;
          fNom = resFac.facturaNombre || archivoFactura.name;
          setFacturaUrl(fUrl);
          setFacturaNombre(fNom);
        } catch (facErr: any) {
          console.warn('Fallo al subir factura, continuando guardado general:', facErr);
        }
      }

      const dto = {
        numeroSerie: numeroSerie.trim(),
        placaInstitucional: placa.trim() ? placa.trim().toUpperCase() : null,
        estado: estado.trim().toLowerCase(),
        ubicacionId,
        responsableId: detalle?.responsableId || null,
        proveedorId: detalle?.proveedorId || null,
        fechaAdquisicion: fechaAdquisicion ? fechaAdquisicion : null,
        costoAdquisicion: costoAdquisicion ? parseFloat(costoAdquisicion) : null,
        facturaUrl: fUrl,
        facturaNombre: fNom,
        notas: notas.trim() || null,
        recursoNombre: recursoNombre.trim() || undefined,
        recursoDescripcion: recursoDescripcion.trim() || undefined,
        recursoCategoriaId: categoriaId || undefined
      };

      const actualizado = await apiClient.actualizarActivo(activoId, dto);
      setSuccessMsg('Activo actualizado con éxito en la base de datos.');

      // Refrescar historial
      try {
        const h = await apiClient.obtenerHistorialActivo(activoId);
        setHistorial(h);
      } catch {}

      onSaved(actualizado);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || 'Error al guardar los cambios del activo.');
    } finally {
      setGuardando(false);
    }
  };

  // URL del código QR canónico
  const qrUrlCanonica = `https://siia.uod.edu.do/recurso/${detalle?.recursoId || activoId}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C3177]/10 flex items-center justify-center text-[#1C3177] font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#1C3177] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {placa || 'SIN PLACA'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  S/N: {numeroSerie || 'N/A'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 line-clamp-1">
                Editar Activo: {recursoNombre || 'Equipo TI'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificaciones de error o éxito */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs de Navegación */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'datos'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Datos Principales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factura')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'factura'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Factura Digital
            {facturaUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'fotos'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Fotografías ({fotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Código QR y Etiquetas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'historial'
                ? 'border-[#1C3177] text-[#1C3177]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial ({historial.length})
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cargando ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#1C3177]" />
              <p className="text-xs">Cargando ficha completa del activo...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DATOS PRINCIPALES */}
              {activeTab === 'datos' && (
                <form id="edit-asset-form" onSubmit={handleGuardar} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Placa Institucional UOD
                      </label>
                      <input
                        type="text"
                        value={placa}
                        onChange={e => setPlaca(e.target.value.toUpperCase())}
                        placeholder="Ej: EQ-01"
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Placa física asignada en el levantamiento 2026.</p>
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
                        placeholder="Número de serie de fábrica"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre / Modelo del Recurso
                      </label>
                      <input
                        type="text"
                        required
                        value={recursoNombre}
                        onChange={e => setRecursoNombre(e.target.value)}
                        placeholder="Ej: Computadora Lenovo ThinkCentre M70q"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] focus:ring-1 focus:ring-[#1C3177]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoría Tecnológica
                      </label>
                      <select
                        value={categoriaId}
                        onChange={e => setCategoriaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] bg-white"
                      >
                        {CATEGORIAS_ORIGINALES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estado Operativo
                      </label>
                      <select
                        value={estado}
                        onChange={e => setEstado(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] bg-white font-medium"
                      >
                        <option value="disponible">Disponible (En Almacén)</option>
                        <option value="en_uso">En Uso (Operativo Institucional)</option>
                        <option value="en_mantenimiento">En Mantenimiento Técnico</option>
                        <option value="danado">Dañado / Inoperativo</option>
                        <option value="dado_de_baja">Dado de Baja Patrimonial</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1C3177]" />
                        Ubicación Física UOD (49 disponibles)
                      </label>
                      <select
                        value={ubicacionId}
                        onChange={e => setUbicacionId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177] bg-white"
                      >
                        {UBICACIONES_ORIGINALES.map(ub => (
                          <option key={ub.id} value={ub.id}>
                            {ub.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#3DAA5C]" />
                        Responsable / Custodio Actual
                      </label>
                      <input
                        type="text"
                        value={responsableNombre}
                        onChange={e => setResponsableNombre(e.target.value)}
                        placeholder="Nombre del custodio asignado"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Proveedor o Suplidor
                      </label>
                      <input
                        type="text"
                        value={proveedorNombre}
                        onChange={e => setProveedorNombre(e.target.value)}
                        placeholder="Nombre comercial del suplidor"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Fecha de Adquisición
                      </label>
                      <input
                        type="date"
                        value={fechaAdquisicion}
                        onChange={e => setFechaAdquisicion(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Costo de Adquisición Real (DOP)
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
                      <p className="text-[10px] text-slate-400 mt-1">Costo real de compra según factura.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observaciones / Notas del Levantamiento
                      </label>
                      <textarea
                        rows={2}
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        placeholder="Notas adicionales sobre el estado, accesorios o asignación del equipo..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1C3177]"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: FACTURA DIGITAL */}
              {activeTab === 'factura' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-[#1C3177] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Factura de Compra Institucional</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Sube o actualiza la factura real en formato PDF o imagen (JPG, PNG, WebP) de hasta 10 MB.
                        El documento queda registrado inmutablemente y puede ser descargado en cualquier momento.
                      </p>
                    </div>
                  </div>

                  {/* Factura actual vinculada */}
                  {facturaUrl ? (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {facturaNombre || 'factura_adquisicion.pdf'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              ✓ Factura digital registrada y verificada
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={facturaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1C3177] text-white hover:bg-[#2B4BA0] transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                          </a>
                        </div>
                      </div>

                      {/* Vista previa embebida si es imagen */}
                      {facturaUrl.startsWith('data:image') || facturaUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i) ? (
                        <div className="mt-3 border rounded-xl overflow-hidden max-h-64 flex items-center justify-center bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={facturaUrl}
                            alt="Factura"
                            className="object-contain max-h-64 w-auto"
                          />
                        </div>
                      ) : (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100 flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4 text-slate-400" />
                          <span>Documento PDF disponible para previsualización y descarga en pestaña externa.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">Este activo aún no tiene factura digital adjunta</p>
                      <p className="text-[11px] text-slate-400">Selecciona un archivo PDF o imagen para vincularlo de inmediato.</p>
                    </div>
                  )}

                  {/* Selector para subir o reemplazar factura */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800">
                      {facturaUrl ? 'Reemplazar Factura Digital' : 'Adjuntar Nueva Factura'}
                    </h5>

                    <input
                      ref={fileInputFacturaRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleSelectFactura}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputFacturaRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#1C3177]" />
                        Seleccionar Archivo (Máx 10 MB)
                      </button>

                      {archivoFactura && (
                        <span className="text-xs font-mono text-slate-700 truncate max-w-xs">
                          {archivoFactura.name} ({(archivoFactura.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      )}
                    </div>

                    {archivoFactura && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSubirFactura}
                          disabled={subiendoFactura}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {subiendoFactura ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Subir y Guardar Factura Ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArchivoFactura(null);
                            setPreviewFacturaUrl(null);
                          }}
                          className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FOTOGRAFÍAS */}
              {activeTab === 'fotos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Galería Fotográfica del Bien</h4>
                      <p className="text-[11px] text-slate-500">
                        Fotografías físicas tomadas al activo o modelo tecnológico.
                      </p>
                    </div>
                    <div>
                      <input
                        ref={fileInputFotoRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleSubirFoto}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputFotoRef.current?.click()}
                        disabled={subiendoFoto}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] text-white hover:bg-[#2B4BA0] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {subiendoFoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                        Subir Fotografía (Máx 5 MB)
                      </button>
                    </div>
                  </div>

                  {fotos.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No hay fotos registradas para este activo.</p>
                      <p className="text-[11px] text-slate-400">Puedes capturar o subir imágenes desde tu equipo o smartphone.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {fotos.map(f => (
                        <div
                          key={f.id}
                          className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.urlArchivo}
                            alt="Foto activo"
                            className="w-full h-36 object-cover"
                          />
                          {f.esPrincipal && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#3DAA5C] text-white shadow-xs">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CÓDIGO QR Y ETIQUETAS */}
              {activeTab === 'qr' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrlCanonica)}`}
                        alt="Código QR institucional"
                        className="w-40 h-40"
                      />
                      <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold">
                        {placa || 'QR INSTITUCIONAL'}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-[#1C3177] uppercase tracking-wider">
                        Resolución Universal Canónica
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        Código QR Oficial Universidad Odontológica Dominicana
                      </h4>
                      <p className="text-xs text-slate-600">
                        Enlace permanente al inventario institucional. Al escanearlo con cualquier cámara o terminal SIIA,
                        resuelve automáticamente los datos físicos, el custodio y la bitácora de este activo.
                      </p>

                      <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrlCanonica)}`}
                          download={`QR_${placa || numeroSerie}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar PNG
                        </a>
                        <button
                          type="button"
                          onClick={() => setModalImprimirQr(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Etiqueta Física
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: HISTORIAL DE CAMBIOS */}
              {activeTab === 'historial' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Bitácora Inmutable de Auditoría</h4>
                      <p className="text-[11px] text-slate-500">
                        Registro cronológico de todas las modificaciones realizadas sobre este activo (Ley 172-13).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#1C3177] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      {historial.length} eventos
                    </span>
                  </div>

                  {historial.length === 0 ? (
                    <div className="py-12 border rounded-2xl text-center space-y-2 bg-slate-50">
                      <History className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No se han registrado modificaciones previas en este activo.</p>
                      <p className="text-[10px] text-slate-400">Cada cambio guardado quedará guardado con el valor anterior y el nuevo.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {historial.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                                {item.accion}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {item.usuarioNombre || 'Operador SIIA'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(item.fecha).toLocaleString('es-DO', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>

                          {item.detalle && (
                            <p className="text-slate-600 text-[11px]">{item.detalle}</p>
                          )}

                          {item.valoresNuevos && (
                            <details className="mt-1 text-[10px] text-slate-500 cursor-pointer">
                              <summary className="font-medium hover:text-[#1C3177]">Ver datos del cambio</summary>
                              <div className="mt-1 p-2 bg-slate-50 rounded-lg font-mono text-[10px] overflow-x-auto space-y-1">
                                {item.valoresAnteriores && (
                                  <div>
                                    <span className="text-rose-600 font-bold block">Valores Anteriores:</span>
                                    <pre className="whitespace-pre-wrap">{item.valoresAnteriores}</pre>
                                  </div>
                                )}
                                <div>
                                  <span className="text-emerald-600 font-bold block">Valores Nuevos:</span>
                                  <pre className="whitespace-pre-wrap">{item.valoresNuevos}</pre>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {activeTab === 'datos' && 'Todos los cambios quedan registrados en la bitácora.'}
            {activeTab === 'factura' && 'Formatos admitidos: PDF, JPG, PNG, WebP (hasta 10 MB).'}
            {activeTab === 'fotos' && 'Imágenes optimizadas para catálogo y etiquetas físicas.'}
            {activeTab === 'qr' && 'El código QR es único y canónico para la institución.'}
            {activeTab === 'historial' && 'Registro inmutable según la Ley 172-13.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando || cargando}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#1C3177] hover:bg-[#2B4BA0] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Impresión de Etiqueta QR */}
      {modalImprimirQr && detalle && (
        <QrLabelsPrintModal
          isOpen={modalImprimirQr}
          onClose={() => setModalImprimirQr(false)}
          recursos={[
            {
              id: detalle.recursoId || detalle.id,
              sku: detalle.recursoSku || detalle.placaInstitucional || 'EQ',
              nombre: detalle.recursoNombre,
              categoriaId: detalle.categoriaId,
              categoriaNombre: detalle.categoriaNombre,
              tipo: 'activo_fijo',
              unidadMedida: 'unidad',
              stockMinimo: 0,
              costoEstimado: detalle.costoEstimado,
              activo: true,
              stockActual: 1,
              fotoPrincipalUrl: detalle.fotoPrincipalUrl,
              totalFotos: fotos.length,
              qrPrincipalCodigo: qrUrlCanonica,
              totalActivosSerie: 1,
              creadoEn: detalle.creadoEn,
              actualizadoEn: detalle.actualizadoEn
            }
          ]}
        />
      )}
    </div>
  );
};
