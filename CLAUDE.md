# Estado: redesign-cuenta-corriente-proveedor (2026-07-07)

Rama actual: `main`. Todo el trabajo de esta sección está sin commitear y
sin rama propia (a diferencia del backend, que sí usa una rama
`redesign-cuenta-corriente-proveedor`) — ver `git status` para la lista
completa de archivos nuevos/modificados/borrados.

OpenSpec change: `openspec/changes/redesign-cuenta-corriente-proveedor/`
(proposal.md, design.md, specs/{compras,tesoreria-pagos,ordenes-compra,
items-gasto,libro-iva-compras,proveedores,reportes-costos,
facturas-gastos}/spec.md, tasks.md — los 4 artefactos existen y
`openspec validate redesign-cuenta-corriente-proveedor --strict` pasa).

## Qué es este cambio

Migra este frontend (`panacea-produccion`) para consumir el modelo nuevo
que ya está implementado en `panacea-produccion-backend` (mismo nombre de
change ahí: `redesign-cuenta-corriente-proveedor`) — reemplaza
`CuentaCorrienteProveedor` (una sola tabla factura+pago) por `Compra`/
`Pago`/`OrdenCompra`/`MovimientoCC` normalizados. Este repo es el frontend
único que consume esos endpoints, y el backend tiene su propia task 10.1
bloqueada esperando que este repo despliegue contra los endpoints nuevos.
Contexto completo en `proposal.md`/`design.md` de este change (y en el
`CLAUDE.md` del repo backend para el lado servidor).

## Progreso: 34/41 tasks de `tasks.md`

**Grupos 1-9: código completo.** Todas las pantallas nuevas están
escritas y el módulo legacy fue borrado en el mismo pase (sin período de
convivencia, según design.md D-cutover):

- `src/pages/compras/` — CRUD de Compras (reemplaza Facturas/Gastos):
  `CompraForm`, `CompraDetalleEditor` (selector Insumo/Ítem de Gasto/Texto
  Libre por renglón), `CompraImpuestoEditor` (vocabulario fijo de tipos de
  impuesto), `CompraTotalsSummary`, `PagosAplicadosPanel`,
  `ComprasPage`/`CompraCreatePage`/`CompraEditPage`.
- `src/pages/pagos/` — Pagos con medios múltiples (`PagoMediosEditor`,
  cheque/echeq exigen banco/número/fecha de acreditación) y
  `AplicarPagoModal` compartido (aplicar pago↔compra desde la pantalla de
  Pagos o desde el edit de una Compra).
- `src/pages/ordenes-compra/` — CRUD con progreso de recepción read-only
  (`cantidad_recibida`/`cantidad_pedida` avanza server-side al crear una
  Compra con `orden_compra_id`).
- `src/pages/items-gasto/` — catálogo nuevo, mismo shape que
  `src/pages/insumos/`.
- `src/pages/reportes/LibroIvaPage.jsx` — reporte por período con
  impresión (`react-to-print`, mismo patrón que `VentasPage.jsx`).
- `src/pages/proveedores/` — agrega código, nombre_fantasia,
  condicion_iva, condicion_pago.
- `src/pages/DashboardPage.jsx` — el resumen de cuenta corriente ahora lee
  `/costos/cuenta-corriente/resumen` en vez de `/costos/ctacteprovresumen`.
- `src/pages/facturas/**` — **borrado completo** (8 archivos), rutas
  `/ctacteprov*` y la entrada de menú correspondientes también.
- `src/App.jsx` / `src/components/layout/AppLayout.jsx` — rutas y menú
  actualizados para todo lo anterior.
- `src/components/form/FileUploadField.jsx` — nuevo, sube adjuntos como
  `File`/multipart real (no como el base64 legacy de `ImageField`).
- `src/components/form/EntityPicker.jsx` — extendido con prop opcional
  `extraParams` (filtro fijo adicional en la búsqueda, ej. escopar por
  `proveedor_id`) para el picker de Compra/Pago en `AplicarPagoModal`.
- `src/hooks/index.js` — `useFetch` ahora tolera `url` falsy (no dispara
  fetch), necesario para el modo dual de `AplicarPagoModal`.

**Desvíos documentados (ver `tasks.md` para el detalle de cada uno):**
- No se creó una capa de servicios con `createCrudService` (tasks 1.1/1.2
  originales) — se auditó el código y esa función no se usa en ningún
  lado del repo; todas las pantallas llaman `api.get/post/put/delete`
  directo, así que se siguió esa convención real en vez de introducir una
  abstracción sin uso.
- Los renglones ya persistidos de `CompraDetalle`/`CompraImpuesto` no son
  removibles desde la UI — el backend solo expone endpoints de alta para
  esas dos cosas, no de baja.
- El edit de `OrdenCompra` manda el registro completo (incl. detalle) en
  un solo PUT, no como commit escalonado — esa entidad no tiene endpoint
  anidado por renglón como sí tiene `Compra`.
- `Pago.importe` se calcula como la suma de sus medios en vez de ser un
  campo separado que el usuario carga — el caso de "total no coincide"
  queda estructuralmente imposible en vez de bloqueado en el submit.

**Verificado en esta sesión:** `npm run build` y `npm run lint` pasan
limpio (usando Node 22.23.1 vía `nvm use 22.23.1` — el Node 20.2.0 que
trae el entorno por default no puede ni correr el formatter de eslint ni
el build de Vite, ver "Cosas a tener presentes"). Cero hallazgos nuevos de
lint. El dev server (`npm run dev`) levanta limpio y sirve el módulo de
cada pantalla nueva sin error.

**Los 7 tasks de verificación manual: BLOQUEADOS, no hechos en esta
sesión.** Son 2.3, 3.3, 4.7, 5.6, 6.5, 7.3, 8.2 en `tasks.md`. Todos
requieren manejar la app real logueado contra un backend vivo
(`panacea-produccion-backend.vercel.app`, detrás de login) — esta sesión
no tiene credenciales y no correspondía mutar datos reales sin
autorización explícita.

**9.5/9.6 también pendientes** (regresión manual completa + avisar al
dueño del repo backend que ya se puede avanzar con su task 10.1) — ambos
dependen de que un humano complete la verificación manual primero.

## Para retomar

1. Loguearse contra el backend real (o levantar uno local — ver
   `panacea-produccion-backend`) y correr el checklist de verificación
   manual de `tasks.md` (tasks 2.3, 3.3, 4.7, 5.6, 6.5, 7.3, 8.2). Cada
   uno tiene el flujo exacto a probar escrito ahí.
2. Si algo falla: arreglarlo, no lo marques hecho — `tasks.md` es la
   fuente de verdad de qué falta.
3. Si todo pasa: marcar esos 7 tasks `[x]` en `tasks.md`, hacer 9.6 (avisar
   al equipo de `panacea-produccion-backend` — ese repo tiene su task 10.1
   bloqueada esperando justo esta confirmación), y recién ahí es candidato
   a `/opsx:archive`.
4. Decidir si este trabajo va a una rama propia antes de mergear a `main`
   — ahorita todo está sin commitear directo sobre `main` (ver "Rama
   actual" arriba).

## Cosas a tener presentes

- **Node del entorno por default (20.2.0) no sirve para build/lint** —
  falla con `util.styleText is not a function` en eslint y con el mismo
  error en `vite build` (Vite pide 20.19+ o 22.12+). Usar
  `nvm use 22.23.1` (ya está instalado vía nvm, no hace falta descargar
  nada) antes de `npm run build`/`npm run lint`.
- El dev server (`vite.config.js`) proxea `/costos`, `/auth`, `/profile`
  a `https://panacea-produccion-backend.vercel.app` — no hay backend
  local configurado en este repo por default.
- `EntityPicker` (`src/components/form/EntityPicker.jsx`) requiere mínimo
  2 caracteres para buscar; el picker de Pago en `AplicarPagoModal` busca
  por `fecha` (no hay un campo tipo "nombre" natural en `Pago`) — es una
  limitación de UX conocida, no un bug.
- `AplicarPagoModal` sirve dos flujos distintos según qué prop le pasan
  (`pago` vs `preselectedCompra`) — ver el comentario al principio del
  archivo antes de tocarlo.
- El openspec change de este repo y el del backend comparten nombre
  (`redesign-cuenta-corriente-proveedor`) pero son changes independientes
  en dos `openspec/` distintos — no confundir uno con otro al correr
  comandos `openspec` (no hay flag `--store`, cada uno resuelve por el
  `openspec/` local más cercano).
