'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  FolderTree,
  AlertCircle,
  Edit2,
  RefreshCw,
  X,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import {
  apiClient,
  ProveedorDto,
  CrearProveedorDto,
  CategoriaDto,
  CrearCategoriaDto
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { PurchaseOrdersView } from './PurchaseOrdersView';

export const SuppliersView: React.FC = () => {
  const { rol } = useAuth();
  const canEdit = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';

  const [activeSubTab, setActiveSubTab] = useState<'proveedores' | 'categorias' | 'ordenes'>('proveedores');
  const [searchTerm, setSearchTerm] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  // Estados de Proveedores
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);
  const [savingProveedor, setSavingProveedor] = useState(false);
  const [errorProveedor, setErrorProveedor] = useState<string | null>(null);
  const [nuevoProveedor, setNuevoProveedor] = useState<CrearProveedorDto>({
    rnc: '',
    nombreComercial: '',
    razonSocial: '',
    contactoNombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    plazoCreditoDias: 30,
    activo: true
  });

  // Estados de Categorías
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [savingCategoria, setSavingCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState<CrearCategoriaDto>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoriaPadreId: null,
    activa: true
  });

  // Toast de retroalimentación
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar Proveedores
  const cargarProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const res = await apiClient.listarProveedores({
        pageIndex: 1,
        pageSize: 50,
        search: searchTerm || undefined,
        soloActivos: soloActivos ? true : undefined
      });
      setProveedores(res.items);
    } catch (err: any) {
      showToast(err.message || 'Error al obtener proveedores', 'error');
    } finally {
      setLoadingProveedores(false);
    }
  };

  // Cargar Categorías
  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const data = await apiClient.listarCategorias();
      setCategorias(data);
    } catch (err: any) {
      showToast(err.message || 'Error al obtener categorías', 'error');
    } finally {
      setLoadingCategorias(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'proveedores') {
      cargarProveedores();
    } else {
      cargarCategorias();
    }
  }, [activeSubTab, soloActivos]);

  // Manejo de Creación de Proveedor
  const handleGuardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProveedor(null);

    // Validación formato RNC dominicano (9 u 11 dígitos)
    const rncLimpio = nuevoProveedor.rnc.trim().replace(/-/g, '');
    if (!/^[0-9]{9,11}$/.test(rncLimpio)) {
      setErrorProveedor('El RNC dominicano debe contener entre 9 y 11 dígitos numéricos sin letras ni símbolos.');
      return;
    }

    if (!nuevoProveedor.nombreComercial.trim()) {
      setErrorProveedor('El nombre comercial del proveedor es obligatorio.');
      return;
    }

    setSavingProveedor(true);
    try {
      await apiClient.crearProveedor({
        ...nuevoProveedor,
        rnc: rncLimpio
      });
      showToast('Proveedor registrado y auditado exitosamente');
      setModalProveedorOpen(false);
      setNuevoProveedor({
        rnc: '',
        nombreComercial: '',
        razonSocial: '',
        contactoNombre: '',
        telefono: '',
        correo: '',
        direccion: '',
        plazoCreditoDias: 30,
        activo: true
      });
      await cargarProveedores();
    } catch (err: any) {
      setErrorProveedor(err.message || 'Error al registrar el proveedor');
    } finally {
      setSavingProveedor(false);
    }
  };

  // Manejo de Creación de Categoría
  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCategoria(null);

    if (!nuevaCategoria.codigo.trim()) {
      setErrorCategoria('El código de la categoría es obligatorio.');
      return;
    }

    if (!nuevaCategoria.nombre.trim()) {
      setErrorCategoria('El nombre de la categoría es obligatorio.');
      return;
    }

    setSavingCategoria(true);
    try {
      await apiClient.crearCategoria(nuevaCategoria);
      showToast('Categoría creada exitosamente');
      setModalCategoriaOpen(false);
      setNuevaCategoria({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoriaPadreId: null,
        activa: true
      });
      await cargarCategorias();
    } catch (err: any) {
      setErrorCategoria(err.message || 'Error al crear la categoría');
    } finally {
      setSavingCategoria(false);
    }
  };

  // Cambiar estado activo de proveedor
  const toggleEstadoProveedor = async (id: string, estadoActual: boolean) => {
    try {
      await apiClient.cambiarEstadoProveedor(id, !estadoActual);
      showToast(`Proveedor ${!estadoActual ? 'activado' : 'desactivado'} con éxito`);
      await cargarProveedores();
    } catch (err: any) {
      showToast(err.message || 'No se pudo cambiar el estado del proveedor', 'error');
    }
  };

  // Cambiar estado activo de categoría
  const toggleEstadoCategoria = async (id: string, estadoActual: boolean) => {
    try {
      await apiClient.cambiarEstadoCategoria(id, !estadoActual);
      showToast(`Categoría ${!estadoActual ? 'activada' : 'desactivada'} con éxito`);
      await cargarCategorias();
    } catch (err: any) {
      showToast(err.message || 'No se pudo cambiar el estado de la categoría', 'error');
    }
  };

  // Filtrado de categorías en cliente
  const categoriasFiltradas = categorias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl transition-all ${
            toast.tipo === 'success' ? 'bg-[#3DAA5C]' : 'bg-rose-600'
          }`}
        >
          {toast.tipo === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1C3177] uppercase tracking-wider border border-blue-200">
              Gestión Maestra UOD
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Proveedores y Clasificación del Catálogo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mantenimiento de suplidores institucionales (RNC Dominicano) y taxonomía jerárquica de recursos.
          </p>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('proveedores')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'proveedores'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Proveedores
          </button>
          <button
            onClick={() => setActiveSubTab('categorias')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'categorias'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Categorías
          </button>
          <button
            onClick={() => setActiveSubTab('ordenes')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'ordenes'
                ? 'bg-white text-[#1C3177] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Órdenes & Recepción
          </button>
        </div>
      </div>

      {/* Action Bar (Search & New Button) - Only for Proveedores y Categorías */}
      {activeSubTab !== 'ordenes' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeSubTab === 'proveedores'
                    ? 'Buscar por RNC, nombre comercial o contacto...'
                    : 'Buscar por código o nombre de categoría...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1C3177] focus:ring-2 focus:ring-[#1C3177]/10"
              />
            </div>
            <button
              onClick={() => (activeSubTab === 'proveedores' ? cargarProveedores() : cargarCategorias())}
              title="Recargar datos"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'proveedores' && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-3 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={soloActivos}
                  onChange={(e) => setSoloActivos(e.target.checked)}
                  className="rounded border-slate-300 text-[#1C3177] focus:ring-[#1C3177]"
                />
                Solo activos
              </label>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  if (activeSubTab === 'proveedores') {
                    setErrorProveedor(null);
                    setModalProveedorOpen(true);
                  } else {
                    setErrorCategoria(null);
                    setModalCategoriaOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-[#1C3177] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2B4BA0] transition-colors"
              >
                <Plus className="h-4 w-4" />
                {activeSubTab === 'proveedores' ? 'Nuevo Proveedor' : 'Nueva Categoría'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTENT: TAB PROVEEDORES */}
      {activeSubTab === 'proveedores' && (
        <div>
          {loadingProveedores ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-md w-2/3" />
                </div>
              ))}
            </div>
          ) : proveedores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No se encontraron proveedores</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay suplidores registrados que coincidan con los criterios de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-xs hover:border-[#1C3177]/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{p.nombreComercial}</h4>
                        {p.razonSocial && p.razonSocial !== p.nombreComercial && (
                          <span className="text-[11px] text-slate-500 block truncate">{p.razonSocial}</span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          p.activo
                            ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">RNC / Cédula:</span>
                        <span className="font-mono font-bold text-[#1C3177]">{p.rnc}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Plazo de Crédito:</span>
                        <span className="font-semibold text-slate-800">{p.plazoCreditoDias} días</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      {p.contactoNombre && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Contacto:</span>
                          <span className="font-medium text-slate-700">{p.contactoNombre}</span>
                        </div>
                      )}
                      {p.telefono && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{p.telefono}</span>
                        </div>
                      )}
                      {p.correo && (
                        <div className="flex items-center gap-2 text-[11px] truncate">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.correo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.activosSuministradosCount} activos suministrados
                      </span>
                      <button
                        onClick={() => toggleEstadoProveedor(p.id, p.activo)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                          p.activo
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-[#2D8246] hover:bg-emerald-50'
                        }`}
                      >
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENT: TAB CATEGORÍAS */}
      {activeSubTab === 'categorias' && (
        <div>
          {loadingCategorias ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <FolderTree className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No se encontraron categorías</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay categorías registradas en el catálogo con ese término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nombre de Categoría</th>
                    <th className="py-3 px-4">Categoría Padre</th>
                    <th className="py-3 px-4 text-center">Subcategorías</th>
                    <th className="py-3 px-4 text-center">Recursos</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    {canEdit && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {categoriasFiltradas.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1C3177]">{cat.codigo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cat.nombre}</div>
                        {cat.descripcion && (
                          <div className="text-[11px] text-slate-500 truncate max-w-md">{cat.descripcion}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {cat.categoriaPadreNombre ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {cat.categoriaPadreNombre}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Principal</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {cat.subcategoriasCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#1C3177]">
                        {cat.recursosCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            cat.activa
                              ? 'bg-emerald-50 text-[#2D8246] border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleEstadoCategoria(cat.id, cat.activa)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                              cat.activa
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-[#2D8246] hover:bg-emerald-50'
                            }`}
                          >
                            {cat.activa ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: TAB ÓRDENES DE COMPRA & RECEPCIÓN */}
      {activeSubTab === 'ordenes' && <PurchaseOrdersView />}

      {/* MODAL: NUEVO PROVEEDOR */}
      {modalProveedorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1C3177]" />
                <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Proveedor</h3>
              </div>
              <button
                onClick={() => setModalProveedorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorProveedor && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorProveedor}</span>
              </div>
            )}

            <form onSubmit={handleGuardarProveedor} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    RNC / Cédula <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="101000001 (9 u 11 dígitos)"
                    value={nuevoProveedor.rnc}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, rnc: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-[#1C3177] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Formato dominicano sin guiones</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Plazo de Crédito (Días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={nuevoProveedor.plazoCreditoDias}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, plazoCreditoDias: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre Comercial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Dental Dominicana SRL"
                  value={nuevoProveedor.nombreComercial}
                  onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombreComercial: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Razón Social (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Razón legal si difiere del comercial"
                  value={nuevoProveedor.razonSocial || ''}
                  onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, razonSocial: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Lic. Rafael Ramos"
                    value={nuevoProveedor.contactoNombre || ''}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contactoNombre: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="809-555-1234"
                    value={nuevoProveedor.telefono || ''}
                    onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ventas@suplidordental.com.do"
                  value={nuevoProveedor.correo || ''}
                  onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, correo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Dirección Física
                </label>
                <input
                  type="text"
                  placeholder="Av. 27 de Febrero, Santo Domingo"
                  value={nuevoProveedor.direccion || ''}
                  onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalProveedorOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProveedor}
                  className="rounded-xl bg-[#1C3177] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-colors disabled:opacity-50"
                >
                  {savingProveedor ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA CATEGORÍA */}
      {modalCategoriaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-[#1C3177]" />
                <h3 className="text-base font-bold text-slate-900">Crear Categoría de Catálogo</h3>
              </div>
              <button
                onClick={() => setModalCategoriaOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorCategoria && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorCategoria}</span>
              </div>
            )}

            <form onSubmit={handleGuardarCategoria} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Categoría Padre (Opcional)
                </label>
                <select
                  value={nuevaCategoria.categoriaPadreId || ''}
                  onChange={(e) =>
                    setNuevaCategoria({
                      ...nuevaCategoria,
                      categoriaPadreId: e.target.value ? e.target.value : null
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                >
                  <option value="">-- Ninguna (Categoría Principal) --</option>
                  {categorias
                    .filter((c) => !c.categoriaPadreId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.codigo} - {cat.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código de Categoría <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CAT-BIO-01"
                  value={nuevaCategoria.codigo}
                  onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, codigo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre de la Categoría <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Biomateriales y Regeneración Ósea"
                  value={nuevaCategoria.nombre}
                  onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve detalle de insumos o equipos agrupados..."
                  value={nuevaCategoria.descripcion || ''}
                  onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#1C3177] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCategoriaOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategoria}
                  className="rounded-xl bg-[#1C3177] px-4 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-colors disabled:opacity-50"
                >
                  {savingCategoria ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
