console.log("SolannaOS iniciado");

function mostrarModulo(modulo) {

    const contenido = document.getElementById("contenido");

    if (modulo === "ventas") {

        contenido.innerHTML = `
            <h2>Nueva Venta</h2>

            <input id="clienteVenta" placeholder="ID Cliente">

            <br><br>

            <input id="varianteVenta" placeholder="ID Variante">

            <br><br>

            <input id="cantidadVenta" type="number" placeholder="Cantidad">

            <br><br>

            <button onclick="guardarVenta()">
                Guardar Venta
            </button>
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

        <button onclick="guardarCliente()">
            Guardar Cliente
        </button>
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

        <button onclick="guardarCompra()">
            Guardar Compra
        </button>
    `;
}
    if (modulo === "caja") {

        contenido.innerHTML = `
            <h2>Caja</h2>
            <p>Próximamente</p>
        `;
    }
}

async function guardarVenta() {
    

    const datosVenta = {

tipoOperacion: "VENTA",
        
        idCliente: document.getElementById("clienteVenta").value,

        fechaHora: new Date().toISOString(),

        descMonto: 0,

        estadoCobro: "CONTADO",

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

        const respuesta = await fetch(
            "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec",
            {
                method: "POST",
                body: JSON.stringify(datosVenta)
            }
        );

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

        const respuesta = await fetch(
            "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec",
            {
                method: "POST",
                body: JSON.stringify(datosCompra)
            }
        );

        const resultado = await respuesta.json();

        alert(JSON.stringify(resultado));

    } catch (error) {

        alert("Error: " + error);

    }
}

async function guardarCliente() {

    alert("Cliente listo para conectar");
}
