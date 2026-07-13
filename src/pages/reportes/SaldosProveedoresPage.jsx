import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/grid/DataGrid';
import { PageLoader, ErrorState } from '../../components/ui';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

export const SaldosProveedoresPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useFetch('/costos/cuenta-corriente/saldos');

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const proveedores = data?.proveedores || [];

  const columns = [
    { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
    { accessorKey: 'saldo', header: 'Saldo Pendiente', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/reportes/saldos-proveedores/${row.original.proveedor_id}`)}>
          Ver detalle
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Saldos de Proveedores</div>
          <div className="page-subtitle">Proveedores con saldo pendiente en cuenta corriente</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-label">Total Pendiente</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(data?.total_pendiente)}</div>
        </div>
      </div>

      <DataGrid
        columns={columns}
        data={proveedores}
        loading={loading}
        title="Saldos de Proveedores"
        emptyText="No hay proveedores con saldo pendiente"
      />
    </div>
  );
};
