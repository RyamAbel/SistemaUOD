'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Truck,
  PackageCheck,
  Clock,
  FileText,
  Printer,
  X,
  ChevronDown,
  ArrowDownToLine,
  Sparkles,
  RefreshCw,
  Eye,
  Building2,
  User,
  DollarSign,
  AlertTriangle,
  Send,
  Ban
} from 'lucide-react';
import {
  apiClient,
  OrdenCompraDto,
  OrdenCompraLineaDto,
  CrearOrdenCompraDto,
  CrearOrdenCompraLineaDto,
  RecepcionCompraDto,
  RecepcionLineaDto,
  SugerenciaOrdenStockBajoDto,
  ProveedorDto,
  RecursoDto,
  UbicacionDto
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export const PurchaseOrdersView: React.FC = () => {
  const { rol, user } = useAuth();
  const canManage = rol === 'super_admin' || rol === 'admin_inventario' || rol === 'gestor_inventario';
  const canReceive = canManage || rol === 'encargado_almacen' || rol === 'operador_almacen';

  // Data states
  const [ordenes, setOrdenes] = useState<OrdenCompraDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('todos');

  // Supporting catalog data
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [recursos, setRecursos] = useState<RecursoDto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);

  // Modals
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalRecepcionOpen, setModalRecepcionOpen] = useState(false);
  const [modalSugerenciasOpen, setModalSugerenciasOpen] = useState(false);

  // Selected Order
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompraDto | null>(null);

  // New Order Form State
  const [nuevaOrden, setNuevaOrden] = useState<{
    proveedorId: string;
    fechaEntregaEstimada: string;
    observaciones: string;
    lineas: { recursoId: string; cantidadSolicitada: number; precioUnitarioEstimado: number }[];
  }>({
    proveedorId: '',
    fechaEntregaEstimada: '',
    observaciones: '',
    lineas: []
  });

  // Goods Receipt Form State
  const [recepcionForm, setRecepcionForm] = useState<{
    ubicacionRecepcionId: string;
    conduceOReferencia: string;
    observaciones: string;
    lineas: { lineaId: string; cantidadRecibida: number; numeroLote: string; fechaVencimiento: string }[];
  }>({
    ubicacionRecepcionId: '',
    conduceOReferencia: '',
    observaciones: '',
    lineas: []
  });

  // Low stock suggestions
  const [sugerencias, setSugerencias] = useState<SugerenciaOrdenStockBajoDto[]>([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);

  // Status and feedback
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  // Load orders
  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.listarOrdenesCompra({
        busqueda: searchTerm || undefined,
        estado: estadoFiltro === 'todos' ? undefined : estadoFiltro,
        proveedorId: proveedorFiltro === 'todos' ? undefined : proveedorFiltro,
        page,
        pageSize
      });
      setOrdenes(res.items || []);
      setTotalItems(res.totalCount || 0);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar órdenes de compra', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load auxiliary data
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [provRes, recRes, ubiRes] = await Promise.all([
          apiClient.listarProveedores({ pageSize: 100, soloActivos: true }),
          apiClient.listarRecursos({ activo: true, pageSize: 200 }),
          apiClient.listarUbicaciones()
        ]);
        setProveedores(provRes.items || []);
        setRecursos(recRes.items || []);
        setUbicaciones(ubiRes.items || []);
      } catch (err) {
        console.error('Error cargando catálogos para compras:', err);
      }
    };
    cargarCatalogos();
  }, []);

  // Reload when filters change
  useEffect(() => {
    cargarOrdenes();
  }, [page, estadoFiltro, proveedorFiltro]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    cargarOrdenes();
  };

  // Open low stock suggestions
  const abrirSugerencias = async () => {
    setLoadingSugerencias(true);
    setModalSugerenciasOpen(true);
    try {
      const res = await apiClient.obtenerSugerenciasStockBajo();
      setSugerencias(res || []);
    } catch (err: any) {
      showToast(err.message || 'Error al obtener sugerencias de stock bajo', 'error');
    } finally {
      setLoadingSugerencias(false);
    }
  };

  // Convert suggestions to draft order
  const aplicarSugerenciasAOrden = (sugs: SugerenciaOrdenStockBajoDto[]) => {
    if (sugs.length === 0) return;
    const primerProveedor = sugs[0].proveedorSugeridoId || '';
    setNuevaOrden({
      proveedorId: primerProveedor,
      fechaEntregaEstimada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      observaciones: 'Orden generada a partir de la regla institucional de stock bajo RF-12',
      lineas: sugs.map((s) => ({
        recursoId: s.recursoId,
        cantidadSolicitada: s.cantidadSugerida,
        precioUnitarioEstimado: s.costoUnitarioEstimado
      }))
    });
    setModalSugerenciasOpen(false);
    setModalCrearOpen(true);
  };

  // Add line to new order
  const agregarLineaNuevaOrden = () => {
    if (recursos.length === 0) return;
    const defaultRecurso = recursos[0];
    setNuevaOrden((prev) => ({
      ...prev,
      lineas: [
        ...prev.lineas,
        {
          recursoId: defaultRecurso.id,
          cantidadSolicitada: 10,
          precioUnitarioEstimado: defaultRecurso.costoEstimado || 0
        }
      ]
    }));
  };

  const eliminarLineaNuevaOrden = (index: number) => {
    setNuevaOrden((prev) => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index)
    }));
  };

  const actualizarLineaNuevaOrden = (index: number, campo: string, valor: any) => {
    setNuevaOrden((prev) => {
      const lineas = [...prev.lineas];
      const linea = { ...lineas[index], [campo]: valor };
      if (campo === 'recursoId') {
        const rec = recursos.find((r) => r.id === valor);
        if (rec) {
          linea.precioUnitarioEstimado = rec.costoEstimado || 0;
        }
      }
      lineas[index] = linea;
      return { ...prev, lineas };
    });
  };

  // Submit new order
  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaOrden.proveedorId) {
      showToast('Seleccione un proveedor para la orden', 'error');
      return;
    }
    if (nuevaOrden.lineas.length === 0) {
      showToast('Agregue al menos un insumo a la orden', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const dto: CrearOrdenCompraDto = {
        proveedorId: nuevaOrden.proveedorId,
        fechaEntregaEstimada: nuevaOrden.fechaEntregaEstimada || undefined,
        observaciones: nuevaOrden.observaciones || undefined,
        lineas: nuevaOrden.lineas.map((l) => ({
          recursoId: l.recursoId,
          cantidadSolicitada: Number(l.cantidadSolicitada),
          precioUnitarioEstimado: Number(l.precioUnitarioEstimado)
        }))
      };

      const creada = await apiClient.crearOrdenCompra(dto);
      showToast(`Orden ${creada.numeroOrden} creada en estado borrador`);
      setModalCrearOpen(false);
      setNuevaOrden({ proveedorId: '', fechaEntregaEstimada: '', observaciones: '', lineas: [] });
      await cargarOrdenes();
    } catch (err: any) {
      showToast(err.message || 'Error al crear orden de compra', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Change order status
  const handleCambiarEstado = async (id: string, nuevoEstado: 'aprobada' | 'enviada' | 'cancelada') => {
    try {
      const res = await apiClient.cambiarEstadoOrdenCompra(id, { estado: nuevoEstado });
      showToast(`Orden ${res.numeroOrden} transicionada a ${nuevoEstado}`);
      if (selectedOrden?.id === id) {
        setSelectedOrden(res);
      }
      await cargarOrdenes();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar estado de la orden', 'error');
    }
  };

  // Open goods receipt modal
  const abrirModalRecepcion = (orden: OrdenCompraDto) => {
    setSelectedOrden(orden);
    // Filtrar líneas con saldo pendiente
    const lineasPendientes = orden.lineas.filter((l) => l.cantidadPendiente > 0);
    const almacenDefault = ubicaciones.find((u) => u.codigo.includes('ALM') || u.tipo === 'almacen') || ubicaciones[0];

    setRecepcionForm({
      ubicacionRecepcionId: almacenDefault?.id || '',
      conduceOReferencia: '',
      observaciones: '',
      lineas: lineasPendientes.map((l) => ({
        lineaId: l.id,
        cantidadRecibida: l.cantidadPendiente, // Sugerir restante por default
        numeroLote: '',
        fechaVencimiento: ''
      }))
    });
    setModalRecepcionOpen(true);
  };

  // Submit goods receipt
  const handleGuardarRecepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrden) return;
    if (!recepcionForm.ubicacionRecepcionId) {
      showToast('Seleccione la ubicación destino para almacenar los insumos', 'error');
      return;
    }

    const lineasConCantidad = recepcionForm.lineas.filter((l) => Number(l.cantidadRecibida) > 0);
    if (lineasConCantidad.length === 0) {
      showToast('Debe ingresar cantidad recibida mayor a cero en al menos una línea', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const dto: RecepcionCompraDto = {
        ubicacionRecepcionId: recepcionForm.ubicacionRecepcionId,
        conduceOReferencia: recepcionForm.conduceOReferencia || undefined,
        observaciones: recepcionForm.observaciones || undefined,
        lineas: lineasConCantidad.map((l) => ({
          lineaId: l.lineaId,
          cantidadRecibida: Number(l.cantidadRecibida),
          numeroLote: l.numeroLote ? l.numeroLote.trim() : undefined,
          fechaVencimiento: l.fechaVencimiento || undefined
        }))
      };

      const res = await apiClient.recibirMercanciaOrdenCompra(selectedOrden.id, dto);
      showToast(`Recepción registrada con éxito. Estado: ${res.estado}. Inventario actualizado.`);
      setModalRecepcionOpen(false);
      setSelectedOrden(res);
      await cargarOrdenes();
    } catch (err: any) {
      showToast(err.message || 'Error al registrar recepción de mercancía', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const totalBorrador = ordenes.filter((o) => o.estado === 'borrador').length;
  const totalTransito = ordenes.filter((o) => o.estado === 'aprobada' || o.estado === 'enviada').length;
  const totalParcial = ordenes.filter((o) => o.estado === 'recibida_parcial').length;
  const totalCompletadas = ordenes.filter((o) => o.estado === 'recibida_total').length;
  const totalMontoEstimado = ordenes.reduce((acc, o) => acc + (o.totalEstimado || 0), 0);

  // Status badge helper
  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Borrador
          </span>
        );
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1C3177] border border-blue-200">
            <CheckCircle2 className="h-3 w-3 text-[#1C3177]" />
            Aprobada
          </span>
        );
      case 'enviada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
            <Send className="h-3 w-3 text-indigo-600" />
            Enviada a Proveedor
          </span>
        );
      case 'recibida_parcial':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            <Truck className="h-3 w-3 text-amber-600" />
            Recepción Parcial
          </span>
        );
      case 'recibida_total':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            <PackageCheck className="h-3 w-3 text-[#3DAA5C]" />
            Completada (100%)
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-200">
            <Ban className="h-3 w-3 text-rose-500" />
            Cancelada
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{estado}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Por Aprobar</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-800">{totalBorrador}</div>
          <span className="text-[10px] text-slate-400 font-medium">Borradores registrados</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[#1C3177] mb-1">
            <span className="text-[11px] font-bold">En Tránsito</span>
            <Truck className="h-4 w-4 text-[#1C3177]" />
          </div>
          <div className="text-xl font-black text-[#1C3177]">{totalTransito}</div>
          <span className="text-[10px] text-blue-600 font-medium">Aprobadas / Enviadas</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold">Recep. Parcial</span>
            <PackageCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-800">{totalParcial}</div>
          <span className="text-[10px] text-amber-600 font-medium">Entregas pendientes</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold">Completadas</span>
            <CheckCircle2 className="h-4 w-4 text-[#3DAA5C]" />
          </div>
          <div className="text-xl font-black text-emerald-800">{totalCompletadas}</div>
          <span className="text-[10px] text-emerald-600 font-medium">100% recibidas</span>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">Total Comprometido</span>
            <DollarSign className="h-4 w-4 text-[#3DAA5C]" />
          </div>
          <div className="text-xl font-black text-slate-900">
            DOP ${totalMontoEstimado.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">En adquisiciones</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por OC, proveedor o insumo..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1C3177] focus:bg-white focus:ring-2 focus:ring-[#1C3177]/10"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1C3177]"
          >
            <option value="todos">Todos los Estados</option>
            <option value="borrador">Borrador</option>
            <option value="aprobada">Aprobada</option>
            <option value="enviada">Enviada</option>
            <option value="recibida_parcial">Recepción Parcial</option>
            <option value="recibida_total">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Supplier selector */}
          <select
            value={proveedorFiltro}
            onChange={(e) => {
              setProveedorFiltro(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1C3177] max-w-[180px] truncate"
          >
            <option value="todos">Todos los Proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombreComercial}
              </option>
            ))}
          </select>

          {/* Low stock suggestions button */}
          <button
            onClick={abrirSugerencias}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all shadow-xs"
            title="Sugerir compras según fórmula de stock bajo RF-12"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Sugerencias RF-12</span>
          </button>

          {/* New order button */}
          {canManage && (
            <button
              onClick={() => {
                setNuevaOrden({
                  proveedorId: proveedores[0]?.id || '',
                  fechaEntregaEstimada: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  observaciones: '',
                  lineas: [
                    {
                      recursoId: recursos[0]?.id || '',
                      cantidadSolicitada: 10,
                      precioUnitarioEstimado: recursos[0]?.costoEstimado || 0
                    }
                  ]
                });
                setModalCrearOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#1C3177] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-all shadow-sm shadow-[#1C3177]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva Orden</span>
            </button>
          )}

          <button
            onClick={cargarOrdenes}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-all"
            title="Refrescar órdenes"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Número OC</th>
                <th className="px-4 py-3.5">Proveedor</th>
                <th className="px-4 py-3.5">Fecha Emisión</th>
                <th className="px-4 py-3.5">Unidades (Rec/Sol)</th>
                <th className="px-4 py-3.5">Total Estimado</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#1C3177]" />
                      <span>Cargando órdenes de compra institucionales...</span>
                    </div>
                  </td>
                </tr>
              ) : ordenes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold">No se encontraron órdenes de compra registradas.</p>
                      <p className="text-[11px]">Crea una nueva orden o genera sugerencias desde stock bajo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ordenes.map((orden) => (
                  <tr key={orden.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#1C3177]">
                      {orden.numeroOrden}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{orden.proveedorNombre}</div>
                      {orden.proveedorRnc && (
                        <div className="text-[10px] text-slate-400 font-mono">RNC: {orden.proveedorRnc}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{orden.fechaEmision}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {orden.totalUnidadesRecibidas} / {orden.totalUnidadesSolicitadas}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              orden.porcentajeRecepcion >= 100
                                ? 'bg-[#3DAA5C]'
                                : orden.porcentajeRecepcion > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min(100, orden.porcentajeRecepcion)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{orden.porcentajeRecepcion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      DOP ${orden.totalEstimado?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">{renderEstadoBadge(orden.estado)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrden(orden);
                            setModalDetalleOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Recepción de mercancía */}
                        {canReceive &&
                          (orden.estado === 'aprobada' ||
                            orden.estado === 'enviada' ||
                            orden.estado === 'recibida_parcial') && (
                            <button
                              onClick={() => abrirModalRecepcion(orden)}
                              className="rounded-lg p-1.5 text-[#3DAA5C] hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-bold flex items-center gap-1 text-[11px]"
                              title="Registrar recepción de mercancía"
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                              <span className="hidden lg:inline">Recibir</span>
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalle de Orden & Vista Imprimible */}
      {modalDetalleOpen && selectedOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#1C3177]">
                    {selectedOrden.numeroOrden}
                  </span>
                  {renderEstadoBadge(selectedOrden.estado)}
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Orden de Compra Institucional
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setModalDetalleOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Datos del Proveedor
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedOrden.proveedorNombre}</p>
                {selectedOrden.proveedorRnc && (
                  <p className="text-slate-500 font-mono text-[11px]">RNC: {selectedOrden.proveedorRnc}</p>
                )}
                {selectedOrden.proveedorContacto && (
                  <p className="text-slate-600 mt-1">Contacto: {selectedOrden.proveedorContacto}</p>
                )}
                {selectedOrden.proveedorTelefono && (
                  <p className="text-slate-500 text-[11px]">Tel: {selectedOrden.proveedorTelefono}</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Detalles de Adquisición
                </span>
                <p className="text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-700">Fecha Emisión:</span> {selectedOrden.fechaEmision}
                </p>
                {selectedOrden.fechaEntregaEstimada && (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-700">Entrega Estimada:</span>{' '}
                    {selectedOrden.fechaEntregaEstimada}
                  </p>
                )}
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-700">Solicitante:</span>{' '}
                  {selectedOrden.solicitanteNombre}
                </p>
                {selectedOrden.observaciones && (
                  <p className="text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-200">
                    "{selectedOrden.observaciones}"
                  </p>
                )}
              </div>
            </div>

            {/* Lines Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Insumos y Líneas de la Orden
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Insumo / Recurso</th>
                      <th className="px-3.5 py-2.5 text-center">Pedido</th>
                      <th className="px-3.5 py-2.5 text-center">Recibido</th>
                      <th className="px-3.5 py-2.5 text-center">Pendiente</th>
                      <th className="px-3.5 py-2.5 text-right">Precio Unit.</th>
                      <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrden.lineas.map((linea) => (
                      <tr key={linea.id}>
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-slate-800">{linea.recursoNombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{linea.recursoSku}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-700">
                          {linea.cantidadSolicitada} {linea.unidadMedida}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-emerald-700">
                          {linea.cantidadRecibida}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-amber-700">
                          {linea.cantidadPendiente}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">
                          DOP ${linea.precioUnitarioEstimado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          DOP ${linea.subtotalEstimado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold text-xs border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="px-3.5 py-2.5 text-right text-slate-600">
                        Total Estimado de la Orden:
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-[#1C3177] text-sm">
                        DOP ${selectedOrden.totalEstimado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Workflow Action Bar */}
            {canManage && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {selectedOrden.estado === 'borrador' && (
                    <button
                      onClick={() => handleCambiarEstado(selectedOrden.id, 'aprobada')}
                      className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aprobar Orden</span>
                    </button>
                  )}

                  {selectedOrden.estado === 'aprobada' && (
                    <button
                      onClick={() => handleCambiarEstado(selectedOrden.id, 'enviada')}
                      className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                    >
                      <Send className="h-4 w-4" />
                      <span>Marcar como Enviada al Proveedor</span>
                    </button>
                  )}

                  {(selectedOrden.estado === 'borrador' ||
                    selectedOrden.estado === 'aprobada' ||
                    selectedOrden.estado === 'enviada') &&
                    selectedOrden.totalUnidadesRecibidas === 0 && (
                      <button
                        onClick={() => handleCambiarEstado(selectedOrden.id, 'cancelada')}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        Cancelar Orden
                      </button>
                    )}
                </div>

                {canReceive &&
                  (selectedOrden.estado === 'aprobada' ||
                    selectedOrden.estado === 'enviada' ||
                    selectedOrden.estado === 'recibida_parcial') && (
                    <button
                      onClick={() => {
                        setModalDetalleOpen(false);
                        abrirModalRecepcion(selectedOrden);
                      }}
                      className="rounded-xl bg-[#3DAA5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-all flex items-center gap-1.5 shadow-sm shadow-[#3DAA5C]/20"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      <span>Recibir Mercancía en Almacén</span>
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Recepción de Mercancía en Almacén */}
      {modalRecepcionOpen && selectedOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Operación de Almacén Transaccional
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Recepción de Mercancía – {selectedOrden.numeroOrden}
                </h3>
                <p className="text-xs text-slate-500">
                  Proveedor: <span className="font-semibold text-slate-800">{selectedOrden.proveedorNombre}</span>
                </p>
              </div>
              <button
                onClick={() => setModalRecepcionOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarRecepcion} className="space-y-4 text-xs">
              {/* Warehouse destination & Delivery reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ubicación Destino de Recepción *
                  </label>
                  <select
                    value={recepcionForm.ubicacionRecepcionId}
                    onChange={(e) =>
                      setRecepcionForm((prev) => ({ ...prev, ubicacionRecepcionId: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  >
                    <option value="">Seleccione almacén / clínica...</option>
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Conduce / No. Factura Proveedor
                  </label>
                  <input
                    type="text"
                    value={recepcionForm.conduceOReferencia}
                    onChange={(e) =>
                      setRecepcionForm((prev) => ({ ...prev, conduceOReferencia: e.target.value }))
                    }
                    placeholder="Ej. COND-2026-8941"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  />
                </div>
              </div>

              {/* Lines Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  Insumos a Ingresar al Inventario
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {recepcionForm.lineas.map((lineaRec, idx) => {
                    const lineaOrden = selectedOrden.lineas.find((l) => l.id === lineaRec.lineaId);
                    if (!lineaOrden) return null;

                    return (
                      <div
                        key={lineaRec.lineaId}
                        className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{lineaOrden.recursoNombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">
                              {lineaOrden.recursoSku}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Pendiente:{' '}
                            <span className="font-bold text-amber-700">{lineaOrden.cantidadPendiente}</span> /{' '}
                            {lineaOrden.cantidadSolicitada}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Cant. a Recibir
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={lineaOrden.cantidadPendiente}
                              value={lineaRec.cantidadRecibida}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setRecepcionForm((prev) => {
                                  const lns = [...prev.lineas];
                                  lns[idx].cantidadRecibida = val;
                                  return { ...prev, lineas: lns };
                                });
                              }}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Lote (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Lote fabricante"
                              value={lineaRec.numeroLote}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecepcionForm((prev) => {
                                  const lns = [...prev.lineas];
                                  lns[idx].numeroLote = val;
                                  return { ...prev, lineas: lns };
                                });
                              }}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Vencimiento (Opcional)
                            </label>
                            <input
                              type="date"
                              value={lineaRec.fechaVencimiento}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRecepcionForm((prev) => {
                                  const lns = [...prev.lineas];
                                  lns[idx].fechaVencimiento = val;
                                  return { ...prev, lineas: lns };
                                });
                              }}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observaciones de la Recepción
                </label>
                <textarea
                  value={recepcionForm.observaciones}
                  onChange={(e) => setRecepcionForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Detalles del estado de empaque, transporte o conformidad..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalRecepcionOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#3DAA5C] px-5 py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-all flex items-center gap-1.5 shadow-sm shadow-[#3DAA5C]/20"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Confirmar e Ingresar a Inventario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Orden de Compra */}
      {modalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Nueva Orden de Compra</h3>
                <p className="text-xs text-slate-500">
                  Emisión de solicitud de adquisición a proveedor institucional (sin pagos ni facturas).
                </p>
              </div>
              <button
                onClick={() => setModalCrearOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOrden} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Proveedor Suministrador *
                  </label>
                  <select
                    value={nuevaOrden.proveedorId}
                    onChange={(e) => setNuevaOrden((prev) => ({ ...prev, proveedorId: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  >
                    <option value="">Seleccione proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombreComercial} {p.rnc ? `(RNC: ${p.rnc})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fecha Entrega Estimada
                  </label>
                  <input
                    type="date"
                    value={nuevaOrden.fechaEntregaEstimada}
                    onChange={(e) =>
                      setNuevaOrden((prev) => ({ ...prev, fechaEntregaEstimada: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                  />
                </div>
              </div>

              {/* Insumos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Líneas de Insumos y Materiales *
                  </label>
                  <button
                    type="button"
                    onClick={agregarLineaNuevaOrden}
                    className="text-[11px] font-bold text-[#1C3177] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Agregar Insumo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {nuevaOrden.lineas.map((linea, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <div className="flex-1">
                        <select
                          value={linea.recursoId}
                          onChange={(e) => actualizarLineaNuevaOrden(idx, 'recursoId', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#1C3177]"
                        >
                          {recursos.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre} ({r.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          value={linea.cantidadSolicitada}
                          onChange={(e) =>
                            actualizarLineaNuevaOrden(idx, 'cantidadSolicitada', Number(e.target.value))
                          }
                          placeholder="Cant."
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={linea.precioUnitarioEstimado}
                          onChange={(e) =>
                            actualizarLineaNuevaOrden(idx, 'precioUnitarioEstimado', Number(e.target.value))
                          }
                          placeholder="Precio unit."
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 text-right"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-slate-700 text-xs">
                        DOP ${(linea.cantidadSolicitada * linea.precioUnitarioEstimado).toLocaleString('es-DO', {
                          minimumFractionDigits: 0
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarLineaNuevaOrden(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  value={nuevaOrden.observaciones}
                  onChange={(e) => setNuevaOrden((prev) => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Justificación institucional, clínica requirente..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1C3177]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#1C3177] px-5 py-2 text-xs font-bold text-white hover:bg-[#2B4BA0] transition-all flex items-center gap-1.5 shadow-sm shadow-[#1C3177]/20"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Guardar Borrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sugerencias de Reorden desde Stock Bajo (RF-12) */}
      {modalSugerenciasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <h3 className="text-lg font-black text-slate-900">
                    Sugerencias de Reorden (Regla RF-12)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Insumos con existencia física actual menor o igual al punto de reorden institucional.
                </p>
              </div>
              <button
                onClick={() => setModalSugerenciasOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingSugerencias ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-2" />
                <p className="text-xs">Evaluando inventario y puntos de reorden...</p>
              </div>
            ) : sugerencias.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-[#3DAA5C] mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">Todo el catálogo cuenta con existencias óptimas</p>
                <p className="text-xs text-slate-500">No hay insumos por debajo del punto de reorden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {sugerencias.map((sug) => (
                    <div
                      key={sug.recursoId}
                      className="p-3 rounded-xl border border-slate-200 bg-amber-50/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{sug.recursoNombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sug.recursoSku} • {sug.categoriaNombre}
                        </div>
                        {sug.proveedorSugeridoNombre && (
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Proveedor habitual: <span className="font-semibold">{sug.proveedorSugeridoNombre}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-rose-600 font-bold">
                            Stock: {sug.stockActual} (Mín: {sug.stockMinimo})
                          </span>
                          <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                            Pedir: +{sug.cantidadSugerida}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Est: DOP ${sug.subtotalEstimado.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    {sugerencias.length} insumos detectados con necesidad de abastecimiento
                  </span>
                  <button
                    onClick={() => aplicarSugerenciasAOrden(sugerencias)}
                    className="rounded-xl bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear Orden con estos Insumos</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
