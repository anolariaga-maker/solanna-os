console.log("SolannaOS iniciado");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec";

function formatearMoneda(numero) {
    const valor = Number(numero) || 0;
    return "$" + valor.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

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
        `;

        cargarDashboard();
    }

    if (modulo === "ventas") {
        contenido.innerHTML = `
            <h2>Nueva Venta</h2>
            <input id="clienteVenta" placeholder="ID Cliente">
            <br><br>
            <input id="varianteVenta" placeholder="ID Variante">
            <br><br>
            <input id="cantidadVenta" type="number" placeholder="Cantidad">
            <br><br>
            <input id="metodoPagoVenta" placeholder="ID Método de Pago (opcional)">
            <br><br>
            <button onclick="guardarVenta()">Guardar Venta</button>
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
}

async function cargarDashboard() {
    try {
        const respuesta = await fetch(WEB_APP_URL + "?accion=dashboard");
        const datos = await respuesta.json();

        if (datos.status !== "SUCCESS") {
            throw new Error(datos.mensaje || "No se pudo cargar el dashboard.");
        }

        document.getElementById("kpiCapitalReal").textContent = formatearMoneda(datos.capitalReal);
        document.getElementById("kpiGananciaDisponible").textContent = formatearMoneda(datos.gananciaDisponible);
        document.getElementById("kpiFondoEmergencia").textContent = formatearMoneda(datos.fondoEmergencia);
        document.getElementById("kpiBilleteraAngie").textContent = formatearMoneda(datos.billeteraAngie);
        document.getElementById("kpiVentasDelMes").textContent = formatearMoneda(datos.ventasDelMes);
        document.getElementById("kpiCobrosPendientes").textContent = formatearMoneda(datos.cobrosPendientes);
        document.getElementById("kpiStockBajo").textContent = datos.stockBajo;
        document.getElementById("kpiReservasActivas").textContent = datos.reservasActivas;

    } catch (error) {
        const contenido = document.getElementById("contenido");
        contenido.innerHTML += `<p style="color:red;">Error al cargar el dashboard: ${error.message}</p>`;
    }
}

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
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosCaja)
        });
        const resultado = await respuesta.json();
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") {
            mostrarModulo("caja");
        }
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
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosTransferencia)
        });
        const resultado = await respuesta.json();
        alert(JSON.stringify(resultado));
        if (resultado.status === "SUCCESS") {
            mostrarModulo("caja");
        }
    } catch (error) {
        alert("Error: " + error);
    }
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
        productos: [
            {
                idVariante: document.getElementById("varianteVenta").value,
                cantidad: Number(document.getElementById("cantidadVenta").value),
                precioUnitario: 8000
            }
        ]
    };

    try {
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosVenta)
        });
        const resultado = await respuesta.json();
        alert(JSON.stringify(resultado));
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
        productos: [
            {
                idVariante: document.getElementById("varianteCompra").value,
                cantidad: Number(document.getElementById("cantidadCompra").value),
                costoUnitario: Number(document.getElementById("costoCompra").value)
            }
        ]
    };

    try {
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosCompra)
        });
        const resultado = await respuesta.json();
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
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosCliente)
        });
        const resultado = await respuesta.json();
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
        const respuesta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(datosProducto)
        });
        const resultado = await respuesta.json();
        alert(JSON.stringify(resultado));
    } catch (error) {
        alert("Error: " + error);
    }
}
