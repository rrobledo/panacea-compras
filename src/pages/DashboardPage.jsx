import { useState } from 'react';
import { DollarSign, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { KpiCard, DonutChart, GroupedBarChart } from '../components/charts';
import { PageLoader } from '../components/ui';
import { useFetch } from '../hooks';
import { formatCurrencyARS } from '../utils/format';
import { CATEGORIAS_COMPRA } from './compras/constants';
import { ANIOS, MESES } from './reportes/constants';

const porCategoriaToChartData = (rows) => (rows || []).map(r => ({
  name: CATEGORIAS_COMPRA.find(c => c.value === r.categoria)?.label || r.categoria,
  value: r.total,
}));

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');

// Built from local date parts (not toISOString) so the range never slides a
// day in negative-UTC-offset timezones like America/Argentina.
const monthRange = (anio, mes) => ({
  fecha_desde: `${anio}-${pad(mes)}-01`,
  fecha_hasta: `${anio}-${pad(mes)}-${pad(new Date(anio, mes, 0).getDate())}`,
});

export const DashboardPage = () => {
  const [periodo, setPeriodo] = useState({ anio: now.getFullYear(), mes: now.getMonth() + 1 });
  const { anio, mes } = periodo;
  const resumen = useFetch('/costos/cuenta-corriente/resumen', monthRange(anio, mes), [anio, mes]);
  const categoria = useFetch('/costos/get_produccion_by_category', { anio, mes }, [anio, mes]);
  const ventas = useFetch('/costos/get_ventas_por_cliente', { anio, mes }, [anio, mes]);

  const loading = resumen.loading || categoria.loading || ventas.loading;

  const summary = Array.isArray(resumen.data) ? resumen.data[0] : resumen.data;
  const categoriaData = (categoria.data || []).map(r => ({ name: r.categoria, Planeado: r.planeado, Producido: r.producido }));

  // The endpoint returns, per client, both a monthly-total row (plain name)
  // and duplicate per-week breakdown rows (same name with a leading space) —
  // plus TOTAL/SUBTOTAL sentinel rows. Keep only the canonical monthly row
  // per client, or the weekly duplicates double-count every client's total.
  const ventasData = (ventas.data || [])
    .filter(r => r.cliente && r.cliente === r.cliente.trim() && !r.cliente.toUpperCase().includes('TOTAL'))
    .map(r => ({ name: r.cliente, value: r.subtotal ?? 0 }));
  const totalVentasMes = ventasData.reduce((sum, r) => sum + r.value, 0);

  const gastosPorCategoriaData = porCategoriaToChartData(summary?.gastos_por_categoria);
  const pagosPorCategoriaData = porCategoriaToChartData(summary?.pagos_por_categoria);

  const setPeriodoField = (field) => (e) =>
    setPeriodo(p => ({ ...p, [field]: Number(e.target.value) }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Resumen de producción y cuenta corriente de proveedores</div>
        </div>
        <div className="flex gap-3" style={{ flexShrink: 0 }}>
          <div className="form-group" style={{ width: 100 }}>
            <label className="form-label">Año</label>
            <select className="form-select" value={anio} onChange={setPeriodoField('anio')}>
              {ANIOS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ width: 150 }}>
            <label className="form-label">Mes</label>
            <select className="form-select" value={mes} onChange={setPeriodoField('mes')}>
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : <>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KpiCard label="Facturas Pendientes" value={formatCurrencyARS(summary?.total_facturas_pendientes)} icon={AlertCircle} color="#d97706" />
        <KpiCard label="Gastos del Mes" value={formatCurrencyARS(summary?.total_gastos)} icon={DollarSign} color="#dc2626" />
        <KpiCard label="Pagos del Mes" value={formatCurrencyARS(summary?.total_pagos)} icon={Wallet} color="#2563eb" />
        <KpiCard label="Ventas del Mes" value={formatCurrencyARS(totalVentasMes)} icon={TrendingUp} color="#16a34a" />
      </div>

      <div className="grid-2">
        <GroupedBarChart data={categoriaData} keys={['Planeado', 'Producido']} title="Producción por Categoría" />
        <DonutChart data={ventasData} title="Ventas por Cliente" />
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DonutChart data={gastosPorCategoriaData} title="Gastos del Mes por Categoría" />
        <DonutChart data={pagosPorCategoriaData} title="Pagos del Mes por Categoría" />
      </div>
      </>}
    </div>
  );
};
