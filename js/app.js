console.log("SolannaOS iniciado");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec";

// ⚠️ Debe ser EXACTAMENTE el mismo Client ID que pusiste en Auth.gs (GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = "642105410007-b8qd9ga1s9q7160q6ukc32u001mdd48r.apps.googleusercontent.com";

let ID_TOKEN = null;

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

function iniciarLogin() {
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("botonGoogleLogin"),
        { theme: "outline", size: "large", text: "signin_with" }
    );
    google.accounts.id.prompt();
}

function handleCredentialResponse(response) {
    ID_TOKEN = response.credential;

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "block";

    mostrarModulo("inicio");
}

function cerrarSesion() {
    ID_TOKEN = null;
    google.accounts.id.disableAutoSelect();
    document.getElementById("appScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "block";
    document.getElementById("errorLogin").textContent = "";
}

/**
 * Wrapper de fetch que agrega el idToken y maneja el caso de sesión rechazada
 * por el backend (token vencido, cuenta no autorizada, etc).
 */
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
// NAVEGACIÓN DE MÓDULOS
// ============================================================

function mostrarModulo(modulo) {

    const contenido = document.getElementById("contenido");

    if (modulo === "inicio") {
        contenido.innerHTML = `
            <h2>Dashboard</h2>
            <div class="card"><h3>Capital Real</h3><p id="kpiCapitalReal">Cargando...</p></div>
            <div class="card"><h3>Ganancia Disponible</h3><p id="kpiGananciaDisponible">Cargando...</p></div>
            <div class="card"><h3>Fondo Emergencia</h3><p id="kpiFondoEmergencia">Cargando...</p></div>
            <div class="card"><h3>Billetera Angie</h3><p id="kpiBilleteraAngie">Cargando...</p></div>
            <div class="card"><h3>Ventas del Mes</h3><p id="kpiVentasDelMes">Cargando...</p></div>
            <div class="card"><h3>Cobros Pendientes</h3><p id="kpiCobrosPendientes">Cargando...</p></div>
            <div class="card"><h3>Stock Bajo</h3><p id="kpiStockBajo">Cargando...</p></div>
            <div class="card"><h3>Reservas Activas</h3><p id="kpiReservasActivas">Cargando...</p></div>

            <hr>
            <h2>Alertas</h2>
            <div id="alertaStockBajo"><p>Cargando...</p></div>
            <div id="alertaReservas"><p>Cargando...</p></div>
            <div id="alertaDeuda"><p>Cargando...</p></div>
        `;
        cargarDashboard();
        cargarAlertas();
    }

    if (modulo === "ventas") {
        contenido.innerHTML = `
            <h2>Nueva Venta</h2>
            <input id="busquedaClienteVenta" placeholder="Buscar cliente por nombre o teléfono" oninput="buscarClientesWeb('busquedaClienteVenta','resultadosClienteVenta','clienteVenta')">
            <div id="resultadosClienteVenta"></div>
            <input id="clienteVenta" placeholder="ID Cliente">
            <br><br>
            <input id="varianteVenta" placeholder="ID Variante">
            <br><br>
            <input id="cantidadVenta" type="number" placeholder="Cantidad">
            <br><br>
            <input id="metodoPagoVenta" placeholder="ID Método de Pago (opcional)">
            <br><br>
            <button onclick="guardarVenta()">Guardar Venta</button>
            <div id="comprobanteVenta"></div>
        `;
    }

    if (modulo === "clientes") {
        contenido.innerHTML = `
            <h2>Nuevo Cliente</h2>
            <input id="nombreCliente" placeholder="Nombre Completo">
            <br><br>
            <input id="telefonoCliente" placeholder="Teléfono">
            <br><br>
            <input id="instagramCliente" placeholder="Instagram">
            <br><br>
            <input id="obsCliente" placeholder="Observaciones">
            <br><br>
            <button onclick="guardarCliente()">Guardar Cliente</button>
        `;
    }

    if (modulo === "compras") {
        contenido.innerHTML = `
            <h2>Nueva Compra</h2>
            <input id="proveedorCompra" placeholder="ID Proveedor">
            <br><br>
            <input id="varianteCompra" placeholder="ID Variante">
            <br><br>
            <input id="cantidadCompra" type="number" placeholder="Cantidad">
            <br><br>
            <input id="costoCompra" type="number" placeholder="Costo Unitario">
            <br><br>
            <input id="metodoPagoCompra" placeholder="ID Método de Pago (opcional)">
            <br><br>
            <button onclick="guardarCompra()">Guardar Compra</button>
        `;
    }

    if (modulo === "productos") {
        contenido.innerHTML = `
            <h2>Nuevo Producto</h2>
            <input id="nombreProducto" placeholder="Nombre Producto">
            <br><br>
            <input id="colorProducto" placeholder="ID Color">
            <br><br>
            <input id="talleProducto" placeholder="ID Talle">
            <br><br>
            <input id="costoProducto" type="number" placeholder="Costo">
            <br><br>
            <input id="stockProducto" type="number" placeholder="Stock Inicial">
            <br><br>
            <button onclick="guardarProducto()">Guardar Producto</button>
        `;
    }

    if (modulo === "caja") {
        contenido.innerHTML = `
            <h2>Caja</h2>
            <p>Registrar un movimiento manual (ej: retiro, gasto operativo).</p>
            <select id="tipoMovCaja">
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="MOV_INTERNO">Movimiento Interno</option>
            </select>
            <br><br>
            <input id="montoMovCaja" type="number" placeholder="Monto">
            <br><br>
            <input id="conceptoMovCaja" placeholder="Concepto">
            <br><br>
            <input id="metodoPagoMovCaja" placeholder="ID Método de Pago (opcional)">
            <br><br>
            <button onclick="guardarMovimientoCaja()">Guardar Movimiento</button>

            <hr>

            <h2>Transferir entre Bolsillos</h2>
            <p>Ej: mover parte de la Ganancia Disponible al Fondo de Emergencia o a la Billetera Angie.</p>
            <select id="bolsilloOrigenTransf">
                <option value="CAPITAL_REAL">Capital Real</option>
                <option value="GANANCIA_DISP" selected>Ganancia Disponible</option>
                <option value="FONDO_EMERG">Fondo Emergencia</option>
                <option value="BILLETERA_ANGIE">Billetera Angie</option>
            </select>
            <br><br>
            <select id="bolsilloDestinoTransf">
                <option value="CAPITAL_REAL">Capital Real</option>
                <option value="GANANCIA_DISP">Ganancia Disponible</option>
                <option value="FONDO_EMERG" selected>Fondo Emergencia</option>
                <option value="BILLETERA_ANGIE">Billetera Angie</option>
            </select>
            <br><br>
            <input id="montoTransf" type="number" placeholder="Monto a transferir">
            <br><br>
            <input id="obsTransf" placeholder="Observaciones (opcional)">
            <br><br>
            <button onclick="guardarTransferenciaBolsillo()">Transferir</button>
        `;
    }

    if (modulo === "reservas") {
        contenido.innerHTML = `
            <h2>Nueva Reserva</h2>
            <input id="clienteReserva" placeholder="ID Cliente">
            <br><br>
            <input id="varianteReserva" placeholder="ID Variante">
            <br><br>
            <input id="cantidadReserva" type="number" placeholder="Cantidad">
            <br><br>
            <input id="precioReserva" type="number" placeholder="Precio Fijado">
            <br><br>
            <input id="vencimientoReserva" type="date">
            <br><br>
            <input id="obsReserva" placeholder="Observaciones (opcional)">
            <br><br>
            <button onclick="guardarReserva()">Guardar Reserva</button>

            <hr>
            <h2>Reservas</h2>
            <button onclick="cargarReservas()">Actualizar Listado</button>
            <div id="listaReservas"><p>Cargando...</p></div>
        `;
        cargarReservas();
    }

    if (modulo === "radar") {
        contenido.innerHTML = `
            <h2>Radar de Clientes</h2>
            <input id="busquedaRadar" placeholder="Buscar por nombre, teléfono o Instagram" oninput="buscarEnRadar()">
            <div id="resultadosBusquedaRadar"></div>

            <hr>
            <h3>Clientes Frecuentes</h3>
            <div id="radarFrecuentes"><p>Cargando...</p></div>

            <h3>Clientes Inactivos</h3>
            <div id="radarInactivos"><p>Cargando...</p></div>

            <h3>Clientes con Deuda</h3>
            <div id="radarConDeuda"><p>Cargando...</p></div>

            <hr>
            <h3>Registrar Cobro de Deuda</h3>
            <p>Necesitás el ID de la venta original (la que generó la deuda).</p>
            <input id="clienteCobro" placeholder="ID Cliente">
            <br><br>
            <input id="ventaRefCobro" placeholder="ID Venta (origen de la deuda)">
            <br><br>
            <input id="montoCobro" type="number" placeholder="Monto cobrado">
            <br><br>
            <input id="metodoPagoCobro" placeholder="ID Método de Pago (opcional)">
            <br><br>
            <button onclick="registrarCobroDeuda()">Registrar Cobro</button>
        `;
        cargarRadar();
    }

    if (modulo === "admin") {
        contenido.innerHTML = `
            <h2>Administración</h2>
            <div class="card" style="border:2px solid red;">
                <h3>⚠️ Reiniciar datos de prueba</h3>
                <p>Borra TODOS los movimientos de Compras, Ventas, Stock, Envíos, Reservas,
                Cuenta Corriente, Caja Física y Bolsillos Virtuales, y pone Stock Físico y
                Stock Reservado en 0 en todas las variantes.</p>
                <p><strong>NO borra:</strong> colores, talles, categorías, etiquetas, métodos de
                pago/envío, proveedores, clientes ni productos/variantes (solo su stock).</p>
                <p><strong>Esta acción no se puede deshacer.</strong> Usarla solo antes de empezar
                a operar con datos reales, para limpiar las pruebas.</p>
                <button onclick="reiniciarDatosPruebaWeb()" style="background:red;color:white;">
                    Reiniciar datos de prueba
                </button>
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
        document.getElementById("contenido").innerHTML += `<p style="color:red;">Error al cargar el dashboard: ${error.message}</p>`;
    }
}

async function cargarAlertas() {
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=alertas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las alertas.");

        const divStock = document.getElementById("alertaStockBajo");
        divStock.innerHTML = "<h4>Stock Bajo</h4>" + (datos.stockBajo.length === 0
            ? "<p>Sin alertas de stock.</p>"
            : datos.stockBajo.map(v => `<p>⚠️ ${v.producto} (${v.idVariante}): disponible ${v.stockDisponible} / repone en ${v.puntoReposicion}</p>`).join(""));

        const divReservas = document.getElementById("alertaReservas");
        divReservas.innerHTML = "<h4>Reservas por vencer</h4>" + (datos.reservasPorVencer.length === 0
            ? "<p>Sin reservas por vencer en los próximos días.</p>"
            : datos.reservasPorVencer.map(r => `<p>⏰ ${r.idReserva} — Cliente ${r.idCliente} — Vence ${formatearFecha(r.vencimiento)} — ${formatearMoneda(r.totalReserva)}</p>`).join(""));

        const divDeuda = document.getElementById("alertaDeuda");
        divDeuda.innerHTML = "<h4>Clientes con deuda</h4>" + (datos.clientesConDeuda.length === 0
            ? "<p>Nadie tiene deuda pendiente.</p>"
            : datos.clientesConDeuda.map(c => `<p>💸 ${c.nombre} (${c.idCliente}): ${formatearMoneda(c.saldoPendiente)}</p>`).join(""));

    } catch (error) {
        console.error("Error al cargar alertas: " + error.message);
    }
}

// ============================================================
// RADAR DE CLIENTES
// ============================================================

async function cargarRadar() {
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=radarClientes" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudo cargar el radar.");

        document.getElementById("radarFrecuentes").innerHTML = datos.frecuentes.length === 0
            ? "<p>Todavía no hay clientes frecuentes.</p>"
            : datos.frecuentes.map(renderTarjetaCliente).join("");

        document.getElementById("radarInactivos").innerHTML = datos.inactivos.length === 0
            ? "<p>No hay clientes inactivos.</p>"
            : datos.inactivos.map(renderTarjetaCliente).join("");

        document.getElementById("radarConDeuda").innerHTML = datos.conDeuda.length === 0
            ? "<p>Nadie tiene deuda pendiente.</p>"
            : datos.conDeuda.map(renderTarjetaCliente).join("");

    } catch (error) {
        document.getElementById("contenido").innerHTML += `<p style="color:red;">Error al cargar el radar: ${error.message}</p>`;
    }
}

function renderTarjetaCliente(c) {
    return `
        <div class="card">
            <h3>${c.nombre} (${c.idCliente})</h3>
            <p>Última compra: ${formatearFecha(c.ultimaCompra)}</p>
            <p>Cantidad de compras: ${c.cantidadCompras}</p>
            <p>Total gastado: ${formatearMoneda(c.totalGastado)}</p>
            <p>Saldo pendiente: ${formatearMoneda(c.saldoPendiente)}</p>
        </div>
    `;
}

let timeoutBusquedaRadar = null;
function buscarEnRadar() {
    clearTimeout(timeoutBusquedaRadar);
    const q = document.getElementById("busquedaRadar").value;
    timeoutBusquedaRadar = setTimeout(async () => {
        const contenedor = document.getElementById("resultadosBusquedaRadar");
        if (!q) { contenedor.innerHTML = ""; return; }
        try {
            const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=buscarClientes&q=" + encodeURIComponent(q) });
            contenedor.innerHTML = datos.resultados.map(c => `<p>${c.nombre} — ${c.telefono} (${c.idCliente})</p>`).join("") || "<p>Sin resultados.</p>";
        } catch (error) {
            contenedor.innerHTML = "";
        }
    }, 300);
}

/**
 * Búsqueda rápida reutilizable para autocompletar el ID de cliente al vender/reservar.
 */
let timeoutBusquedaCliente = null;
function buscarClientesWeb(idInputBusqueda, idContenedorResultados, idInputDestino) {
    clearTimeout(timeoutBusquedaCliente);
    const q = document.getElementById(idInputBusqueda).value;
    timeoutBusquedaCliente = setTimeout(async () => {
        const contenedor = document.getElementById(idContenedorResultados);
        if (!q) { contenedor.innerHTML = ""; return; }
        try {
            const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=buscarClientes&q=" + encodeURIComponent(q) });
            contenedor.innerHTML = datos.resultados.map(c =>
                `<p onclick="document.getElementById('${idInputDestino}').value='${c.idCliente}'; document.getElementById('${idContenedorResultados}').innerHTML='';" style="cursor:pointer;">${c.nombre} — ${c.telefono} (${c.idCliente})</p>`
            ).join("") || "<p>Sin resultados.</p>";
        } catch (error) {
            contenedor.innerHTML = "";
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
        if (resultado.status === "SUCCESS") mostrarModulo("caja");
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
        if (resultado.status === "SUCCESS") mostrarModulo("caja");
    } catch (error) {
        alert("Error: " + error);
    }
}

// ============================================================
// RESERVAS
// ============================================================

async function cargarReservas() {
    const contenedor = document.getElementById("listaReservas");
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=reservas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las reservas.");

        if (datos.reservas.length === 0) {
            contenedor.innerHTML = "<p>No hay reservas cargadas.</p>";
            return;
        }

        contenedor.innerHTML = datos.reservas.map(r => `
            <div class="card">
                <h3>${r.idReserva} — ${r.estado}</h3>
                <p>Cliente: ${r.idCliente}</p>
                <p>Total: ${formatearMoneda(r.totalReserva)}</p>
                <p>Vencimiento: ${formatearFecha(r.vencimiento)}</p>
                ${r.estado === "ACTIVA" ? `
                    <button onclick="convertirReservaWeb('${r.idReserva}')">Convertir en Venta</button>
                    <button onclick="vencerReservaWeb('${r.idReserva}')">Vencer</button>
                    <button onclick="cancelarReservaWeb('${r.idReserva}')">Cancelar</button>
                ` : ""}
            </div>
        `).join("");
    } catch (error) {
        contenedor.innerHTML = `<p style="color:red;">Error al cargar reservas: ${error.message}</p>`;
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
        if (resultado.status === "SUCCESS") mostrarModulo("reservas");
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
// VENTAS / COMPRAS / CLIENTES / PRODUCTOS
// ============================================================

/**
 * Heurística para armar el link de WhatsApp: deja solo dígitos y, si parece
 * un celular argentino sin código de país (10 dígitos), le antepone 549.
 * Revisar/ajustar según cómo cargues los teléfonos en MST_CLIENTES.
 */
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
        <hr>
        <h3>Comprobante</h3>
        <pre style="white-space:pre-wrap;">${comprobante.textoComprobante}</pre>
        ${telefonoWa ? `<a href="${linkWa}" target="_blank"><button>Enviar por WhatsApp</button></a>` : "<p>El cliente no tiene teléfono cargado.</p>"}
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

// ============================================================
// COBRO DE DEUDA (Cuenta Corriente)
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
        if (resultado.status === "SUCCESS") mostrarModulo("radar");
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
        if (resultado.status === "SUCCESS") mostrarModulo("inicio");
    } catch (error) {
        alert("Error: " + error);
    }
}
