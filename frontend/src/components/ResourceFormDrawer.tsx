'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Plus,
  Copy,
  Upload,
  Camera,
  Trash2,
  Star,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  QrCode,
  Barcode,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  apiClient,
  RecursoDto,
  RecursoDetalleDto,
  CrearRecursoDto,
  CategoriaDto,
  ProveedorDto,
  ResolucionCodigoDto
} from '@/lib/apiClient';

interface ResourceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (recurso: RecursoDto, keepOpenForNext?: boolean) => void;
  recursoIdToEdit?: string | null;
  initialDataToDuplicate?: RecursoDto | null;
}

interface LocalPhoto {
  id?: string; // id si ya existe en backend
  file?: File; // archivo si es local nuevo
  previewUrl: string;
  isPrincipal: boolean;
  isUploading?: boolean;
}

export const ResourceFormDrawer: React.FC<ResourceFormDrawerProps> = ({
  isOpen,
  onClose,
  onSaved,
  recursoIdToEdit,
  initialDataToDuplicate
}) => {
  // Estado general
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listas auxiliares
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);

  // Campos del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [tipo, setTipo] = useState<'activo_fijo' | 'consumible'>('activo_fijo');
  const [unidadMedida, setUnidadMedida] = useState('unidad');
  const [stockMinimo, setStockMinimo] = useState<number>(1);
  const [stockMaximo, setStockMaximo] = useState<number | ''>('');
  const [puntoReorden, setPuntoReorden] = useState<number | ''>('');
  const [costoEstimado, setCostoEstimado] = useState<number>(0);
  const [codigoQrInicial, setCodigoQrInicial] = useState('');
  const [activo, setActivo] = useState(true);

  // Fotografías
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Detección de duplicados
  const [possibleDuplicates, setPossibleDuplicates] = useState<RecursoDto[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Verificación de código externo / fabricante
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeVerificationResult, setCodeVerificationResult] = useState<ResolucionCodigoDto | null>(null);

  // Cargar categorías y proveedores
  useEffect(() => {
    if (isOpen) {
      cargarCatalogosAuxiliares();
    }
  }, [isOpen]);

  const cargarCatalogosAuxiliares = async () => {
    try {
      const [catsRes, provRes] = await Promise.all([
        apiClient.listarCategorias(true),
        apiClient.listarProveedores({ pageSize: 100, soloActivos: true })
      ]);
      setCategorias(catsRes.filter((c: CategoriaDto) => c.activa));
      setProveedores(provRes.items || []);
    } catch (err) {
      console.error('Error cargando catálogos auxiliares:', err);
    }
  };

  // Cargar datos si es edición o duplicación
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (recursoIdToEdit) {
      cargarRecursoExistente(recursoIdToEdit);
    } else if (initialDataToDuplicate) {
      cargarDatosParaDuplicar(initialDataToDuplicate);
    } else {
      resetForm();
      generarSkuSugerido();
    }
  }, [isOpen, recursoIdToEdit, initialDataToDuplicate]);

  const resetForm = () => {
    setSku('');
    setNombre('');
    setDescripcion('');
    setCategoriaId(categorias[0]?.id || '');
    setTipo('activo_fijo');
    setUnidadMedida('unidad');
    setStockMinimo(1);
    setStockMaximo('');
    setPuntoReorden('');
    setCostoEstimado(0);
    setCodigoQrInicial('');
    setActivo(true);
    setPhotos([]);
    setPossibleDuplicates([]);
    setCodeVerificationResult(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const generarSkuSugerido = () => {
    const prefijo = tipo === 'activo_fijo' ? 'ACT' : 'CON';
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    setSku(`UOD-${prefijo}-${aleatorio}`);
  };

  const cargarRecursoExistente = async (id: string) => {
    setLoadingInitial(true);
    setErrorMessage(null);
    try {
      const r = await apiClient.obtenerRecurso(id);
      setSku(r.sku);
      setNombre(r.nombre);
      setDescripcion(r.descripcion || '');
      setCategoriaId(r.categoriaId);
      setTipo(r.tipo);
      setUnidadMedida(r.unidadMedida || 'unidad');
      setStockMinimo(r.stockMinimo);
      setStockMaximo(r.stockMaximo !== null && r.stockMaximo !== undefined ? r.stockMaximo : '');
      setPuntoReorden(r.puntoReorden !== null && r.puntoReorden !== undefined ? r.puntoReorden : '');
      setCostoEstimado(r.costoEstimado || 0);
      setActivo(r.activo);
      setCodigoQrInicial(r.qrPrincipalCodigo || '');

      // Fotos existentes
      if (r.fotos && r.fotos.length > 0) {
        setPhotos(
          r.fotos.map(f => ({
            id: f.id,
            previewUrl: f.urlArchivo,
            isPrincipal: f.esPrincipal
          }))
        );
      } else {
        setPhotos([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo cargar la información del recurso.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const cargarDatosParaDuplicar = (r: RecursoDto) => {
    const timestamp = Math.floor(1000 + Math.random() * 9000);
    setSku(`${r.sku}-COPIA-${timestamp}`);
    setNombre(`${r.nombre} (Copia)`);
    setDescripcion(r.descripcion || '');
    setCategoriaId(r.categoriaId);
    setTipo(r.tipo);
    setUnidadMedida(r.unidadMedida || 'unidad');
    setStockMinimo(r.stockMinimo);
    setStockMaximo(r.stockMaximo !== null && r.stockMaximo !== undefined ? r.stockMaximo : '');
    setPuntoReorden(r.puntoReorden !== null && r.puntoReorden !== undefined ? r.puntoReorden : '');
    setCostoEstimado(r.costoEstimado || 0);
    setActivo(true);
    setCodigoQrInicial('');
    setPhotos([]);
  };

  // Detección de duplicados con debounce (buscar por nombre)
  useEffect(() => {
    if (!nombre || nombre.trim().length < 3 || recursoIdToEdit) {
      setPossibleDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await apiClient.listarRecursos({
          search: nombre.trim(),
          pageSize: 4,
          activo: true
        });
        // Filtrar coincidencias similares que no sean el recurso actual
        const matches = (res.items || []).filter(item => item.id !== recursoIdToEdit);
        setPossibleDuplicates(matches);
      } catch (e) {
        // Silencioso
      } finally {
        setCheckingDuplicates(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [nombre, recursoIdToEdit]);

  // Verificación de código externo / fabricante
  const verificarCodigo = async (codigo: string) => {
    if (!codigo || codigo.trim().length < 2) {
      setCodeVerificationResult(null);
      return;
    }
    setVerifyingCode(true);
    try {
      const res = await apiClient.resolverCodigo(codigo.trim());
      setCodeVerificationResult(res);
    } catch (e) {
      setCodeVerificationResult(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  // Manejo de fotos
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: LocalPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`El archivo ${file.name} no es una imagen válida (solo JPG, PNG o WebP).`);
        continue;
      }
      // Validar tamaño máx 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} excede el límite de 5 MB.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        file,
        previewUrl,
        isPrincipal: photos.length === 0 && newPhotos.length === 0
      });
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleSetPrincipalPhoto = async (index: number) => {
    const target = photos[index];
    // Si estamos editando y la foto ya tiene ID en backend
    if (recursoIdToEdit && target.id) {
      try {
        await apiClient.establecerFotoPrincipal(recursoIdToEdit, target.id);
      } catch (err: any) {
        alert('Error al establecer foto principal: ' + err.message);
        return;
      }
    }
    setPhotos(prev =>
      prev.map((p, idx) => ({
        ...p,
        isPrincipal: idx === index
      }))
    );
  };

  const handleRemovePhoto = async (index: number) => {
    const target = photos[index];
    if (recursoIdToEdit && target.id) {
      if (!confirm('¿Seguro que deseas eliminar esta fotografía de los servidores institucionales?')) return;
      try {
        await apiClient.eliminarFotoRecurso(recursoIdToEdit, target.id);
      } catch (err: any) {
        alert('Error al eliminar foto: ' + err.message);
        return;
      }
    }
    setPhotos(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (target.isPrincipal && next.length > 0) {
        next[0].isPrincipal = true;
      }
      return next;
    });
  };

  // Guardar recurso
  const handleSave = async (keepOpenForNext: boolean = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validaciones básicas
    if (!sku.trim()) {
      setErrorMessage('El código SKU institucional es obligatorio.');
      return;
    }
    if (!nombre.trim()) {
      setErrorMessage('El nombre del recurso es obligatorio.');
      return;
    }
    if (!categoriaId) {
      setErrorMessage('Debes seleccionar una categoría.');
      return;
    }

    const payload: CrearRecursoDto = {
      sku: sku.trim().toUpperCase(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      categoriaId,
      tipo,
      unidadMedida: unidadMedida || 'unidad',
      stockMinimo: Number(stockMinimo) || 0,
      stockMaximo: stockMaximo !== '' ? Number(stockMaximo) : undefined,
      puntoReorden: puntoReorden !== '' ? Number(puntoReorden) : undefined,
      costoEstimado: Number(costoEstimado) || 0,
      codigoQrInicial: codigoQrInicial.trim() || undefined,
      activo
    };

    setSaving(true);
    try {
      let savedResource: RecursoDto;

      if (recursoIdToEdit) {
        // Actualizar
        savedResource = await apiClient.actualizarRecurso(recursoIdToEdit, payload);
      } else {
        // Crear
        savedResource = await apiClient.crearRecurso(payload);
      }

      // Subir fotos pendientes si hay
      const pendingFiles = photos.filter(p => p.file && !p.id);
      if (pendingFiles.length > 0) {
        for (const p of pendingFiles) {
          if (p.file) {
            try {
              await apiClient.subirFotoRecurso(savedResource.id, p.file, p.isPrincipal);
            } catch (fotoErr) {
              console.warn('Error subiendo foto secundaria:', fotoErr);
            }
          }
        }
      }

      setSuccessMessage(
        recursoIdToEdit
          ? `¡Recurso "${savedResource.nombre}" actualizado con éxito!`
          : `¡Recurso "${savedResource.nombre}" registrado exitosamente!`
      );

      onSaved(savedResource, keepOpenForNext);

      if (keepOpenForNext) {
        // Resetear para ingresar el siguiente manteniendo la categoría
        const currentCat = categoriaId;
        const currentTipo = tipo;
        resetForm();
        setCategoriaId(currentCat);
        setTipo(currentTipo);
        generarSkuSugerido();
        setSuccessMessage('Recurso guardado. Puedes registrar el siguiente inmediatamente.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1C3177] text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 id="drawer-title" className="text-lg font-bold">
                  {recursoIdToEdit
                    ? 'Editar Recurso Institucional'
                    : initialDataToDuplicate
                    ? 'Duplicar Recurso en Catálogo'
                    : 'Nuevo Recurso Institucional'}
                </h2>
                <p className="text-xs text-blue-100">
                  {recursoIdToEdit
                    ? `SKU: ${sku}`
                    : 'Define los atributos, fotografías y códigos del recurso'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banners */}
          {errorMessage && (
            <div className="m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Atención</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="m-6 mb-0 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Operación exitosa</p>
                <p className="mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-x-0 space-y-6">
            {loadingInitial ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#1C3177] mb-3" />
                <p className="text-sm">Cargando datos del recurso...</p>
              </div>
            ) : (
              <>
                {/* 1. Alerta de posibles duplicados */}
                {possibleDuplicates.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Posible duplicado detectado en catálogo</span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Existen recursos con nombres o modelos similares. Verifica si ya está registrado antes de crear uno nuevo:
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {possibleDuplicates.map(dup => (
                        <div
                          key={dup.id}
                          className="bg-white p-2.5 rounded-lg border border-amber-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{dup.nombre}</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                              {dup.sku}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Stock: {dup.stockActual} {dup.unidadMedida}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Tipo de Recurso y SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tipo de Recurso <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTipo('activo_fijo');
                          if (!recursoIdToEdit) generarSkuSugerido();
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          tipo === 'activo_fijo'
                            ? 'bg-blue-50 border-[#1C3177] text-[#1C3177] shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Activo Fijo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipo('consumible');
                          if (!recursoIdToEdit) generarSkuSugerido();
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          tipo === 'consumible'
                            ? 'bg-blue-50 border-[#1C3177] text-[#1C3177] shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Consumible
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Código SKU Interno <span className="text-rose-500">*</span>
                      </label>
                      {!recursoIdToEdit && (
                        <button
                          type="button"
                          onClick={generarSkuSugerido}
                          className="text-[10px] text-[#1C3177] hover:underline flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Generar</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={sku}
                      onChange={e => setSku(e.target.value.toUpperCase())}
                      placeholder="Ej. UOD-ACT-0045"
                      className="w-full text-xs font-mono font-bold uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 3. Nombre y Categoría */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre Descriptivo del Recurso <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej. Sillón Odontológico Ergonómico Modelo X3"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] focus:border-transparent outline-none"
                  />
                  {checkingDuplicates && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Verificando unicidad en el catálogo...</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Categoría Institucional <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoriaId}
                      onChange={e => setCategoriaId(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] focus:border-transparent outline-none bg-white"
                    >
                      <option value="">-- Seleccionar categoría --</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.codigo} - {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Unidad de Medida
                    </label>
                    <select
                      value={unidadMedida}
                      onChange={e => setUnidadMedida(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] focus:border-transparent outline-none bg-white"
                    >
                      <option value="unidad">Unidad (ud)</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="frasco">Frasco</option>
                      <option value="kit">Kit</option>
                      <option value="metro">Metro (m)</option>
                      <option value="litro">Litro (L)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Costo y Parámetros de Stock */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-[#1C3177]" />
                    <span>Costos y Umbrales de Existencias</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Costo Est. (DOP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={costoEstimado}
                        onChange={e => setCostoEstimado(Number(e.target.value))}
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1C3177] outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stockMinimo}
                        onChange={e => setStockMinimo(Number(e.target.value))}
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1C3177] outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pto. Reorden
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={puntoReorden}
                        onChange={e => setPuntoReorden(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Opcional"
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1C3177] outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Stock Máximo
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stockMaximo}
                        onChange={e => setStockMaximo(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Opcional"
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1C3177] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Código de Fabricante / Barras y Escaneo rápido */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Barcode className="w-4 h-4 text-[#1C3177]" />
                      <span>Código de Barras / Fabricante (Opcional)</span>
                    </label>
                    {verifyingCode && (
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin text-[#1C3177]" />
                        <span>Verificando...</span>
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={codigoQrInicial}
                      onChange={e => {
                        setCodigoQrInicial(e.target.value);
                        verificarCodigo(e.target.value);
                      }}
                      placeholder="Escanear o ingresar código externo..."
                      className="flex-1 text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none"
                    />
                  </div>

                  {codeVerificationResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                        codeVerificationResult.encontrado
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {codeVerificationResult.encontrado ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">¡Código ya registrado en el inventario!</p>
                            <p className="text-[11px] mt-0.5">
                              Asignado a: {codeVerificationResult.recurso?.nombre || codeVerificationResult.activoSerie?.numeroSerie}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="font-medium">Código libre y disponible para este recurso.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Fotografías (Drag & Drop y Cámara) */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Galería Fotográfica (JPG, PNG, WebP - Máx 5 MB)
                  </label>

                  {/* Zona Drag & Drop */}
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilesSelected(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      isDragging
                        ? 'border-[#1C3177] bg-blue-50/50 scale-[0.99]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      Arrastra y suelta las fotos aquí, o selecciónalas desde tu equipo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Las fotos se guardan en el almacenamiento seguro institucional de Supabase
                    </p>

                    <div className="mt-4 flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                      >
                        Examinar archivos
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#1C3177] text-white rounded-lg text-xs font-bold hover:bg-[#2B4BA0] shadow-sm flex items-center space-x-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Tomar foto con cámara</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={e => handleFilesSelected(e.target.files)}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={e => handleFilesSelected(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {/* Previsualización de fotos */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-100 ${
                            photo.isPrincipal ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.previewUrl}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Badge de principal */}
                          {photo.isPrincipal && (
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Principal
                            </span>
                          )}

                          {/* Overlay de acciones */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            {!photo.isPrincipal && (
                              <button
                                type="button"
                                onClick={() => handleSetPrincipalPhoto(index)}
                                title="Marcar como foto principal"
                                className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white text-xs"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              title="Eliminar foto"
                              className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. Descripción detallada */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Descripción y Especificaciones Técnicas
                  </label>
                  <textarea
                    rows={3}
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Detalles sobre marca, modelo, voltaje, compatibilidad o notas para el inventario..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1C3177] outline-none resize-none"
                  />
                </div>

                {/* 8. Estado activo */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="chk-activo"
                    checked={activo}
                    onChange={e => setActivo(e.target.checked)}
                    className="w-4 h-4 text-[#1C3177] border-slate-300 rounded focus:ring-[#1C3177]"
                  />
                  <label htmlFor="chk-activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Recurso activo en catálogo (disponible para consultas y movimientos)
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <div className="w-full sm:w-auto flex items-center space-x-2">
              {!recursoIdToEdit && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving || loadingInitial}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar y agregar otro</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || loadingInitial}
                className="flex-1 sm:flex-none px-5 py-2 bg-[#1C3177] text-white rounded-xl text-xs font-bold hover:bg-[#2B4BA0] disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{recursoIdToEdit ? 'Actualizar recurso' : 'Guardar recurso'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
