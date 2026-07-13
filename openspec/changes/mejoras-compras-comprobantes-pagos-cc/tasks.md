## 1. Proveedores — quitar columna Código

- [x] 1.1 Quitar la columna `codigo` de `ProveedoresPage.jsx`, dejando el
      campo intacto en `ProveedorForm.jsx` (alta/edición).
- [ ] 1.2 Verificación manual: abrir "Proveedores" contra el backend real
      y confirmar que la grilla no muestra Código pero el formulario de
      edición de un proveedor existente sí lo sigue mostrando.

## 2. Órdenes de Compra — filtros de Estado y Proveedor

- [x] 2.1 Agregar estado local de filtros a `OrdenesCompraPage.jsx`
      (`estado` default `PENDIENTE`, `proveedor_id` default null) y un
      botón "Aplicar Filtros", siguiendo el patrón de `ComprasPage.jsx`.
- [x] 2.2 Agregar `<select>` de Estado usando `ESTADOS_ORDEN_COMPRA` más
      una opción "Todos", y un `EntityPicker` de Proveedor.
- [x] 2.3 Enviar `estado`/`proveedor_id` como query params a
      `GET /costos/ordenes-compra` vía `filter(...)`, y aplicar además un
      filtro client-side por `estado` sobre las filas recibidas (red de
      seguridad si el backend no filtra por ese parámetro — design.md D2).
- [ ] 2.4 Verificación manual: confirmar que al abrir la pantalla se ven
      solo las órdenes Pendientes, que cambiar a "Todos" muestra el resto,
      y que filtrar por un proveedor puntual funciona.

## 3. Comprobantes — filtro por Proveedor

- [x] 3.1 Agregar `EntityPicker` de Proveedor a la fila de filtros de
      `ComprasPage.jsx`, junto a Fecha Desde/Hasta/Estado.
- [x] 3.2 Incluir `proveedor_id` en el `filter({...})` existente, sin
      afectar los filtros ya soportados.
- [ ] 3.3 Verificación manual: filtrar Comprobantes por un proveedor
      puntual y confirmar que solo aparecen sus comprobantes, combinado
      con Fecha/Estado.

## 4. Motor de cálculo e impuestos simplificados

- [ ] 4.1 Verificar contra el backend real si `Compra` acepta
      `descuento_general`, `importe_exento`, `importe_no_gravado` en el
      payload de alta/edición, y si `CompraImpuesto` acepta
      `base_imponible`/`porcentaje` nulos u opcionales (design.md Open
      Questions). Ajustar el resto de esta sección al resultado.
- [x] 4.2 Reescribir `compraTotals.js` (o reemplazarlo por un módulo
      nuevo) implementando el algoritmo de `design.md` D6: por renglón
      (`subtotalBruto`, `descuento`, `subtotal`, `importeIVA`, `total`),
      agrupación de IVA por alícuota, descuento general recalculando
      bases/IVA, percepciones/retenciones/otros tributos independientes,
      exento/no gravado sumados directo, fórmula de Total, y redondeo
      comercial (half-up) a 2 decimales en cada importe monetario.
- [x] 4.3 En `CompraDetalleEditor.jsx`: reemplazar el campo "Descuento"
      (importe fijo) por "% Descuento"; restringir Alícuota IVA a
      0/2.5/5/10.5/21/27; agregar validación Cantidad > 0 y Precio
      Unitario ≥ 0 antes de stagear o actualizar una línea.
- [x] 4.4 En `CompraImpuestoEditor.jsx`: quitar los campos Base Imponible
      y Porcentaje del modal de alta; dejar solo Tipo e Importe; acotar
      `IMPUESTO_TIPOS` a Percepciones/Retenciones/Otros Tributos,
      quitando los tipos IVA_* (el IVA queda derivado de Detalle — ver
      design.md D6); bloquear Importe negativo salvo
      `tipo_comprobante = NOTA_CREDITO`.
- [x] 4.5 Agregar los campos Descuento General (%), Importe Exento e
      Importe No Gravado al maestro de `CompraForm.jsx`, e incluirlos en
      el payload de `POST`/`PUT` de Compra.
- [x] 4.6 Actualizar `CompraTotalsSummary.jsx` para mostrar el IVA
      agrupado por alícuota y los nuevos campos (Descuento General,
      Exento, No Gravado) en el resumen de totales.
- [ ] 4.7 Verificación manual: cargar una compra con varios renglones,
      distintas alícuotas de IVA, un descuento general y un impuesto de
      cada tipo, y confirmar que el Total mostrado coincide con lo que
      persiste el backend tras guardar.

## 5. Renglones de Orden de Compra editables

- [x] 5.1 En `CompraDetalleEditor.jsx`: reemplazar las celdas de Cantidad
      y Precio Unitario por inputs editables para toda fila `_pending`
      (staged), actualizando el renglón en el estado staged al cambiar el
      valor (design.md D5 — sin distinguir origen, aplica a toda fila
      pendiente).
- [ ] 5.2 Verificación manual: cargar una compra desde una Orden de
      Compra pendiente, editar Cantidad y Precio Unitario de un renglón
      traído automáticamente, y confirmar que el cambio se refleja en los
      totales antes de guardar y en el payload enviado al backend.

## 6. Comprobante de Contado con Pago integrado

- [x] 6.1 Agregar a `CompraForm.jsx`/`CompraCreatePage.jsx` una sección
      "Pago" que reutilice `PagoMediosEditor`, visible/habilitada solo
      cuando `condicion_pago === 'CONTADO'`.
- [x] 6.2 Validar antes de habilitar el submit que, en Contado, la suma
      de los medios cargados sea igual al Total calculado del
      comprobante (reutilizando la regla ya existente de
      `tesoreria-pagos`).
- [x] 6.3 En el submit de `CompraCreatePage.jsx`: si Contado, encadenar
      `POST /costos/compras` → `POST /costos/pagos` (con los medios) →
      `POST /costos/pagos/{id}/aplicaciones` (aplicando el Total a la
      compra creada), en ese orden (design.md D4).
- [x] 6.4 Manejar la falla parcial: si el paso de compra tiene éxito pero
      pago o aplicación fallan, navegar a la edición de la compra creada
      y mostrar un toast indicando que el pago debe completarse a mano,
      sin intentar revertir la compra.
- [ ] 6.5 Verificación manual: crear un comprobante Contado con medios de
      pago válidos y confirmar que, tras guardar, el comprobante figura
      con Saldo Pendiente 0 en el listado; crear uno con Cuenta Corriente
      y confirmar que la sección de Pago permanece deshabilitada y el
      comprobante queda con saldo pendiente.

## 7. Pagos en Cuenta Corriente

- [x] 7.1 Renombrar la pantalla y el ítem de menú de "Pagos" a "Pagos en
      Cuenta Corriente" en `AppLayout.jsx`, `PagosPage.jsx`, y
      `PagoCreatePage.jsx` (rótulos únicamente, la ruta `/pagos` no
      cambia — design.md D7).
- [x] 7.2 En `PagoForm.jsx`: al seleccionar Proveedor, disparar
      `GET /costos/compras` filtrado por ese proveedor y Estado
      Pendiente/Parcial, y mostrar los resultados en una tabla con un
      input "Importe a Aplicar" editable por fila.
- [x] 7.3 Calcular el "Total a Cubrir" como la suma de los importes a
      aplicar cargados, y habilitar `PagoMediosEditor` recién cuando ese
      total sea mayor a 0 (permitiendo igualmente guardar sin ningún
      comprobante seleccionado, como anticipo).
- [x] 7.4 Validar que la suma de los medios coincida con el Total a
      Cubrir cuando hay comprobantes seleccionados, reutilizando la
      validación ya existente de medios.
- [x] 7.5 En el submit de `PagoCreatePage.jsx`: encadenar
      `POST /costos/pagos` y, si hay comprobantes con importe > 0,
      `POST /costos/pagos/{id}/aplicaciones` con el array completo de
      `{compra_id, importe}` en una sola llamada.
- [x] 7.6 Manejar la falla parcial: si el pago se crea pero la aplicación
      falla, dejar el pago creado, mostrar un error, y permitir
      completarlo después desde `AplicarPagoModal` (sin cambios).
- [ ] 7.7 Verificación manual: crear un pago para un proveedor con dos
      comprobantes pendientes, aplicar un importe parcial a cada uno,
      cargar los medios de pago por el total resultante, guardar, y
      confirmar que ambos comprobantes reflejan el importe aplicado en
      su Saldo Pendiente; crear también un pago sin comprobantes
      seleccionados y confirmar que se guarda como anticipo.

## 8. Regresión y cierre

- [x] 8.1 Correr `npm run build` y `npm run lint` (con
      `nvm use 22.23.1`) y confirmar cero errores/warnings nuevos. Build
      limpio; lint muestra 7 errores/2 warnings preexistentes en archivos
      no tocados por este change (`ComplexForm.jsx`, `MasterDetailForm.jsx`,
      `DataGrid.jsx`, `ui/index.jsx`, `AuthContext.jsx`, `ToastContext.jsx`,
      `hooks/index.js`, `ProductoForm.jsx`, `ProgramacionPage.jsx`) — cero
      hallazgos nuevos en los archivos de este change.
- [ ] 8.2 Regresión manual completa de Compras, Órdenes de Compra,
      Proveedores y Pagos en Cuenta Corriente contra el backend real,
      cubriendo los flujos existentes que este cambio no debería romper
      (alta/edición/baja de compra en Cuenta Corriente, aplicar pago
      manual vía `AplicarPagoModal`, adjuntos, Libro IVA).
- [ ] 8.3 Actualizar `tasks.md` marcando qué tasks de verificación manual
      (1.2, 2.4, 3.3, 4.7, 5.2, 6.5, 7.7, 8.2) quedaron efectivamente
      confirmadas, antes de considerar este change listo para
      `/opsx:archive`.
