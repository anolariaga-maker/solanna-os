function mostrarModulo(modulo) {

    const contenido = document.getElementById("contenido");

    if (modulo === "ventas") {

        contenido.innerHTML = `
            <div class="card">

                <h2>Nueva Venta</h2>

                <input type="text" placeholder="Cliente">

                <input type="text" placeholder="Producto">

                <input type="number" placeholder="Cantidad">

                <input type="number" placeholder="Precio">

                <button>Guardar Venta</button>

            </div>
        `;
    }

    if (modulo === "compras") {

        contenido.innerHTML = `
            <div class="card">
                <h2>Nueva Compra</h2>
                <p>Módulo en construcción.</p>
            </div>
        `;
    }

    if (modulo === "clientes") {

        contenido.innerHTML = `
            <div class="card">
                <h2>Clientes</h2>
                <p>Módulo en construcción.</p>
            </div>
        `;
    }

    if (modulo === "productos") {

        contenido.innerHTML = `
            <div class="card">
                <h2>Productos</h2>
                <p>Módulo en construcción.</p>
            </div>
        `;
    }

    if (modulo === "caja") {

        contenido.innerHTML = `
            <div class="card">
                <h2>Caja</h2>
                <p>Módulo en construcción.</p>
            </div>
        `;
    }
}
