const API_URL = "https://script.google.com/macros/s/AKfycbw1A_BfKollxwhvr5o9iEEmVjk92FNOaM2BQQeSRk8UtIMXQCucjI3Cq--E264LJ3Q4/exec";

function mostrarModulo(modulo) {

    const contenido = document.getElementById("contenido");

    if (modulo === "ventas") {

        contenido.innerHTML = `
            <div class="card">

                <h2>Nueva Venta</h2>

                <input id="cliente" type="text" placeholder="Cliente">

                <input id="producto" type="text" placeholder="Producto">

                <input id="cantidad" type="number" placeholder="Cantidad">

                <input id="precio" type="number" placeholder="Precio">

                <button onclick="guardarVenta()">
                    Guardar Venta
                </button>

                <div id="resultado"></div>

            </div>
        `;
    }
}

async function guardarVenta() {

    const resultado = document.getElementById("resultado");

    resultado.innerHTML = "Enviando...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                prueba: true,
                fecha: new Date()
            })
        });

        const data = await response.json();

        resultado.innerHTML =
            "<br>✅ Conexión exitosa: " +
            data.mensaje;

    } catch (error) {

        resultado.innerHTML =
            "<br>❌ Error: " + error;

        console.error(error);
    }
}
