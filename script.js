// Variable global que guardará la lista de juegos cargada desde el JSON
let listaDeJuegos = [];
let juegosDisponibles = []; // Aquí guardaremos los juegos que aún no han salido
let filtroCategoriaActual = 'todos';

// Elementos del DOM guardados en constantes para usarlos fácilmente
const badgeContador = document.getElementById('badge-contador');
const btnGirar = document.getElementById('btn-girar');
const selectCategoriaRuleta = document.getElementById('select-categoria-ruleta');
const resultadoRuleta = document.getElementById('resultado-ruleta');
const cajaPantallaRuleta = document.querySelector('.pantalla-ruleta');

// ==========================================
// 1. CARGA DINÁMICA DE DATOS (NUEVO)
// ==========================================

// Función que va a buscar el JSON e inicia la aplicación
function cargarJuegosJSON() {
    fetch('/juegos.json')
        .then(respuesta => respuesta.json())
        .then(datos => {
            listaDeJuegos = datos; // Guardamos los datos en nuestra variable global
            juegosDisponibles = [...datos]; // <--- NUEVO: Guardamos una copia limpia
            mostrarJuegosEnPantalla(listaDeJuegos); // Dibujamos las tarjetas por primera vez
        })
        .catch(error => {
            console.error("Error al cargar el archivo JSON:", error);
            document.getElementById('contenedor-juegos').innerHTML = "<p>❌ Error al cargar la colección de juegos.</p>";
        });
}

// Función encargada de construir el HTML de cada tarjeta e insertarlo
function mostrarJuegosEnPantalla(juegosAMostrar) {
    const contenedor = document.getElementById('contenedor-juegos');
    contenedor.innerHTML = ""; // Limpiamos el contenedor

    juegosAMostrar.forEach(juego => {
        // Actualizamos el molde HTML con una estructura interna doble
        const tarjetaHTML = `
            <div class="tarjeta-juego" data-categoria="${juego.categoria}">
                <div class="contenedor-checkbox">
                    <input type="checkbox" data-id="${juego.id}">
                </div>
                
                <div class="cuerpo-tarjeta">
                    <div class="info-juego">
                        <span class="tag">${obtenerEmojiCategoria(juego.categoria)} ${juego.categoria}</span>
                        <h3>${juego.nombre}</h3>
                        <p><strong>Jugadores:</strong> ${juego.jugadoresMin}-${juego.jugadoresMax}</p>
                        <p><strong>Tiempo:</strong> ${juego.duracion} min</p>
                        <p><strong>Años:</strong> ${juego.edadMinima}+</p>
                    </div>
                    
                    <div class="imagen-juego">
                        <img src="${juego.imagen}" alt="Portada de ${juego.nombre}">
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
    });

    // Ajustamos los elementos visuales al terminar
    aplicarFiltradoVisual();
}

// Función auxiliar para asignar emojis automáticos según la categoría del JSON
function obtenerEmojiCategoria(categoria) {
    const emojis = {
        'agilidad': '🏃‍♂️',
        'familia': '🍰',
        'party games': '💥',
        'saga uno': '🃏',
        'tablero': '♟️'
    };
    return emojis[categoria] || '🎲';
}

// ==========================================
// 2. FILTRADO VISUAL Y SINCRONIZACIÓN
// ==========================================

function aplicarFiltradoVisual() {
    const juegos = document.querySelectorAll('.tarjeta-juego');
    const contenedoresCheckboxes = document.querySelectorAll('.contenedor-checkbox');
    let juegosVisibles = 0;

    // Mostrar u ocultar casillas de selección según la categoría actual
    contenedoresCheckboxes.forEach(box => {
        box.style.display = (filtroCategoriaActual === 'custom') ? 'block' : 'none';
    });

    // Controlar qué tarjetas se muestran físicamente en el navegador
    juegos.forEach(juego => {
        const catJuego = juego.getAttribute('data-categoria');
        const cumpleCat = (filtroCategoriaActual === 'todos' || 
                           filtroCategoriaActual === 'custom' || 
                           catJuego === filtroCategoriaActual);
        
        if (cumpleCat) { 
            juego.classList.remove('oculto'); 
            juegosVisibles++;
        } else { 
            juego.classList.add('oculto'); 
        }
    });

    badgeContador.innerText = juegosVisibles;
}

// Ejecutada por los botones de categoría en el HTML principal
function filtrar(valorCategoria, boton) {
    const hermanos = boton.parentElement.querySelectorAll('.btn-filtro');
    hermanos.forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');

    filtroCategoriaActual = valorCategoria;
    aplicarFiltradoVisual();

    // Sincroniza el select de la ruleta con el botón presionado
    selectCategoriaRuleta.value = valorCategoria;
}

// Sincroniza los botones de abajo cuando se cambia el select de la ruleta
selectCategoriaRuleta.addEventListener('change', function() {
    filtroCategoriaActual = this.value;
    aplicarFiltradoVisual();

    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach(btn => btn.classList.remove('activo'));

    const mapeoBotones = {
    'todos': 'btn-cat-todos',
    'agilidad': 'btn-cat-agilidad',
    'familia': 'btn-cat-familia',
    'party games': 'btn-cat-party',
    'saga uno': 'btn-cat-uno',
    'tablero': 'btn-cat-tablero',
    'custom': 'btn-cat-custom'
};
    
    const idBotonActivo = mapeoBotones[this.value];
    if (idBotonActivo) {
        document.getElementById(idBotonActivo).classList.add('activo');
    }
});

// Evento para quitar la pantalla de bienvenida
document.getElementById('btn-comenzar').addEventListener('click', function() {
    document.getElementById('pantalla-inicio').classList.add('ocultar');
});

// ==========================================
// 3. LÓGICA DE LA RULETA ALEATORIA
// ==========================================

btnGirar.addEventListener('click', function() {
    btnGirar.addEventListener('click', function() {
    // 1. Averiguamos cuántos nombres hay anotados en la cajita burdeo
    const cantidadJugadores = document.querySelectorAll('#lista-jugadores-visual li').length;

    if (cantidadJugadores === 0) {
        alert("¡Debes agregar al menos a un jugador para empezar!");
        return;
    }

    // 2. FILTRO MÁGICO: Filtramos los juegos que calcen EXACTO con el grupo actual
    // Revisa que la cantidad calce entre el mínimo y el máximo de tu JSON
    let juegosAptos = juegosDisponibles.filter(juego => {
        return cantidadJugadores >= juego.jugadoresMin && cantidadJugadores <= juego.jugadoresMax;
    });

    // 3. Alerta por si ningún juego de tu lista sirve para esa cantidad de personas
    if (juegosAptos.length === 0) {
        alert(`No quedan juegos disponibles en la lista para un grupo de ${cantidadJugadores} personas.`);
        return;
    }

    // 4. ¡A girar! Elegimos un juego al azar pero SOLO de los que pasaron el filtro (juegosAptos)
    const indiceAleatorio = Math.floor(Math.random() * juegosAptos.length);
    const juegoGanador = juegosAptos[indiceAleatorio];

    // ... Aquí continúa tu animación normal de la ruleta ...
    console.log("El juego elegido que cumple el requisito es: " + juegoGanador.nombre);

    // 5. Lo eliminamos temporalmente de la lista general para que no se repita
    // Buscamos su posición real en la lista global de disponibles para sacarlo
    const indexEnDisponibles = juegosDisponibles.findIndex(j => j.id === juegoGanador.id);
    if (indexEnDisponibles !== -1) {
        juegosDisponibles.splice(indexEnDisponibles, 1);
    }
    
    // (Aquí abajo pones tu código que muestra el ganador en la pantalla y apaga la tarjeta abajo)
});
// Dentro del evento de girar la ruleta, cuando la animación termina y elige al ganador:
btnGirar.addEventListener('click', function() {
    
    // 1. NUEVO: Verificar si nos quedamos sin juegos
    if (juegosDisponibles.length === 0) {
        alert("¡Ya salieron todos los juegos! Reiniciando la lista automáticamente.");
        juegosDisponibles = [...juegos]; // Volvemos a llenar la lista
    }

    // ... aquí va tu animación de la ruleta cambiando rápido ...

    // Al terminar la animación, en vez de elegir de "juegos", elige de "juegosDisponibles":
    const indiceAleatorio = Math.floor(Math.random() * juegosDisponibles.length);
    const juegoGanador = juegosDisponibles[indiceAleatorio];

    // 2. NUEVO: Sacar el juego elegido de la lista para que NO vuelva a salir
    juegosDisponibles.splice(indiceAleatorio, 1);

    // ... aquí pones el código que ya tienes para mostrar el juego ganador en pantalla ...
    console.log(`Juego elegido: ${juegoGanador.nombre}. Quedan ${juegosDisponibles.length} juegos.`);
});
    const categoriaSeleccionada = selectCategoriaRuleta.value;
    const todasLasTarjetas = document.querySelectorAll('.tarjeta-juego');
    let juegosFiltrados = [];

    // Evaluamos el estado actual del HTML para armar la ruleta
    todasLasTarjetas.forEach(tarjeta => {
        const catJuego = tarjeta.getAttribute('data-categoria');
        const nombreJuego = tarjeta.querySelector('h3').innerText;
        const checkbox = tarjeta.querySelector('input[type="checkbox"]');

        if (categoriaSeleccionada === 'custom') {
            if (checkbox && checkbox.checked) {
                juegosFiltrados.push(nombreJuego);
            }
        } else if (categoriaSeleccionada === 'todos' || catJuego === categoriaSeleccionada) {
            juegosFiltrados.push(nombreJuego);
        }
    });

    if (juegosFiltrados.length === 0) {
        resultadoRuleta.innerHTML = categoriaSeleccionada === 'custom' 
            ? `<span style="color: #ef4444;">❌ Selecciona al menos un juego</span>` 
            : `<span style="color: #ef4444;">❌ No hay juegos</span>`;
        return;
    }

    btnGirar.disabled = true;
    cajaPantallaRuleta.classList.add('girando');

    let pasadas = 0;
    const vueltasMaximas = 18; 

    const animacionRuleta = setInterval(() => {
        const juegoMuestraTemporal = juegosFiltrados[Math.floor(Math.random() * juegosFiltrados.length)];
        resultadoRuleta.innerText = `⚡ ${juegoMuestraTemporal} ⚡`;
        pasadas++;

        if (pasadas >= vueltasMaximas) {
            clearInterval(animacionRuleta);

            const juegoGanador = juegosFiltrados[Math.floor(Math.random() * juegosFiltrados.length)];
            resultadoRuleta.innerHTML = `🎉 ¡A JUGAR!: <span style="color: #f59e0b;">${juegoGanador}</span> 🎉`;

            cajaPantallaRuleta.classList.remove('girando');
            btnGirar.disabled = false;
        }
    }, 90); 
});

// Disparador inicial cuando la ventana termina de cargar
window.onload = function() {
    cargarJuegosJSON(); // <--- Ahora lo primero que hace es traer los datos del JSON
};
// ==========================================
// ====================================================
// LÓGICA DE LA RULETA DE JUGADORES (CON COMPORTAMIENTO A)
// ====================================================

let listaJugadores = []; // Array donde guardamos los nombres

const inputJugador = document.getElementById('input-nombre-jugador');
const btnAgregarJugador = document.getElementById('btn-agregar-jugador');
const listaVisual = document.getElementById('lista-jugadores-visual');
const btnSortearJugador = document.getElementById('btn-sortear-jugador');
const resultadoJugador = document.getElementById('resultado-jugador');

// Dibuja las etiquetas de los jugadores en la caja con scroll
function actualizarListaJugadoresVisual() {
    listaVisual.innerHTML = ""; 
    
    listaJugadores.forEach((jugador, indice) => {
        const li = document.createElement('li');
        li.innerHTML = `
            👤 ${jugador} 
            <button type="button" onclick="eliminarJugador(${indice})">×</button>
        `;
        listaVisual.appendChild(li);
    });
}

// Añade un jugador evitando que entre texto vacío
function agregarJugador() {
    const nombre = inputJugador.value.trim();
    
    if (nombre === "") return;

    listaJugadores.push(nombre);
    inputJugador.value = ""; // Resetea el input
    inputJugador.focus();    // Mantiene el cursor activo para escribir rápido
    
    actualizarListaJugadoresVisual();
}

// Elimina un jugador específico usando su posición en el array
function eliminarJugador(indice) {
    listaJugadores.splice(indice, 1);
    actualizarListaJugadoresVisual();
}

// Escuchadores de eventos para registrar nombres
btnAgregarJugador.addEventListener('click', agregarJugador);
inputJugador.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        agregarJugador();
    }
});

// Animación y selección aleatoria del jugador que inicia
btnSortearJugador.addEventListener('click', function() {
    if (listaJugadores.length === 0) {
        resultadoJugador.innerHTML = `<span style="color: #ef4444;">❌ Agrega al menos un jugador</span>`;
        return;
    }

    btnSortearJugador.disabled = true;
    let pasadas = 0;
    const vueltasMaximas = 12;

    const animacionJugador = setInterval(() => {
        // Efecto rápido de nombres cambiando en pantalla
        const muestraTemporal = listaJugadores[Math.floor(Math.random() * listaJugadores.length)];
        resultadoJugador.innerText = `⚡ ${muestraTemporal} ⚡`;
        pasadas++;

        if (pasadas >= vueltasMaximas) {
            clearInterval(animacionJugador);

            // Ganador definitivo
            const ganador = listaJugadores[Math.floor(Math.random() * listaJugadores.length)];
            resultadoJugador.innerHTML = `👑 ¡Empieza: <span style="color: #22c55e;">${ganador}</span>! 👑`;
            
            btnSortearJugador.disabled = false;
        }
    }, 100);
    // Pon esto cada vez que la lista de nombres cambie (al agregar o borrar):
const cantidadJugadores = document.querySelectorAll('#lista-jugadores-visual li').length;
document.getElementById('contador-numero').textContent = cantidadJugadores;
});