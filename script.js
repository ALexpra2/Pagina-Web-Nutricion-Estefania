document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------
    // 1. Lógica de Modales (Popups de Servicios)
    // ------------------------------------------

    const serviceCards = document.querySelectorAll('.service-card');
    const modals = document.querySelectorAll('.modal');
    const closeButtonsX = document.querySelectorAll('.close-x');
    const body = document.body;

    // Función para abrir el modal
    const openModal = (modalId) => {
        const modal = document.getElementById(`modal-${modalId}`);
        if (modal) {
            modal.classList.add('open');
            body.style.overflow = 'hidden'; // Evita el scroll en el body
        }
    };

    // Función para cerrar el modal
    const closeModal = (modal) => {
        modal.classList.remove('open');
        body.style.overflow = ''; // Restaura el scroll en el body
    };

    // Event Listeners para abrir los modales
    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Asegurarse de que el click sea en la card o el botón, no en un elemento interno
            if (e.target.closest('.service-card')) {
                const serviceType = card.dataset.service;
                openModal(serviceType);
            }
        });
    });

    // Event Listeners para cerrar los modales con la 'X'
    closeButtonsX.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // Event Listener para cerrar los modales al hacer click fuera
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Event Listener para cerrar con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('open')) {
                    closeModal(modal);
                }
            });
        }
    });


    // ------------------------------------------
    // 2. Animación de Revelado (Scroll Reveal)
    // ------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            // Si el elemento está a menos de 150px del fondo de la ventana
            if (elementTop < windowHeight - 150) {
                element.classList.add('active');
            } else {
                // Opcional: Para resetear la animación al hacer scroll hacia arriba
                // element.classList.remove('active'); 
            }
        });
    };

    // Ejecutar al cargar y al hacer scroll
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Ejecutar una vez al cargar para elementos en el viewport
});


  // ------------------------------------------
    //---3 CONFIGURACIÓN GENERADOR RECETAS---
    // ------------------------------------------
/// --- CONFIGURACIÓN PARA GEMINI API ---
// ⚠️ REEMPLAZA con tu clave de API de Google AI Studio (o Vertex AI)
const GEMINI_API_KEY = ""; 
// Endpoint base para llamadas de generación de contenido
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"; 

/**
 * Función principal para generar la receta
 */
async function generarReceta() {
    const ingredientes = document.getElementById('ingredientes').value.trim();
    const resultadoDiv = document.getElementById('resultado-receta');

    if (!ingredientes) {
        resultadoDiv.innerHTML = '<p class="error-message">Por favor, introduce al menos un ingrediente y su cantidad.</p>';
        return;
    }

    resultadoDiv.innerHTML = '<div class="loading">Cargando receta con Gemini... Por favor, espera unos segundos.</div>';

    // 1. Definir el contexto del modelo (System Instruction)
    const systemInstruction = `Eres un asistente de IA especializado en nutrición y creación de recetas saludables. Tu función es actuar como la asistente de una nutricionista.
    
    INSTRUCCIONES CLAVE:
    1. Genera una única receta deliciosa y bien estructurada utilizando solo los ingredientes proporcionados por el usuario.
    2. El título debe ser atractivo.
    3. La receta debe incluir secciones claras: **Ingredientes (con cantidades ajustadas si es necesario)**, **Instrucciones paso a paso** y **Consejo Nutricional de la Nutricionista**.
    4. El estilo debe ser profesional, enfocado en la salud, la practicidad y el equilibrio.
    5. Utiliza Markdown para dar formato al resultado (encabezados, listas).`;

    // 2. Definir el mensaje del usuario
    const userMessage = `Con los siguientes ingredientes, por favor, crea una receta saludable y detallada: ${ingredientes}`;

    try {
        // 🔑 USO DE LA API KEY AQUÍ: Se añade como parámetro de consulta a la URL.
        const urlConKey = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(urlConKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gemini-2.5-flash", 
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Error de API (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            throw new Error("Respuesta de API inválida o bloqueada.");
        }
        
        const recetaTexto = data.candidates[0].content.parts[0].text;
        const recetaHTML = convertirMarkdownABasico(recetaTexto);

        resultadoDiv.innerHTML = recetaHTML;

    } catch (error) {
        console.error("Error al generar la receta:", error);
        resultadoDiv.innerHTML = `<p class="error-message">Ocurrió un error al contactar a la API de Gemini. Revisa tu clave y la consola. Mensaje: ${error.message}</p>`;
    }
}


/**
 * Función auxiliar para dar formato básico al texto (Markdown simple a HTML)
 * (Se mantiene sin cambios)
 */
function convertirMarkdownABasico(texto) {
    let html = texto;
    // Títulos H2 (##)
    html = html.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
    // Títulos H3 (###)
    html = html.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>');
    // Negritas
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Viñetas de lista (*)
    html = html.replace(/^\*\s*(.*)$/gm, '<li>$1</li>');
    // Párrafos (reemplaza 2+ saltos de línea por un párrafo)
    html = html.replace(/(\n{2,})/g, '</p><p>');
    // Envolver en contenedor
    html = `<p>${html}</p>`;
    // Corregir listas si se generaron múltiples <li>
    html = html.replace(/<\/p><li>/g, '<ul><li>');
    html = html.replace(/<\/li><p>/g, '</li></ul><p>');
    
    // Limpiar etiquetas de lista sin cerrar
    html = html.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
        return `<ul>${content.replace(/<\/p><p>/g, '')}</ul>`;
    });

    return html;
}