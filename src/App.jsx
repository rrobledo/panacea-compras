import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { OAuthCallback } from './components/auth/OAuthCallback';
import { DashboardPage } from './pages/DashboardPage';
import { PageLoader } from './components/ui';
import { ProveedoresPage } from './pages/proveedores/ProveedoresPage';
import { ProveedorCreatePage } from './pages/proveedores/ProveedorCreatePage';
import { ProveedorEditPage } from './pages/proveedores/ProveedorEditPage';
import { InsumosPage } from './pages/insumos/InsumosPage';
import { InsumoCreatePage } from './pages/insumos/InsumoCreatePage';
import { InsumoEditPage } from './pages/insumos/InsumoEditPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { ProductoCreatePage } from './pages/productos/ProductoCreatePage';
import { ProductoEditPage } from './pages/productos/ProductoEditPage';
import { ComprasPage } from './pages/compras/ComprasPage';
import { CompraCreatePage } from './pages/compras/CompraCreatePage';
import { CompraEditPage } from './pages/compras/CompraEditPage';
import { PagosPage } from './pages/pagos/PagosPage';
import { PagoCreatePage } from './pages/pagos/PagoCreatePage';
import { OrdenesCompraPage } from './pages/ordenes-compra/OrdenesCompraPage';
import { OrdenCompraCreatePage } from './pages/ordenes-compra/OrdenCompraCreatePage';
import { OrdenCompraEditPage } from './pages/ordenes-compra/OrdenCompraEditPage';
import { ItemsGastoPage } from './pages/items-gasto/ItemsGastoPage';
import { ItemGastoCreatePage } from './pages/items-gasto/ItemGastoCreatePage';
import { ItemGastoEditPage } from './pages/items-gasto/ItemGastoEditPage';
import { VentasPage } from './pages/reportes/VentasPage';
import { LibroIvaPage } from './pages/reportes/LibroIvaPage';
import { SaldosProveedoresPage } from './pages/reportes/SaldosProveedoresPage';
import { SaldosProveedoresDetailPage } from './pages/reportes/SaldosProveedoresDetailPage';
import { CuentaCorrienteProveedorPage } from './pages/reportes/CuentaCorrienteProveedorPage';
import { GastosPorProveedorPage } from './pages/reportes/GastosPorProveedorPage';
import { PagosPorProveedorPage } from './pages/reportes/PagosPorProveedorPage';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  return children;
};

const NotFound = () => (
  <div>
    <div className="page-header"><div className="page-title">404 – No encontrado</div></div>
    <div className="card">
      <div className="card-body" style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
        La página que buscás no existe.
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />

                    {/* PROVEEDORES */}
                    <Route path="/proveedores"            element={<ProveedoresPage />} />
                    <Route path="/proveedores/create"     element={<ProveedorCreatePage />} />
                    <Route path="/proveedores/:id/edit"   element={<ProveedorEditPage />} />

                    {/* INSUMOS */}
                    <Route path="/insumos"            element={<InsumosPage />} />
                    <Route path="/insumos/create"     element={<InsumoCreatePage />} />
                    <Route path="/insumos/:id/edit"   element={<InsumoEditPage />} />

                    {/* PRODUCTOS */}
                    <Route path="/productos"            element={<ProductosPage />} />
                    <Route path="/productos/create"     element={<ProductoCreatePage />} />
                    <Route path="/productos/:id/edit"   element={<ProductoEditPage />} />

                    {/* COMPRAS */}
                    <Route path="/compras"            element={<ComprasPage />} />
                    <Route path="/compras/create"     element={<CompraCreatePage />} />
                    <Route path="/compras/:id/edit"   element={<CompraEditPage />} />

                    {/* PAGOS */}
                    <Route path="/pagos"          element={<PagosPage />} />
                    <Route path="/pagos/create"   element={<PagoCreatePage />} />

                    {/* ORDENES DE COMPRA */}
                    <Route path="/ordenes-compra"          element={<OrdenesCompraPage />} />
                    <Route path="/ordenes-compra/create"   element={<OrdenCompraCreatePage />} />
                    <Route path="/ordenes-compra/:id/edit" element={<OrdenCompraEditPage />} />

                    {/* ITEMS DE GASTO */}
                    <Route path="/items-gasto"            element={<ItemsGastoPage />} />
                    <Route path="/items-gasto/create"     element={<ItemGastoCreatePage />} />
                    <Route path="/items-gasto/:id/edit"   element={<ItemGastoEditPage />} />

                    {/* REPORTES DE COSTOS */}
                    <Route path="/reportes/ventas"                  element={<VentasPage />} />
                    <Route path="/reportes/libro-iva-compras"       element={<LibroIvaPage />} />
                    <Route path="/reportes/saldos-proveedores"      element={<SaldosProveedoresPage />} />
                    <Route path="/reportes/saldos-proveedores/:proveedorId" element={<SaldosProveedoresDetailPage />} />
                    <Route path="/reportes/cuenta-corriente-proveedor" element={<CuentaCorrienteProveedorPage />} />
                    <Route path="/reportes/gastos-por-proveedor"       element={<GastosPorProveedorPage />} />
                    <Route path="/reportes/pagos-por-proveedor"        element={<PagosPorProveedorPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            } />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
