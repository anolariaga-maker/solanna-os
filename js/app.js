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

    alert("Venta simulada");
}
