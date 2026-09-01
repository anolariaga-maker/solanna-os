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
            <h2>Clientes</h2>
            <p>Próximamente</p>
        `;
    }

    if (modulo === "compras") {

        contenido.innerHTML = `
            <h2>Compras</h2>
            <p>Próximamente</p>
        `;
    }

    if (modulo === "productos") {

        contenido.innerHTML = `
            <h2>Productos</h2>
            <p>Próximamente</p>
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
