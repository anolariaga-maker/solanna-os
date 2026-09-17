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
// MODO CLARO / OSCURO
// ============================================================

function alternarTema() {
    const actual = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nuevo = actual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    try { localStorage.setItem("solannaos-theme", nuevo); } catch (e) { /* sigue funcionando sin recordar */ }
    actualizarBotonTema(nuevo);
}

function actualizarBotonTema(tema) {
    const etiqueta = document.getElementById("etiquetaTema");
    const icono = document.getElementById("iconoTema");
    if (!etiqueta || !icono) return;
    if (tema === "dark") {
        etiqueta.textContent = "Modo claro";
        icono.innerHTML = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
    } else {
        etiqueta.textContent = "Modo oscuro";
        icono.innerHTML = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>';
    }
}

// ============================================================
// SISTEMA DE NOTIFICACIONES (reemplaza alert())
// ============================================================

const ICONOS_TOAST = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 18a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>'
};

function mostrarNotificacion(mensaje, tipo) {
    tipo = ICONOS_TOAST[tipo] ? tipo : "info";
    const contenedor = document.getElementById("toastContainer");
    if (!contenedor) { console.log("[" + tipo + "] " + mensaje); return; }

    const toast = document.createElement("div");
    toast.className = "toast toast-" + tipo;
    toast.innerHTML = ICONOS_TOAST[tipo] + `<span>${mensaje}</span><button class="toast-cerrar" aria-label="Cerrar notificación">×</button>`;
    toast.querySelector(".toast-cerrar").onclick = () => toast.remove();

    contenedor.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4500);
}

/** Traduce el resultado estándar {status, mensaje} del backend a un toast. */
function notificarResultado(resultado, mensajeExito) {
    if (resultado.status === "SUCCESS") {
        mostrarNotificacion(mensajeExito, "success");
    } else {
        mostrarNotificacion(resultado.mensaje || "Ocurrió un error inesperado.", "error");
    }
    return resultado.status === "SUCCESS";
}

// ============================================================
// MODAL DE CONFIRMACIÓN (reemplaza confirm()/prompt())
// ============================================================

function pedirConfirmacion(opciones) {
    const overlay = document.getElementById("modalOverlay");
    const box = document.getElementById("modalBox");
    const elTitulo = document.getElementById("modalTitulo");
    const elMensaje = document.getElementById("modalMensaje");
    const elCampoTexto = document.getElementById("modalCampoTexto");
    const btnCancelar = document.getElementById("modalBotonCancelar");
    const btnConfirmar = document.getElementById("modalBotonConfirmar");

    elTitulo.textContent = opciones.titulo || "¿Confirmás esta acción?";
    elMensaje.textContent = opciones.mensaje || "";
    btnConfirmar.textContent = opciones.textoConfirmar || "Confirmar";
    btnConfirmar.className = "btn btn-sm " + (opciones.tipo === "danger" ? "btn-danger" : "btn-primary");
    box.classList.toggle("modal-danger", opciones.tipo === "danger");

    let inputTexto = null;
    if (opciones.requiereTexto) {
        elCampoTexto.innerHTML = `
            <div class="field">
                <label for="modalInputConfirmacion">Escribí "${opciones.requiereTexto}" para confirmar</label>
                <input type="text" id="modalInputConfirmacion" autocomplete="off">
            </div>`;
        inputTexto = document.getElementById("modalInputConfirmacion");
    } else {
        elCampoTexto.innerHTML = "";
    }

    overlay.classList.add("visible");
    setTimeout(() => { (inputTexto || btnConfirmar).focus(); }, 30);

    return new Promise(resolve => {
        function cerrar(resultado) {
            overlay.classList.remove("visible");
            document.removeEventListener("keydown", alEscape);
            resolve(resultado);
        }
        function alConfirmar() {
            if (opciones.requiereTexto && (!inputTexto || inputTexto.value !== opciones.requiereTexto)) {
                mostrarNotificacion("El texto no coincide. No se realizó ningún cambio.", "error");
                return;
            }
            cerrar(true);
        }
        function alEscape(e) { if (e.key === "Escape") cerrar(false); }

        btnConfirmar.onclick = alConfirmar;
        btnCancelar.onclick = () => cerrar(false);
        overlay.onclick = (e) => { if (e.target === overlay) cerrar(false); };
        document.addEventListener("keydown", alEscape);
    });
}

// ============================================================
// LOADER
// ============================================================

async function ejecutarConLoader(boton, textoCargando, fnAsync) {
    if (!boton) return fnAsync();
    const textoOriginal = boton.innerHTML;
    boton.dataset.cargando = "1";
    boton.innerHTML = `<span class="spinner"></span> ${textoCargando || "Procesando..."}`;
    try {
        return await fnAsync();
    } finally {
        boton.dataset.cargando = "0";
        boton.innerHTML = textoOriginal;
    }
}

function mostrarCargandoEn(idContenedor, texto) {
    const el = document.getElementById(idContenedor);
    if (el) el.innerHTML = `<div class="loader-bloque"><span class="spinner spinner-lg"></span> ${texto || "Cargando..."}</div>`;
}

// ============================================================
// COMPONENTES REUTILIZABLES
// ============================================================

const ETIQUETAS_ESTADO = {
    ACTIVA: { clase: "badge-activa", texto: "Activa" },
    ENTREGADA: { clase: "badge-entregada", texto: "Entregada" },
    CANCELADA: { clase: "badge-cancelada", texto: "Cancelada" },
    VENCIDA: { clase: "badge-vencida", texto: "Vencida" },
    CONTADO: { clase: "badge-contado", texto: "Contado" },
    CREDITO_TOTAL: { clase: "badge-credito-total", texto: "Crédito total" },
    CREDITO_PARCIAL: { clase: "badge-credito-parcial", texto: "Crédito parcial" }
};

function badgeEstado(estado) {
    const info = ETIQUETAS_ESTADO[estado] || { clase: "badge-cancelada", texto: estado || "-" };
    return `<span class="badge ${info.clase}">${info.texto}</span>`;
}

function estadoVacioHTML(titulo, mensaje) {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
            </div>
            <strong>${titulo}</strong>
            <span>${mensaje}</span>
        </div>
    `;
}

function tablaHTML(columnas, filasHtml, vacioTitulo, vacioMensaje) {
    if (!filasHtml || filasHtml.length === 0) {
        return estadoVacioHTML(vacioTitulo, vacioMensaje);
    }
    return `
        <div class="table-wrap">
            <table>
                <thead><tr>${columnas.map(c => `<th>${c}</th>`).join("")}</tr></thead>
                <tbody>${filasHtml.join("")}</tbody>
            </table>
        </div>
    `;
}

function campoTexto(opts) {
    return `
        <div class="field ${opts.avanzado ? "avanzado" : ""}">
            <label for="${opts.id}">${opts.label}</label>
            <input id="${opts.id}" type="${opts.tipo || "text"}" placeholder="${opts.placeholder || ""}"${opts.autocomplete === false ? ' autocomplete="off"' : ""}>
            ${opts.hint ? `<span class="hint">${opts.hint}</span>` : ""}
        </div>
    `;
}

function campoSelect(opts) {
    return `
        <div class="field">
            <label for="${opts.id}">${opts.label}</label>
            <select id="${opts.id}">
                ${opts.opciones.map(o => `<option value="${o.valor}" ${o.selected ? "selected" : ""}>${o.texto}</option>`).join("")}
            </select>
        </div>
    `;
}

function extraerEstadoDeComprobante(texto) {
    const match = texto.match(/Estado:\s*(\S+)/);
    return match ? match[1] : null;
}

// ============================================================
// LOGIN CON GOOGLE (Login restringido)
// ============================================================

function onGoogleIdentityReady() {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
        onGoogleIdentityFailed();
        return;
    }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
    google.accounts.id.renderButton(document.getElementById("botonGoogleLogin"), { theme: "outline", size: "large", text: "signin_with", shape: "pill" });
    google.accounts.id.prompt();
}

function onGoogleIdentityFailed() {
    const elError = document.getElementById("errorLogin");
    if (elError) {
        elError.textContent = "No se pudo cargar el inicio de sesión de Google. Revisá tu conexión a internet y recargá la página.";
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
    document.getElementById("appScreen").style.display = "grid";
    actualizarBotonTema(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    irAModulo("inicio");
}

function cerrarSesion() {
    ID_TOKEN = null;
    if (typeof google !== "undefined" && google.accounts) google.accounts.id.disableAutoSelect();
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
        mostrarNotificacion(resultado.mensaje, "error");
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
        const activo = btn.dataset.modulo === modulo;
        btn.classList.toggle("active", activo);
        if (activo) btn.setAttribute("aria-current", "page"); else btn.removeAttribute("aria-current");
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

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarMenuMovil();
});

// ============================================================
// RENDERIZADO DE MÓDULOS
// ============================================================

function mostrarModulo(modulo) {
    const contenido = document.getElementById("contenido");

    if (modulo === "inicio") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Inicio</h2><p class="page-sub">Así está SolannaOS hoy.</p></div></div>

            <div class="kpi-grid">
                <div class="kpi-card kpi-hero"><div class="kpi-label">Capital Real</div><div class="kpi-value" id="kpiCapitalReal">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Ganancia Disponible</div><div class="kpi-value" id="kpiGananciaDisponible">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Ventas del Mes</div><div class="kpi-value" id="kpiVentasDelMes">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Fondo Emergencia</div><div class="kpi-value" id="kpiFondoEmergencia">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Cobros Pendientes</div><div class="kpi-value" id="kpiCobrosPendientes">—</div></div>
            </div>

            <div class="kpi-grid-secundaria">
                <div class="kpi-card"><div class="kpi-label">Billetera Angie</div><div class="kpi-value" id="kpiBilleteraAngie">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Stock Bajo</div><div class="kpi-value" id="kpiStockBajo">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Reservas Activas</div><div class="kpi-value" id="kpiReservasActivas">—</div></div>
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
                    <label for="busquedaClienteVenta">Cliente</label>
                    <input id="busquedaClienteVenta" type="text" placeholder="Buscá por nombre o teléfono" oninput="buscarClientesWeb('busquedaClienteVenta','resultadosClienteVenta','clienteVenta')">
                    <div id="resultadosClienteVenta" class="search-results" style="display:none;"></div>
                </div>
                ${campoTexto({ id: "clienteVenta", label: "ID de cliente", placeholder: "Se completa solo al elegir arriba", avanzado: true })}
                ${campoTexto({ id: "varianteVenta", label: "Producto (ID de variante)", placeholder: "Ej: VAR-A1B2C3D4", avanzado: true, hint: "Lo encontrás en el módulo Productos." })}
                ${campoTexto({ id: "cantidadVenta", label: "Cantidad", placeholder: "1", tipo: "number" })}
                ${campoTexto({ id: "metodoPagoVenta", label: "Método de pago (opcional)", placeholder: "Ej: efectivo, transferencia" })}
                <button class="btn btn-primary btn-block" id="btnGuardarVenta" onclick="guardarVenta()">Guardar venta</button>
                <div id="comprobanteVenta">${estadoVacioHTML("Sin ventas todavía", "Cuando registres una venta, el comprobante va a aparecer acá.")}</div>
            </div>
        `;
    }

    if (modulo === "clientes") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Clientes</h2><p class="page-sub">Sumá un cliente nuevo a SolannaOS.</p></div></div>
            <div class="card" style="max-width:480px;">
                ${campoTexto({ id: "nombreCliente", label: "Nombre completo", placeholder: "Ej: Sofía Martínez" })}
                ${campoTexto({ id: "telefonoCliente", label: "Teléfono", placeholder: "Para enviar el comprobante por WhatsApp" })}
                ${campoTexto({ id: "instagramCliente", label: "Instagram", placeholder: "@usuario (opcional)" })}
                ${campoTexto({ id: "obsCliente", label: "Observaciones", placeholder: "Opcional" })}
                <button class="btn btn-primary btn-block" id="btnGuardarCliente" onclick="guardarCliente()">Guardar cliente</button>
            </div>
        `;
    }

    if (modulo === "compras") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Compras</h2><p class="page-sub">Registrá mercadería que entra al local.</p></div></div>
            <div class="card" style="max-width:480px;">
                ${campoTexto({ id: "proveedorCompra", label: "ID de proveedor", placeholder: "Ej: PROV-001", avanzado: true })}
                ${campoTexto({ id: "varianteCompra", label: "Producto (ID de variante)", placeholder: "Ej: VAR-A1B2C3D4", avanzado: true })}
                ${campoTexto({ id: "cantidadCompra", label: "Cantidad", placeholder: "1", tipo: "number" })}
                ${campoTexto({ id: "costoCompra", label: "Costo unitario", placeholder: "$", tipo: "number" })}
                ${campoTexto({ id: "metodoPagoCompra", label: "Método de pago (opcional)", placeholder: "Ej: efectivo, transferencia" })}
                <button class="btn btn-primary btn-block" id="btnGuardarCompra" onclick="guardarCompra()">Guardar compra</button>
            </div>
        `;
    }

    if (modulo === "productos") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Productos</h2><p class="page-sub">Cargá un producto nuevo con su primera variante.</p></div></div>
            <div class="card" style="max-width:480px;">
                ${campoTexto({ id: "nombreProducto", label: "Nombre del producto", placeholder: "Ej: Conjunto Sofía" })}
                <div class="form-grid">
                    ${campoTexto({ id: "colorProducto", label: "ID de color", placeholder: "Ej: COL-01", avanzado: true })}
                    ${campoTexto({ id: "talleProducto", label: "ID de talle", placeholder: "Ej: TAL-M", avanzado: true })}
                </div>
                <div class="form-grid">
                    ${campoTexto({ id: "costoProducto", label: "Costo", placeholder: "$", tipo: "number" })}
                    ${campoTexto({ id: "stockProducto", label: "Stock inicial", placeholder: "0", tipo: "number" })}
                </div>
                <button class="btn btn-primary btn-block" id="btnGuardarProducto" onclick="guardarProducto()">Guardar producto</button>
            </div>
        `;
    }

    if (modulo === "caja") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Caja</h2><p class="page-sub">Movimientos manuales y transferencias entre bolsillos.</p></div></div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Nuevo movimiento de Caja</h3></div>
                ${campoSelect({ id: "tipoMovCaja", label: "Tipo", opciones: [
                    { valor: "INGRESO", texto: "Ingreso" },
                    { valor: "EGRESO", texto: "Egreso" },
                    { valor: "MOV_INTERNO", texto: "Movimiento interno" }
                ]})}
                ${campoTexto({ id: "montoMovCaja", label: "Monto", placeholder: "$", tipo: "number" })}
                ${campoTexto({ id: "conceptoMovCaja", label: "Concepto", placeholder: "Ej: Retiro personal" })}
                ${campoTexto({ id: "metodoPagoMovCaja", label: "ID de método de pago (opcional)", placeholder: "Opcional", avanzado: true })}
                <button class="btn btn-primary btn-block" id="btnGuardarCaja" onclick="guardarMovimientoCaja()">Guardar movimiento</button>
            </div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Transferir entre bolsillos</h3></div>
                <p class="page-sub" style="margin-bottom:16px;">Ej: mover parte de la Ganancia Disponible al Fondo de Emergencia o a la Billetera Angie.</p>
                <div class="form-grid">
                    ${campoSelect({ id: "bolsilloOrigenTransf", label: "Desde", opciones: [
                        { valor: "CAPITAL_REAL", texto: "Capital Real" },
                        { valor: "GANANCIA_DISP", texto: "Ganancia Disponible", selected: true },
                        { valor: "FONDO_EMERG", texto: "Fondo Emergencia" },
                        { valor: "BILLETERA_ANGIE", texto: "Billetera Angie" }
                    ]})}
                    ${campoSelect({ id: "bolsilloDestinoTransf", label: "Hacia", opciones: [
                        { valor: "CAPITAL_REAL", texto: "Capital Real" },
                        { valor: "GANANCIA_DISP", texto: "Ganancia Disponible" },
                        { valor: "FONDO_EMERG", texto: "Fondo Emergencia", selected: true },
                        { valor: "BILLETERA_ANGIE", texto: "Billetera Angie" }
                    ]})}
                </div>
                ${campoTexto({ id: "montoTransf", label: "Monto a transferir", placeholder: "$", tipo: "number" })}
                ${campoTexto({ id: "obsTransf", label: "Observaciones (opcional)", placeholder: "Opcional" })}
                <button class="btn btn-secondary btn-block" id="btnGuardarTransf" onclick="guardarTransferenciaBolsillo()">Transferir</button>
            </div>
        `;
    }

    if (modulo === "reservas") {
        contenido.innerHTML = `
            <div class="page-header"><div><h2>Reservas</h2><p class="page-sub">Apartá mercadería sin sacarla del stock físico.</p></div></div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Nueva reserva</h3></div>
                ${campoTexto({ id: "clienteReserva", label: "ID de cliente", placeholder: "Ej: CLI-A1B2C3D4", avanzado: true })}
                ${campoTexto({ id: "varianteReserva", label: "Producto (ID de variante)", placeholder: "Ej: VAR-A1B2C3D4", avanzado: true })}
                <div class="form-grid">
                    ${campoTexto({ id: "cantidadReserva", label: "Cantidad", placeholder: "1", tipo: "number" })}
                    ${campoTexto({ id: "precioReserva", label: "Precio fijado", placeholder: "$", tipo: "number" })}
                </div>
                ${campoTexto({ id: "vencimientoReserva", label: "Vencimiento", tipo: "date" })}
                ${campoTexto({ id: "obsReserva", label: "Observaciones (opcional)", placeholder: "Opcional" })}
                <button class="btn btn-primary btn-block" id="btnGuardarReserva" onclick="guardarReserva()">Guardar reserva</button>
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
                <label for="busquedaRadar">Buscar cliente</label>
                <input id="busquedaRadar" type="text" placeholder="Nombre, teléfono o Instagram" oninput="buscarEnRadar()">
                <div id="resultadosBusquedaRadar" class="search-results" style="display:none;"></div>
            </div>

            <div class="card"><div class="card-header"><h3>Clientes frecuentes</h3></div><div id="radarFrecuentes"></div></div>
            <div class="card"><div class="card-header"><h3>Clientes inactivos</h3></div><div id="radarInactivos"></div></div>
            <div class="card"><div class="card-header"><h3>Clientes con deuda</h3></div><div id="radarConDeuda"></div></div>
            <div class="card"><div class="card-header"><h3>Todos los clientes</h3></div><div id="radarTodos"></div></div>

            <div class="card" style="max-width:480px;">
                <div class="card-header"><h3>Registrar cobro de deuda</h3></div>
                <p class="page-sub" style="margin-bottom:16px;">Necesitás el ID de la venta original que generó la deuda.</p>
                ${campoTexto({ id: "clienteCobro", label: "ID de cliente", placeholder: "Ej: CLI-A1B2C3D4", avanzado: true })}
                ${campoTexto({ id: "ventaRefCobro", label: "ID de venta (origen de la deuda)", placeholder: "Ej: uuid de la venta", avanzado: true })}
                <div class="form-grid">
                    ${campoTexto({ id: "montoCobro", label: "Monto cobrado", placeholder: "$", tipo: "number" })}
                    ${campoTexto({ id: "metodoPagoCobro", label: "Método de pago (opcional)", placeholder: "Opcional" })}
                </div>
                <button class="btn btn-primary btn-block" id="btnRegistrarCobro" onclick="registrarCobroDeuda()">Registrar cobro</button>
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
        mostrarNotificacion("Error al cargar el dashboard: " + error.message, "error");
    }
}

async function cargarAlertas() {
    mostrarCargandoEn("alertaStockBajo", "Cargando alertas...");
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=alertas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las alertas.");

        document.getElementById("alertaStockBajo").innerHTML = renderListaAlertas(
            "Stock bajo", datos.stockBajo,
            v => `<strong>${v.producto}</strong> — disponible ${v.stockDisponible} (repone en ${v.puntoReposicion})`, "danger"
        );
        document.getElementById("alertaReservas").innerHTML = renderListaAlertas(
            "Reservas por vencer", datos.reservasPorVencer,
            r => `Reserva de <strong>${formatearMoneda(r.totalReserva)}</strong> vence el ${formatearFecha(r.vencimiento)}`, ""
        );
        document.getElementById("alertaDeuda").innerHTML = renderListaAlertas(
            "Clientes con deuda", datos.clientesConDeuda,
            c => `<strong>${c.nombre}</strong> debe ${formatearMoneda(c.saldoPendiente)}`, ""
        );
    } catch (error) {
        document.getElementById("alertaStockBajo").innerHTML = "";
        mostrarNotificacion("Error al cargar alertas: " + error.message, "error");
    }
}

function renderListaAlertas(titulo, items, renderItem, tipoDot) {
    let html = `<h4 style="font-size:14px;color:var(--ink-soft);font-weight:600;margin:14px 0 4px 0;">${titulo}</h4>`;
    if (!items || items.length === 0) {
        html += `<p class="alert-empty">Sin novedades por acá.</p>`;
        return html;
    }
    html += `<div class="alert-list">` + items.map(item => `
        <div class="alert-item"><span class="alert-dot ${tipoDot}"></span><span>${renderItem(item)}</span></div>
    `).join("") + `</div>`;
    return html;
}

// ============================================================
// RADAR DE CLIENTES
// ============================================================

async function cargarRadar() {
    mostrarCargandoEn("radarFrecuentes", "Cargando clientes...");
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=radarClientes" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudo cargar el radar.");

        document.getElementById("radarFrecuentes").innerHTML = renderListaClientes(datos.frecuentes, "Todavía no hay clientes frecuentes", "Vuelven a comprar 3 veces o más y van a aparecer acá.");
        document.getElementById("radarInactivos").innerHTML = renderListaClientes(datos.inactivos, "No hay clientes inactivos", "Nadie lleva más de 60 días sin comprar.");
        document.getElementById("radarConDeuda").innerHTML = renderListaClientes(datos.conDeuda, "Nadie tiene deuda pendiente", "Cuando alguien compre a crédito, va a aparecer acá.");

        document.getElementById("radarTodos").innerHTML = tablaHTML(
            ["Cliente", "Última compra", "Compras", "Total gastado", "Saldo"],
            (datos.clientes || []).map(c => `
                <tr>
                    <td>${c.nombre}<span class="id-chip">${c.idCliente}</span></td>
                    <td>${formatearFecha(c.ultimaCompra)}</td>
                    <td>${c.cantidadCompras}</td>
                    <td class="num">${formatearMoneda(c.totalGastado)}</td>
                    <td class="num">${formatearMoneda(c.saldoPendiente)}</td>
                </tr>
            `),
            "Todavía no cargaste clientes",
            "Sumá tu primer cliente desde el módulo Clientes."
        );
    } catch (error) {
        document.getElementById("radarFrecuentes").innerHTML = "";
        mostrarNotificacion("Error al cargar el radar: " + error.message, "error");
    }
}

function renderListaClientes(lista, tituloVacio, mensajeVacio) {
    if (!lista || lista.length === 0) return estadoVacioHTML(tituloVacio, mensajeVacio);
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
        } catch (error) { contenedor.style.display = "none"; }
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
        } catch (error) { contenedor.style.display = "none"; }
    }, 300);
}

// ============================================================
// CAJA Y BOLSILLOS
// ============================================================

async function guardarMovimientoCaja() {
    const boton = document.getElementById("btnGuardarCaja");
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
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCaja }));
        if (notificarResultado(resultado, "Movimiento de caja guardado.")) irAModulo("caja");
    } catch (error) { /* llamarBackend ya notificó */ }
}

async function guardarTransferenciaBolsillo() {
    const bolsilloOrigen = document.getElementById("bolsilloOrigenTransf").value;
    const bolsilloDestino = document.getElementById("bolsilloDestinoTransf").value;
    if (bolsilloOrigen === bolsilloDestino) {
        mostrarNotificacion("El bolsillo origen y destino no pueden ser el mismo.", "warning");
        return;
    }
    const monto = Number(document.getElementById("montoTransf").value);
    const ok = await pedirConfirmacion({
        titulo: "Transferir entre bolsillos",
        mensaje: `¿Transferir ${formatearMoneda(monto)} de ${bolsilloOrigen.replace("_"," ")} a ${bolsilloDestino.replace("_"," ")}?`,
        tipo: "danger",
        textoConfirmar: "Sí, transferir"
    });
    if (!ok) return;

    const boton = document.getElementById("btnGuardarTransf");
    const datosTransferencia = {
        tipoOperacion: "TRANSFERENCIA_BOLSILLO",
        fechaHora: new Date().toISOString(),
        bolsilloOrigen: bolsilloOrigen,
        bolsilloDestino: bolsilloDestino,
        monto: monto,
        observaciones: document.getElementById("obsTransf").value
    };
    try {
        const resultado = await ejecutarConLoader(boton, "Transfiriendo...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosTransferencia }));
        if (notificarResultado(resultado, "Transferencia realizada.")) irAModulo("caja");
    } catch (error) { /* ya notificado */ }
}

// ============================================================
// RESERVAS
// ============================================================

async function cargarReservas() {
    const contenedor = document.getElementById("listaReservas");
    if (!contenedor) return;
    mostrarCargandoEn("listaReservas", "Cargando reservas...");
    try {
        const datos = await llamarBackend({ url: WEB_APP_URL + "?accion=reservas" });
        if (datos.status !== "SUCCESS") throw new Error(datos.mensaje || "No se pudieron cargar las reservas.");

        contenedor.innerHTML = tablaHTML(
            ["Cliente", "Total", "Vencimiento", "Estado", ""],
            datos.reservas.map(r => `
                <tr>
                    <td>${r.idCliente}</td>
                    <td class="num">${formatearMoneda(r.totalReserva)}</td>
                    <td>${formatearFecha(r.vencimiento)}</td>
                    <td>${badgeEstado(r.estado)}</td>
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
            `),
            "Sin reservas cargadas",
            "Las reservas que crees van a aparecer en esta tabla."
        );
    } catch (error) {
        contenedor.innerHTML = "";
        mostrarNotificacion("Error al cargar reservas: " + error.message, "error");
    }
}

async function guardarReserva() {
    const boton = document.getElementById("btnGuardarReserva");
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
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosReserva }));
        if (notificarResultado(resultado, "Reserva creada.")) irAModulo("reservas");
    } catch (error) { /* ya notificado */ }
}

async function cancelarReservaWeb(idReserva) {
    const ok = await pedirConfirmacion({
        titulo: "Cancelar reserva",
        mensaje: `¿Cancelar la reserva de ${idReserva}? El stock reservado se libera al instante.`,
        tipo: "danger",
        textoConfirmar: "Sí, cancelar"
    });
    if (!ok) return;
    await ejecutarAccionReserva("CANCELAR_RESERVA", idReserva, {}, "Reserva cancelada.");
}

async function vencerReservaWeb(idReserva) {
    const ok = await pedirConfirmacion({
        titulo: "Marcar como vencida",
        mensaje: `¿Marcar la reserva de ${idReserva} como vencida? El stock reservado se libera.`,
        tipo: "danger",
        textoConfirmar: "Sí, marcar vencida"
    });
    if (!ok) return;
    await ejecutarAccionReserva("VENCER_RESERVA", idReserva, {}, "Reserva marcada como vencida.");
}

async function convertirReservaWeb(idReserva) {
    const ok = await pedirConfirmacion({
        titulo: "Convertir en venta",
        mensaje: `¿Convertir la reserva de ${idReserva} en una venta CONTADO? Esta acción descuenta el stock físico.`,
        tipo: "danger",
        textoConfirmar: "Sí, convertir"
    });
    if (!ok) return;
    await ejecutarAccionReserva("CONVERTIR_RESERVA", idReserva, { estadoCobro: "CONTADO" }, "Reserva convertida en venta.");
}

async function ejecutarAccionReserva(tipoOperacion, idReserva, datosExtra, mensajeExito) {
    const datos = Object.assign({ tipoOperacion: tipoOperacion, idReserva: idReserva, fechaHora: new Date().toISOString() }, datosExtra || {});
    try {
        const resultado = await llamarBackend({ url: WEB_APP_URL, method: "POST", body: datos });
        if (notificarResultado(resultado, mensajeExito || "Listo.")) cargarReservas();
    } catch (error) { /* ya notificado */ }
}

// ============================================================
// COBRO DE DEUDA
// ============================================================

async function registrarCobroDeuda() {
    const boton = document.getElementById("btnRegistrarCobro");
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
        const resultado = await ejecutarConLoader(boton, "Registrando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCobro }));
        if (notificarResultado(resultado, "Cobro registrado.")) irAModulo("radar");
    } catch (error) { /* ya notificado */ }
}

// ============================================================
// ADMINISTRACIÓN — Reiniciar datos de prueba
// ============================================================

async function reiniciarDatosPruebaWeb() {
    const primeraConfirmacion = await pedirConfirmacion({
        titulo: "Reiniciar datos de prueba",
        mensaje: "Esto borra TODOS los movimientos de Compras, Ventas, Stock, Reservas, Cuenta Corriente, Caja y Bolsillos. No se puede deshacer.",
        tipo: "danger",
        textoConfirmar: "Entiendo, continuar"
    });
    if (!primeraConfirmacion) return;

    const confirmado = await pedirConfirmacion({
        titulo: "Última confirmación",
        mensaje: "Para asegurarnos de que es intencional, escribí la palabra de confirmación exacta.",
        tipo: "danger",
        textoConfirmar: "Reiniciar ahora",
        requiereTexto: "REINICIAR-SOLANNAOS"
    });
    if (!confirmado) return;

    try {
        const resultado = await llamarBackend({
            url: WEB_APP_URL,
            method: "POST",
            body: { tipoOperacion: "REINICIAR_DATOS_PRUEBA", confirmacion: "REINICIAR-SOLANNAOS" }
        });
        if (notificarResultado(resultado, "Datos de prueba reiniciados. Configuración y maestros quedaron intactos.")) irAModulo("inicio");
    } catch (error) { /* ya notificado */ }
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
    const estado = extraerEstadoDeComprobante(comprobante.textoComprobante);

    contenedor.innerHTML = `
        <div class="comprobante-card">
            <div class="card-header"><h3>Comprobante</h3>${estado ? badgeEstado(estado) : ""}</div>
            <div class="comprobante-texto">${comprobante.textoComprobante}</div>
            ${telefonoWa
                ? `<a href="${linkWa}" target="_blank"><button class="btn btn-primary">Enviar por WhatsApp</button></a>`
                : `<p class="page-sub">El cliente no tiene teléfono cargado.</p>`}
        </div>
    `;
}

async function guardarVenta() {
    const boton = document.getElementById("btnGuardarVenta");
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
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosVenta }));
        if (resultado.status === "SUCCESS") {
            mostrarNotificacion("Venta guardada por " + formatearMoneda(resultado.total) + ".", "success");
            mostrarComprobante(resultado.comprobante);
        } else {
            mostrarNotificacion(resultado.mensaje || "No se pudo guardar la venta.", "error");
        }
    } catch (error) { /* ya notificado */ }
}

async function guardarCompra() {
    const boton = document.getElementById("btnGuardarCompra");
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
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCompra }));
        notificarResultado(resultado, "Compra registrada por " + formatearMoneda(resultado.total) + ".");
    } catch (error) { /* ya notificado */ }
}

async function guardarCliente() {
    const boton = document.getElementById("btnGuardarCliente");
    const datosCliente = {
        tipoOperacion: "CLIENTE",
        nombreCompleto: document.getElementById("nombreCliente").value,
        telefono: document.getElementById("telefonoCliente").value,
        instagram: document.getElementById("instagramCliente").value,
        observaciones: document.getElementById("obsCliente").value
    };
    try {
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosCliente }));
        notificarResultado(resultado, "Cliente creado.");
    } catch (error) { /* ya notificado */ }
}

async function guardarProducto() {
    const boton = document.getElementById("btnGuardarProducto");
    const datosProducto = {
        tipoOperacion: "PRODUCTO",
        nombre: document.getElementById("nombreProducto").value,
        idColor: document.getElementById("colorProducto").value,
        idTalle: document.getElementById("talleProducto").value,
        costo: Number(document.getElementById("costoProducto").value),
        stockInicial: Number(document.getElementById("stockProducto").value)
    };
    try {
        const resultado = await ejecutarConLoader(boton, "Guardando...", () => llamarBackend({ url: WEB_APP_URL, method: "POST", body: datosProducto }));
        notificarResultado(resultado, "Producto creado.");
    } catch (error) { /* ya notificado */ }
}
