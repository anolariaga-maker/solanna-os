console.log("SolannaOS iniciado");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec";

// ⚠️ Debe ser EXACTAMENTE el mismo Client ID que pusiste en Auth.gs (GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = "642105410007-b8qd9ga1s9q7160q6ukc32u001mdd48r.apps.googleusercontent.com";

let ID_TOKEN = null;
let moduloActivo = "inicio";

function formatearMoneda(numero) {
    const valor = Number(numero) || 0;
    return "$" + valor.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR");
}

// ============================================================
// LOGIN CON GOOGLE (Login restringido)
// ============================================================
//
// index.html define, ANTES de pedir el script de Google, dos funciones
// globales: onGoogleIdentityLoaded() y onGoogleIdentityError(), enganchadas
// a los atributos onload/onerror del <script> de Google. Esas funciones
// llaman a onGoogleIdentityReady() / onGoogleIdentityFailed() (acá abajo)
// si ya existen. Al final de este archivo revisamos el estado actual por
// si el aviso ya pasó antes de que este archivo terminara de cargar.

function onGoogleIdentityReady() {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
        onGoogleIdentityFailed();
        return;
    }
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("botonGoogleLogin"),
        { theme: "outline", size: "large", text: "signin_with", shape: "pill" }
    );
    google.accounts.id.prompt();
}

function onGoogleIdentityFailed() {
    const elError = document.getElementById("errorLogin");
    if (elError) {
        elError.textContent = "No se pudo cargar el inicio de sesión de Google. " +
            "Revisá tu conexión a internet y recargá la página.";
    }
}

if (window.googleIdentityStatus === "listo") {
    onGoogleIdentityReady();
} else if (window.googleIdentityStatus === "error") {
    onGoogleIdentityFailed();
}

function handleCredentialResponse(response) {
    ID_TOKEN = response.credential;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "flex";
    irAModulo("inicio");
}

function cerrarSesion() {
    ID_TOKEN = null;
    if (typeof google !== "undefined" && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
    document.getElementById("appScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("errorLogin").textContent = "";
}

async function llamarBackend(opciones) {
    let url = opciones.url;
    let init = { method: opciones.method || "GET" };

    if (init.method === "GET") {
        url += (url.includes("?") ? "&" : "?") + "idToken=" + encodeURIComponent(ID_TOKEN || "");
    } else {
        const body = Object.assign({}, opciones.body, { idToken: ID_TOKEN });
        init.body = JSON.stringify(body);
    }

    const respuesta = await fetch(url, init);
    const resultado = await respuesta.json();

    if (resultado.status === "ERROR" && resultado.mensaje && resultado.mensaje.indexOf("No autorizado") === 0) {
        alert(resultado.mensaje);
        cerrarSesion();
        throw new Error(resultado.mensaje);
    }

    return resultado;
}

// ============================================================
// NAVEGACIÓN
// ============================================================

function irAModulo(modulo) {
    moduloActivo = modulo;
    document.querySelectorAll(".nav-item[data-modulo]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.modulo === modulo);
    });
    mostrarModulo(modulo);
    cerrarMenuMovil();
    document.getElementById("contenido").scrollTo({ top: 0 });
}

function abrirMenuMovil() {
    document.getElementById("sidebar").classList.add("abierto");
    document.getElementById("sidebarOverlay").classList.add("visible");
}

function cerrarMenuMovil() {
    document.getElementById("sidebar").classList.remove("abierto");
    document.getElementById("sidebarOverlay").classList.remove("visible");
}

// ============================================================
// RENDERIZADO DE MÓDULOS
// ============================================================

function mostrarModulo(modulo) {

    const contenido = document.getElementById("contenido");

    if (modulo === "inicio") {
        contenido.innerHTML = `
            <div class="page-header">
                <div>
                    <h2>Inicio</h2>
                    <p class="page-sub">Así está SolannaOS hoy.</p>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card kpi-hero">
                    <div class="kpi-label">Capital Real</div>
                    <div class="kpi-value" id="kpiCapitalReal">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Ganancia Disponible</div>
                    <div class="kpi-value" id="kpiGananciaDisponible">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Ventas del Mes</div>
                    <div class="kpi-value" id="kpiVentasDelMes">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Fondo Emergencia</div>
                    <div class="kpi-value" id="kpiFondoEmergencia">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Cobros Pendientes</div>
                    <div class="kpi-value" id="kpiCobrosPendientes">—</div>
                </div>
            </div>

            <div class="kpi-grid-secundaria">
                <div class="kpi-card">
                    <div class="kpi-label">Billetera Angie</div>
                    <div class="kpi-value" id="kpiBilleteraAngie">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Stock Bajo</div>
                    <div class="kpi-value" id="kpiStockBajo">—</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Reservas Activas</div>
                    <div class="kpi-value" id="kpiReservasActivas">—</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>Alertas</h3></div>
                <div id="alertaStockBajo"></div>
                <div id="alertaReservas"></div>
                <div id="alertaDeuda"></div>
            </div>
        `;
        cargarDashboard();
        cargarAlertas();
    }

    if (modulo === "ventas") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Ventas</h2><p class="page-sub">Registrá una venta y generá el comprobante al instante.</p></div></div>
            <div class="card" style="max-width:540px;">
                <div class="field search-wrap">
                    <label>Cliente</label>
                    <input id="busquedaClienteVenta" type="text" placeholder="Buscá por nombre o teléfono" oninput="buscarClientesWeb('busquedaClienteVenta','resultadosClienteVenta','clienteVenta')">
                    <div id="resultadosClienteVenta" class="search-results" style="display:none;"></div>
                </div>
                <div class="field avanzado">
                    <label>ID de cliente</label>
                    <input id="clienteVenta" type="text" placeholder="Se completa solo al elegir arriba">
                </div>
                <div class="field avanzado">
                    <label>Producto (ID de variante)</label>
                    <input id="varianteVenta" type="text" placeholder="Ej: VAR-A1B2C3D4">
                    <span class="hint">Lo encontrás en el módulo Productos.</span>
                </div>
                <div class="field">
                    <label>Cantidad</label>
                    <input id="cantidadVenta" type="number" placeholder="1">
                </div>
                <div class="field">
                    <label>Método de pago (opcional)</label>
                    <input id="metodoPagoVenta" type="text" placeholder="Ej: efectivo, transferencia">
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarVenta()">Guardar venta</button>
                <div id="comprobanteVenta"></div>
            </div>
        `;
    }

    if (modulo === "clientes") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Clientes</h2><p class="page-sub">Sumá un cliente nuevo a SolannaOS.</p></div></div>
            <div class="card" style="max-width:480px;">
                <div class="field">
                    <label>Nombre completo</label>
                    <input id="nombreCliente" type="text" placeholder="Ej: Sofía Martínez">
                </div>
                <div class="field">
                    <label>Teléfono</label>
                    <input id="telefonoCliente" type="text" placeholder="Para enviar el comprobante por WhatsApp">
                </div>
                <div class="field">
                    <label>Instagram</label>
                    <input id="instagramCliente" type="text" placeholder="@usuario (opcional)">
                </div>
                <div class="field">
                    <label>Observaciones</label>
                    <input id="obsCliente" type="text" placeholder="Opcional">
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarCliente()">Guardar cliente</button>
            </div>
        `;
    }

    if (modulo === "compras") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Compras</h2><p class="page-sub">Registrá mercadería que entra al local.</p></div></div>
            <div class="card" style="max-width:480px;">
                <div class="field avanzado">
                    <label>ID de proveedor</label>
                    <input id="proveedorCompra" type="text" placeholder="Ej: PROV-001">
                </div>
                <div class="field avanzado">
                    <label>Producto (ID de variante)</label>
                    <input id="varianteCompra" type="text" placeholder="Ej: VAR-A1B2C3D4">
                </div>
                <div class="field">
                    <label>Cantidad</label>
                    <input id="cantidadCompra" type="number" placeholder="1">
                </div>
                <div class="field">
                    <label>Costo unitario</label>
                    <input id="costoCompra" type="number" placeholder="$">
                </div>
                <div class="field">
                    <label>Método de pago (opcional)</label>
                    <input id="metodoPagoCompra" type="text" placeholder="Ej: efectivo, transferencia">
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarCompra()">Guardar compra</button>
            </div>
        `;
    }

    if (modulo === "productos") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Productos</h2><p class="page-sub">Cargá un producto nuevo con su primera variante.</p></div></div>
            <div class="card" style="max-width:480px;">
                <div class="field">
                    <label>Nombre del producto</label>
                    <input id="nombreProducto" type="text" placeholder="Ej: Conjunto Sofía">
                </div>
                <div class="form-grid">
                    <div class="field avanzado">
                        <label>ID de color</label>
                        <input id="colorProducto" type="text" placeholder="Ej: COL-01">
                    </div>
                    <div class="field avanzado">
                        <label>ID de talle</label>
                        <input id="talleProducto" type="text" placeholder="Ej: TAL-M">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label>Costo</label>
                        <input id="costoProducto" type="number" placeholder="$">
                    </div>
                    <div class="field">
                        <label>Stock inicial</label>
                        <input id="stockProducto" type="number" placeholder="0">
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarProducto()">Guardar producto</button>
            </div>
        `;
    }

    if (modulo === "caja") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Caja</h2><p class="page-sub">Movimientos manuales y transferencias entre bolsillos.</p></div></div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Nuevo movimiento de Caja</h3></div>
                <div class="field">
                    <label>Tipo</label>
                    <select id="tipoMovCaja">
                        <option value="INGRESO">Ingreso</option>
                        <option value="EGRESO">Egreso</option>
                        <option value="MOV_INTERNO">Movimiento interno</option>
                    </select>
                </div>
                <div class="field">
                    <label>Monto</label>
                    <input id="montoMovCaja" type="number" placeholder="$">
                </div>
                <div class="field">
                    <label>Concepto</label>
                    <input id="conceptoMovCaja" type="text" placeholder="Ej: Retiro personal">
                </div>
                <div class="field avanzado">
                    <label>ID de método de pago (opcional)</label>
                    <input id="metodoPagoMovCaja" type="text" placeholder="Opcional">
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarMovimientoCaja()">Guardar movimiento</button>
            </div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Transferir entre bolsillos</h3></div>
                <p class="page-sub" style="margin-bottom:16px;">Ej: mover parte de la Ganancia Disponible al Fondo de Emergencia o a la Billetera Angie.</p>
                <div class="form-grid">
                    <div class="field">
                        <label>Desde</label>
                        <select id="bolsilloOrigenTransf">
                            <option value="CAPITAL_REAL">Capital Real</option>
                            <option value="GANANCIA_DISP" selected>Ganancia Disponible</option>
                            <option value="FONDO_EMERG">Fondo Emergencia</option>
                            <option value="BILLETERA_ANGIE">Billetera Angie</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Hacia</label>
                        <select id="bolsilloDestinoTransf">
                            <option value="CAPITAL_REAL">Capital Real</option>
                            <option value="GANANCIA_DISP">Ganancia Disponible</option>
                            <option value="FONDO_EMERG" selected>Fondo Emergencia</option>
                            <option value="BILLETERA_ANGIE">Billetera Angie</option>
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label>Monto a transferir</label>
                    <input id="montoTransf" type="number" placeholder="$">
                </div>
                <div class="field">
                    <label>Observaciones (opcional)</label>
                    <input id="obsTransf" type="text" placeholder="Opcional">
                </div>
                <button class="btn btn-secondary btn-block" onclick="guardarTransferenciaBolsillo()">Transferir</button>
            </div>
        `;
    }

    if (modulo === "reservas") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Reservas</h2><p class="page-sub">Apartá mercadería sin sacarla del stock físico.</p></div></div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Nueva reserva</h3></div>
                <div class="field avanzado">
                    <label>ID de cliente</label>
                    <input id="clienteReserva" type="text" placeholder="Ej: CLI-A1B2C3D4">
                </div>
                <div class="field avanzado">
                    <label>Producto (ID de variante)</label>
                    <input id="varianteReserva" type="text" placeholder="Ej: VAR-A1B2C3D4">
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label>Cantidad</label>
                        <input id="cantidadReserva" type="number" placeholder="1">
                    </div>
                    <div class="field">
                        <label>Precio fijado</label>
                        <input id="precioReserva" type="number" placeholder="$">
                    </div>
                </div>
                <div class="field">
                    <label>Vencimiento</label>
                    <input id="vencimientoReserva" type="date">
                </div>
                <div class="field">
                    <label>Observaciones (opcional)</label>
                    <input id="obsReserva" type="text" placeholder="Opcional">
                </div>
                <button class="btn btn-primary btn-block" onclick="guardarReserva()">Guardar reserva</button>
            </div>

            <div class="card-header" style="margin-top:8px;">
                <h3>Reservas cargadas</h3>
                <button class="btn btn-ghost btn-sm" onclick="cargarReservas()">Actualizar</button>
            </div>
            <div id="listaReservas"></div>
        `;
        cargarReservas();
    }

    if (modulo === "radar") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Radar de Clientes</h2><p class="page-sub">Quién compra seguido, quién no vuelve hace rato, y quién te debe.</p></div></div>

            <div class="field search-wrap" style="max-width:420px;">
                <input id="busquedaRadar" type="text" placeholder="Buscar por nombre, teléfono o Instagram" oninput="buscarEnRadar()">
                <div id="resultadosBusquedaRadar" class="search-results" style="display:none;"></div>
            </div>

            <div class="card">
                <div class="card-header"><h3>Clientes frecuentes</h3></div>
                <div id="radarFrecuentes"></div>
            </div>

            <div class="card">
                <div class="card-header"><h3>Clientes inactivos</h3></div>
                <div id="radarInactivos"></div>
            </div>

            <div class="card">
                <div class="card-header"><h3>Clientes con deuda</h3></div>
                <div id="radarConDeuda"></div>
            </div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Registrar cobro de deuda</h3></div>
                <p class="page-sub" style="margin-bottom:16px;">Necesitás el ID de la venta original que generó la deuda.</p>
                <div class="field avanzado">
                    <label>ID de cliente</label>
                    <input id="clienteCobro" type="text" placeholder="Ej: CLI-A1B2C3D4">
                </div>
                <div class="field avanzado">
                    <label>ID de venta (origen de la deuda)</label>
                    <input id="ventaRefCobro" type="text" placeholder="Ej: uuid de la venta">
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label>Monto cobrado</label>
                        <input id="montoCobro" type="number" placeholder="$">
                    </div>
                    <div class="field">
                        <label>Método de pago (opcional)</label>
                        <input id="metodoPagoCobro" type="text" placeholder="Opcional">
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="registrarCobroDeuda()">Registrar cobro</button>
            </div>
        `;
        cargarRadar();
    }

    if (modulo === "admin") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Administración</h2><p class="page-sub">Herramientas de mantenimiento del sistema.</p></div></div>

            <div class="card zona-riesgo" style="max-width:560px;">
                <h3>Reiniciar datos de prueba</h3>
                <p>Borra todos los movimientos de Compras, Ventas, Stock, Envíos, Reservas, Cuenta Corriente,
                Caja Física y Bolsillos Virtuales, y pone Stock Físico y Stock Reservado en 0 en todas las variantes.</p>
                <p><strong>No borra:</strong> colores, talles, categorías, métodos de pago/envío, proveedores,
                clientes ni productos/variantes (solo su stock).</p>
                <p><strong>Esta acción no se puede deshacer.</strong></p>
                <button class="btn btn-danger" onclick="reiniciarDatosPruebaWeb()">Reiniciar datos de prueba</button>
            </div>
        `;
    }
}

// ============================================================
// DASHBOARD + ALERTAS
// ============================================================

async function cargarDashboard() {
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=dashboard" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudo cargar el dashboard.");

        document.getElementById("kpiCapitalReal").textContent = formatearMoneda(datos.capitalReal);
        document.getElementById("kpiGananciaDisponible").textContent = formatearMoneda(datos.gananciaDisponible);
        document.getElementById("kpiFondoEmergencia").textContent = formatearMoneda(datos.fondoEmergencia);
        document.getElementById("kpiBilleteraAngie").textContent = formatearMoneda(datos.billeteraAngie);
        document.getElementById("kpiVentasDelMes").textContent = formatearMoneda(datos.ventasDelMes);
        document.getElementById("kpiCobrosPendientes").textContent = formatearMoneda(datos.cobrosPendientes);
        document.getElementById("kpiStockBajo").textContent = datos.stockBajo;
        document.getElementById("kpiReservasActivas").textContent = datos.reservasActivas;
    } catch (error) {
        document.getElementById("contenido").insertAdjacentHTML("beforeend",
            `<p style="color:var(--danger);">Error al cargar el dashboard: ${error.message}</p>`);
    }
}

async function cargarAlertas() {
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=alertas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las alertas.");

        document.getElementById("alertaStockBajo").innerHTML = renderListaAlertas(
            "Stock bajo",
            datos.stockBajo,
            v => `<strong>${v.producto}</strong> — disponible ${v.stockDisponible} (repone en ${v.puntoReposicion})`,
            "danger"
        );

        document.getElementById("alertaReservas").innerHTML = renderListaAlertas(
            "Reservas por vencer",
            datos.reservasPorVencer,
            r => `Reserva de <strong>${formatearMoneda(r.totalReserva)}</strong> vence el ${formatearFecha(r.vencimiento)}`,
            ""
        );

        document.getElementById("alertaDeuda").innerHTML = renderListaAlertas(
            "Clientes con deuda",
            datos.clientesConDeuda,
            c => `<strong>${c.nombre}</strong> debe ${formatearMoneda(c.saldoPendiente)}`,
            ""
        );
    } catch (error) {
        console.error("Error al cargar alertas: " + error.message);
    }
}

function renderListaAlertas(titulo, items, renderItem, tipoDot) {
    let html = `<h4 style="font-size:14px;color:var(--ink-soft);font-weight:600;margin:14px 0 4px 0;">${titulo}</h4>`;
    if (!items || items.length === 0) {
        html += `<p class="alert-empty">Sin novedades por acá.</p>`;
        return html;
    }
    html += `<div class="alert-list">` + items.map(item => `
        <div class="alert-item">
            <span class="alert-dot ${tipoDot}"></span>
            <span>${renderItem(item)}</span>
        </div>
    `).join("") + `</div>`;
    return html;
}

// ============================================================
// RADAR DE CLIENTES
// ============================================================

async function cargarRadar() {
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=radarClientes" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudo cargar el radar.");

        document.getElementById("radarFrecuentes").innerHTML = renderListaClientes(datos.frecuentes, "Todavía no hay clientes frecuentes.");
        document.getElementById("radarInactivos").innerHTML = renderListaClientes(datos.inactivos, "No hay clientes inactivos.");
        document.getElementById("radarConDeuda").innerHTML = renderListaClientes(datos.conDeuda, "Nadie tiene deuda pendiente.");
    } catch (error) {
        document.getElementById("contenido").insertAdjacentHTML("beforeend",
            `<p style="color:var(--danger);">Error al cargar el radar: ${error.message}</p>`);
    }
}

function renderListaClientes(lista, textoVacio) {
    if (!lista || lista.length === 0) {
        return `<p class="empty-state">${textoVacio}</p>`;
    }
    return lista.map(c => `
        <div class="card-cliente">
            <h4>${c.nombre}<span class="id-chip">${c.idCliente}</span></h4>
            <div class="fila"><span>Última compra</span><strong>${formatearFecha(c.ultimaCompra)}</strong></div>
            <div class="fila"><span>Compras totales</span><strong>${c.cantidadCompras}</strong></div>
            <div class="fila"><span>Total gastado</span><strong>${formatearMoneda(c.totalGastado)}</strong></div>
            <div class="fila"><span>Saldo pendiente</span><strong>${formatearMoneda(c.saldoPendiente)}</strong></div>
        </div>
    `).join("");
}

let timeoutBusquedaRadar = null;
function buscarEnRadar() {
    clearTimeout(timeoutBusquedaRadar);
    const q = document.getElementById("busquedaRadar").value;
    const contenedor = document.getElementById("resultadosBusquedaRadar");
    timeoutBusquedaRadar = setTimeout(async () => {
        if (!q) { contenedor.style.display = "none"; contenedor.innerHTML = ""; return; }
        try {
            const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=buscarClientes&q=" + encodeURIComponent(q) });
            contenedor.innerHTML = (datos.resultados || []).map(c => `<p>${c.nombre} — ${c.telefono}<span class="id-chip">${c.idCliente}</span></p>`).join("") || "<p>Sin resultados.</p>";
            contenedor.style.display = "block";
        } catch (error) {
            contenedor.style.display = "none";
        }
    }, 300);
}

let timeoutBusquedaCliente = null;
function buscarClientesWeb(idInputBusqueda, idContenedorResultados, idInputDestino) {
    clearTimeout(timeoutBusquedaCliente);
    const q = document.getElementById(idInputBusqueda).value;
    const contenedor = document.getElementById(idContenedorResultados);
    timeoutBusquedaCliente = setTimeout(async () => {
        if (!q) { contenedor.style.display = "none"; contenedor.innerHTML = ""; return; }
        try {
            const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=buscarClientes&q=" + encodeURIComponent(q) });
            contenedor.innerHTML = (datos.resultados || []).map(c =>
                `<p onclick="document.getElementById('${idInputDestino}').value='${c.idCliente}'; document.getElementById('${idInputBusqueda}').value='${(c.nombre || "").replace(/'/g, "")}'; document.getElementById('${idContenedorResultados}').style.display='none';">${c.nombre} — ${c.telefono}<span class="id-chip">${c.idCliente}</span></p>`
            ).join("") || "<p>Sin resultados.</p>";
            contenedor.style.display = "block";
        } catch (error) {
            contenedor.style.display = "none";
        }
    }, 300);
}

// ============================================================
// CAJA Y BOLSILLOS
// ============================================================

async function guardarMovimientoCaja() {
    const datosCaja = {
        tipoOperacion: "CAJA",
        fechaHora: new Date().toISOString(),
        tipo: document.getElementById("tipoMovCaja").value,
        monto: Number(document.getElementById("montoMovCaja").value),
        concepto: document.getElementById("conceptoMovCaja").value,
        idMetodoPago: document.getElementById("metodoPagoMovCaja").value,
        observaciones: "Movimiento manual desde SolannaOS Web"
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCaja });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") irAModulo("caja");
    } catch (error) {
        alert("Error: " + error);
    }
}

async function guardarTransferenciaBolsillo() {
    const bolsilloOrigen = document.getElementById("bolsilloOrigenTransf").value;
    const bolsilloDestino = document.getElementById("bolsilloDestinoTransf").value;
    if (bolsilloOrigen === bolsilloDestino) {
        alert("El bolsillo origen y destino no pueden ser el mismo.");
        return;
    }
    const datosTransferencia = {
        tipoOperacion: "TRANSFERENCIA_BOLSILLO",
        fechaHora: new Date().toISOString(),
        bolsilloOrigen: bolsilloOrigen,
        bolsilloDestino: bolsilloDestino,
        monto: Number(document.getElementById("montoTransf").value),
        observaciones: document.getElementById("obsTransf").value
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosTransferencia });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") irAModulo("caja");
    } catch (error) {
        alert("Error: " + error);
    }
}

// ============================================================
// RESERVAS
// ============================================================

async function cargarReservas() {
    const contenedor = document.getElementById("listaReservas");
    if (!contenedor) return;
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=reservas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las reservas.");

        if (datos.reservas.length === 0) {
            contenedor.innerHTML = `<p class="empty-state">No hay reservas cargadas.</p>`;
            return;
        }

        const badgeClase = {
            ACTIVA: "badge-activa",
            ENTREGADA: "badge-entregada",
            CANCELADA: "badge-cancelada",
            VENCIDA: "badge-vencida"
        };

        contenedor.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datos.reservas.map(r => `
                            <tr>
                                <td>${r.idCliente}</td>
                                <td class="num">${formatearMoneda(r.totalReserva)}</td>
                                <td>${formatearFecha(r.vencimiento)}</td>
                                <td><span class="badge ${badgeClase[r.estado] || ""}">${r.estado}</span></td>
                                <td>
                                    ${r.estado === "ACTIVA" ? `
                                        <div class="btn-row">
                                            <button class="btn btn-secondary btn-sm" onclick="convertirReservaWeb('${r.idReserva}')">Convertir</button>
                                            <button class="btn btn-ghost btn-sm" onclick="vencerReservaWeb('${r.idReserva}')">Vencer</button>
                                            <button class="btn btn-ghost btn-sm" onclick="cancelarReservaWeb('${r.idReserva}')">Cancelar</button>
                                        </div>
                                    ` : ""}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contenedor.innerHTML = `<p style="color:var(--danger);">Error al cargar reservas: ${error.message}</p>`;
    }
}

async function guardarReserva() {
    const datosReserva = {
        tipoOperacion: "RESERVA",
        idCliente: document.getElementById("clienteReserva").value,
        fechaHora: new Date().toISOString(),
        vencimiento: document.getElementById("vencimientoReserva").value,
        observaciones: document.getElementById("obsReserva").value,
        productos: [{
            idVariante: document.getElementById("varianteReserva").value,
            cantidad: Number(document.getElementById("cantidadReserva").value),
            precioFijado: Number(document.getElementById("precioReserva").value)
        }]
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosReserva });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") irAModulo("reservas");
    } catch (error) {
        alert("Error: " + error);
    }
}

async function cancelarReservaWeb(idReserva) { await ejecutarAccionReserva("CANCELAR_RESERVA", idReserva); }
async function vencerReservaWeb(idReserva) { await ejecutarAccionReserva("VENCER_RESERVA", idReserva); }

async function convertirReservaWeb(idReserva) {
    if (!confirm("¿Convertir la reserva " + idReserva + " en una venta CONTADO?")) return;
    await ejecutarAccionReserva("CONVERTIR_RESERVA", idReserva, { estadoCobro: "CONTADO" });
}

async function ejecutarAccionReserva(tipoOperacion, idReserva, datosExtra) {
    const datos = Object.assign({ tipoOperacion: tipoOperacion, idReserva: idReserva, fechaHora: new Date().toISOString() }, datosExtra || {});
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datos });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") cargarReservas();
    } catch (error) {
        alert("Error: " + error);
    }
}

// ============================================================
// COBRO DE DEUDA
// ============================================================

async function registrarCobroDeuda() {
    const datosCobro = {
        tipoOperacion: "COBRAR_DEUDA",
        fechaHora: new Date().toISOString(),
        idCliente: document.getElementById("clienteCobro").value,
        idVentaRef: document.getElementById("ventaRefCobro").value,
        monto: Number(document.getElementById("montoCobro").value),
        idMetodoPago: document.getElementById("metodoPagoCobro").value,
        observaciones: "Cobro registrado desde el Radar de Clientes"
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCobro });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") irAModulo("radar");
    } catch (error) {
        alert("Error: " + error);
    }
}

// ============================================================
// ADMINISTRACIÓN — Reiniciar datos de prueba
// ============================================================

async function reiniciarDatosPruebaWeb() {
    if (!confirm("¿Seguro que querés borrar TODOS los datos transaccionales de prueba? Esta acción NO se puede deshacer.")) {
        return;
    }
    const textoConfirmacion = prompt('Para confirmar, escribí exactamente: REINICIAR-SOLANNAOS');
    if (textoConfirmacion !== "REINICIAR-SOLANNAOS") {
        alert("Confirmación incorrecta. No se realizó ningún cambio.");
        return;
    }
    try {
        const resultado = await llamarBackend({
            url: WEB_APP_URL,
            method: "POST",
            body: { tipoOperacion: "REINICIAR_DATOS_PRUEBA", confirmacion: textoConfirmacion }
        });
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") irAModulo("inicio");
    } catch (error) {
        alert("Error: " + error);
    }
}

// ============================================================
// VENTAS / COMPRAS / CLIENTES / PRODUCTOS
// ============================================================

function formatearTelefonoWhatsApp(telefono) {
    const soloDigitos = String(telefono || "").replace(/\D/g, "");
    if (soloDigitos.length === 10) return "549" + soloDigitos;
    return soloDigitos;
}

function mostrarComprobante(comprobante) {
    const contenedor = document.getElementById("comprobanteVenta");
    if (!contenedor || !comprobante) return;

    const telefonoWa = formatearTelefonoWhatsApp(comprobante.telefonoCliente);
    const linkWa = "https://wa.me/" + telefonoWa + "?text=" + encodeURIComponent(comprobante.textoComprobante);

    contenedor.innerHTML = `
        <div class="comprobante-card">
            <h3>Comprobante</h3>
            <div class="comprobante-texto">${comprobante.textoComprobante}</div>
            ${telefonoWa
                ? `<a href="${linkWa}" target="_blank"><button class="btn btn-primary">Enviar por WhatsApp</button></a>`
                : `<p class="page-sub">El cliente no tiene teléfono cargado.</p>`}
        </div>
    `;
}

async function guardarVenta() {
    const datosVenta = {
        tipoOperacion: "VENTA",
        idCliente: document.getElementById("clienteVenta").value,
        fechaHora: new Date().toISOString(),
        descMonto: 0,
        estadoCobro: "CONTADO",
        idMetodoPago: document.getElementById("metodoPagoVenta").value,
        observaciones: "Venta desde SolannaOS Web",
        productos: [{
            idVariante: document.getElementById("varianteVenta").value,
            cantidad: Number(document.getElementById("cantidadVenta").value),
            precioUnitario: 8000
        }]
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosVenta });
        alert(JSON.stringify({ status: resultado.status, idVenta: resultado.idVenta, total: resultado.total }));
        if (resultado.status === "SUCCESS") mostrarComprobante(resultado.comprobante);
    } catch (error) {
        alert("Error: " + error);
    }
}

async function guardarCompra() {
    const datosCompra = {
        tipoOperacion: "COMPRA",
        idProveedor: document.getElementById("proveedorCompra").value,
        fechaHora: new Date().toISOString(),
        facturaRemito: "",
        estadoPago: "Pagado",
        idMetodoPago: document.getElementById("metodoPagoCompra").value,
        observaciones: "Compra desde SolannaOS Web",
        productos: [{
            idVariante: document.getElementById("varianteCompra").value,
            cantidad: Number(document.getElementById("cantidadCompra").value),
            costoUnitario: Number(document.getElementById("costoCompra").value)
        }]
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCompra });
        alert(JSON.stringify(resultado));
    } catch (error) {
        alert("Error: " + error);
    }
}

async function guardarCliente() {
    const datosCliente = {
        tipoOperacion: "CLIENTE",
        nombreCompleto: document.getElementById("nombreCliente").value,
        telefono: document.getElementById("telefonoCliente").value,
        instagram: document.getElementById("instagramCliente").value,
        observaciones: document.getElementById("obsCliente").value
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCliente });
        alert(JSON.stringify(resultado));
    } catch (error) {
        alert("Error: " + error);
    }
}

async function guardarProducto() {
    const datosProducto = {
        tipoOperacion: "PRODUCTO",
        nombre: document.getElementById("nombreProducto").value,
        idColor: document.getElementById("colorProducto").value,
        idTalle: document.getElementById("talleProducto").value,
        costo: Number(document.getElementById("costoProducto").value),
        stockInicial: Number(document.getElementById("stockProducto").value)
    };
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosProducto });
        alert(JSON.stringify(resultado));
    } catch (error) {
        alert("Error: " + error);
    }
}
