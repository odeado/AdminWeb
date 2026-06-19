import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAn8YsM1TC_Ub2N0m2XX5wnMGbdlNsIp2g",
    authDomain: "ups-monitor-f9b33.firebaseapp.com",
    projectId: "ups-monitor-f9b33",
    storageBucket: "ups-monitor-f9b33.firebasestorage.app",
    messagingSenderId: "746915871851",
    appId: "1:746915871851:web:28fd4fec3a67f64d32052e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let logoEmpresaBase64 = null;
let logoPieBase64 = null;
let correosDestino = [];
let historialCorreos = [];

// DOM Elements
const tabBtnCorreo = document.getElementById("tabBtnCorreo");
const tabBtnGeneral = document.getElementById("tabBtnGeneral");
const tabCorreo = document.getElementById("tabCorreo");
const tabGeneral = document.getElementById("tabGeneral");

const btnGuardar = document.getElementById("btnGuardar");
const btnRecargar = document.getElementById("btnRecargar");
const btnForzarEnvio = document.getElementById("btnForzarEnvio");

function mostrarTab(tab) {
    if (tab === "correo") {
        tabCorreo.style.display = "block";
        tabGeneral.style.display = "none";
        tabBtnCorreo.classList.add("active");
        tabBtnGeneral.classList.remove("active");
    } else {
        tabCorreo.style.display = "none";
        tabGeneral.style.display = "block";
        tabBtnCorreo.classList.remove("active");
        tabBtnGeneral.classList.add("active");
    }
}

tabBtnCorreo.addEventListener("click", () => mostrarTab('correo'));
tabBtnGeneral.addEventListener("click", () => mostrarTab('general'));

function actualizarListaCorreos() {
    const lista = document.getElementById("CorreoDestino");
    lista.innerHTML = "";
    correosDestino.forEach(correo => {
        const op = document.createElement("option");
        op.value = correo;
        op.textContent = correo;
        lista.appendChild(op);
    });
    document.getElementById("contadorCorreos").innerText = correosDestino.length + " destinatarios";
}

function actualizarHistorial() {
    const dl = document.getElementById("listaHistorial");
    dl.innerHTML = "";
    historialCorreos.forEach(correo => {
        const op = document.createElement("option");
        op.value = correo;
        dl.appendChild(op);
    });
}

async function agregarCorreo() {
    const txt = document.getElementById("correoNuevo");
    const correo = txt.value.trim().toLowerCase();
    if (!correo) return;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(correo)) {
        alert("Correo inválido");
        return;
    }

    if (correosDestino.includes(correo)) {
        alert("El correo ya existe en la lista");
        return;
    }

    correosDestino.push(correo);
    correosDestino.sort();

    if (!historialCorreos.includes(correo)) {
        historialCorreos.push(correo);
        historialCorreos.sort();
    }
    
    actualizarListaCorreos();
    actualizarHistorial();
    txt.value = "";

    await setDoc(doc(db, "portadas", "contactos"), { historialCorreos });
}

document.getElementById("btnAgregarCorreo").addEventListener("click", agregarCorreo);

document.getElementById("correoNuevo").addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        agregarCorreo();
    }
});

function eliminarCorreo() {
    const lista = document.getElementById("CorreoDestino");
    const seleccionados = [...lista.selectedOptions].map(x => x.value);
    correosDestino = correosDestino.filter(x => !seleccionados.includes(x));
    actualizarListaCorreos();
}

document.getElementById("btnEliminarCorreo").addEventListener("click", eliminarCorreo);

function limpiarCorreos() {
    if (!confirm("¿Eliminar todos los destinatarios?")) return;
    correosDestino = [];
    actualizarListaCorreos();
}

document.getElementById("btnLimpiarCorreos").addEventListener("click", limpiarCorreos);

async function cargarContactos() {
    const d = await getDoc(doc(db, "portadas", "contactos"));
    if (d.exists()) {
        historialCorreos = d.data().historialCorreos || [];
    }
    actualizarHistorial();
}

async function cargarConfigGeneral() {
    const d = await getDoc(doc(db, "portadas", "config"));
    let datos = {};
    if (d.exists()) datos = d.data();

    document.getElementById("Empresa").value = datos.Empresa || "";
    correosDestino = datos.CorreoDestino || [];
    document.getElementById("UsarCCO").checked = datos.UsarCCO || false;
    actualizarListaCorreos();

    document.getElementById("CorreoRemitente").value = datos.CorreoRemitente || "";
    document.getElementById("SmtpPassword").value = datos.SmtpPassword || "";
    document.getElementById("SmtpServer").value = datos.SmtpServer || "";
    document.getElementById("SmtpPort").value = datos.SmtpPort || "";
    document.getElementById("HoraInicio").value = datos.HoraInicio || "";
    document.getElementById("RutaBase").value = datos.RutaBase || "";
    document.getElementById("Ghostscript").value = datos.Ghostscript || "";
}

async function cargar() {
    const d = await getDoc(doc(db, "portadas", "correo"));
    let datos = {};
    if (d.exists()) datos = d.data();

    document.getElementById("TituloCorreo").value = datos.TituloCorreo || "";
    document.getElementById("Asunto").value = datos.Asunto || "";
    document.getElementById("Subtitulo").value = datos.Subtitulo || "";
    document.getElementById("TextoPrincipal").value = datos.TextoPrincipal || "";
    document.getElementById("TextoSecundario").value = datos.TextoSecundario || "";
    document.getElementById("PiePagina").value = datos.PiePagina || "";
    document.getElementById("ColorCabecera").value = datos.ColorCabecera || "#003A78";
    document.getElementById("AnchoPortada").value = datos.AnchoPortada || "400";
    document.getElementById("ColorPie").value = datos.ColorPie || "#003A78";
    document.getElementById("AnchoLogo").value = datos.AnchoLogo || "200";
    document.getElementById("AnchoLogoPie").value = datos.AnchoLogoPie || "200";

    logoEmpresaBase64 = datos.LogoEmpresaBase64 || null;
    logoPieBase64 = datos.LogoPieBase64 || null;

    if(logoEmpresaBase64) document.getElementById("logoEmpresa").src = logoEmpresaBase64;
    if(logoPieBase64) document.getElementById("logoPie").src = logoPieBase64;

    actualizarPreview();
}

btnRecargar.addEventListener("click", () => {
    cargar();
    cargarConfigGeneral();
    cargarContactos();
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

document.getElementById("logoFile").addEventListener("change", async e => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    logoEmpresaBase64 = await fileToBase64(archivo);
    document.getElementById("logoEmpresa").src = logoEmpresaBase64;
});

document.getElementById("logoPieFile").addEventListener("change", async e => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    logoPieBase64 = await fileToBase64(archivo);
    document.getElementById("logoPie").src = logoPieBase64;
});

function actualizarPreview() {
    document.getElementById("pvTitulo").innerText = document.getElementById("TituloCorreo").value;
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const dia = String(manana.getDate()).padStart(2, "0");
    const mes = String(manana.getMonth() + 1).padStart(2, "0");
    const anio = manana.getFullYear();
    const fechaTexto = `${dia}-${mes}-${anio}`;

    document.getElementById("pvSubtitulo").innerText = document.getElementById("Subtitulo").value.replace("{FECHA}", fechaTexto);
    document.getElementById("pvTexto1").innerText = document.getElementById("TextoPrincipal").value;
    document.getElementById("pvTexto2").innerText = document.getElementById("TextoSecundario").value;
    document.getElementById("pvPie").innerText = document.getElementById("PiePagina").value;

    document.getElementById("cabecera").style.background = document.getElementById("ColorCabecera").value;
    document.getElementById("pieLogo").style.background = document.getElementById("ColorPie").value;
    document.getElementById("portada").style.width = document.getElementById("AnchoPortada").value + "px";
    document.getElementById("logoEmpresa").style.width = document.getElementById("AnchoLogo").value + "px";
    document.getElementById("logoPie").style.width = document.getElementById("AnchoLogoPie").value + "px";
}

document.querySelectorAll("input").forEach(x => x.addEventListener("input", actualizarPreview));

async function enviarForzado() {
    if (!confirm("¿Enviar correo ignorando control de duplicados?")) return;
    await setDoc(doc(db, "portadas", "comandos"), { forzarEnvio: true, timestamp: Date.now() });
    alert("Orden de envío forzado registrada. El colector la procesará pronto.");
}

btnForzarEnvio.addEventListener("click", enviarForzado);

// Escuchar cambios en el estado
onSnapshot(doc(db, "portadas", "estado"), (docSnap) => {
    if (docSnap.exists()) {
        const estado = docSnap.data();
        document.getElementById("estadoTitulo").innerText = estado.Estado || "Desconocido";
        document.getElementById("estadoDetalle").innerText = estado.Mensaje || "Sin mensaje";
        
        // Latido del colector
        if (estado.UltimaConexion) {
            // Firebase puede devolver el integerValue como string o number, así que aseguramos que sea number
            const ms = parseInt(estado.UltimaConexion, 10);
            const ultimaConexion = new Date(ms);
            const ahora = new Date();
            const diferenciaMs = ahora - ultimaConexion;
            const diferenciaMinutos = diferenciaMs / 1000 / 60;
            
            if (diferenciaMinutos <= 2) {
                document.getElementById("colectorIcono").innerText = "🟢";
                document.getElementById("colectorDetalle").innerText = "Conectado. Última vez: " + ultimaConexion.toLocaleTimeString();
                document.getElementById("colectorStatus").style.borderColor = "#4ade80";
            } else {
                document.getElementById("colectorIcono").innerText = "🔴";
                document.getElementById("colectorDetalle").innerText = "Desconectado. Visto hace " + Math.round(diferenciaMinutos) + " min";
                document.getElementById("colectorStatus").style.borderColor = "#f87171";
            }
        }
    }
});

document.getElementById("btnCambiarLogo").addEventListener("click", () => document.getElementById("logoFile").click());
document.getElementById("btnCambiarLogoPie").addEventListener("click", () => document.getElementById("logoPieFile").click());

async function guardar() {
    const datosCorreo = {
        TituloCorreo: document.getElementById("TituloCorreo").value,
        Asunto: document.getElementById("Asunto").value,
        Subtitulo: document.getElementById("Subtitulo").value,
        TextoPrincipal: document.getElementById("TextoPrincipal").value,
        TextoSecundario: document.getElementById("TextoSecundario").value,
        PiePagina: document.getElementById("PiePagina").value,
        ColorCabecera: document.getElementById("ColorCabecera").value,
        AnchoPortada: document.getElementById("AnchoPortada").value,
        ColorPie: document.getElementById("ColorPie").value,
        AnchoLogo: document.getElementById("AnchoLogo").value,
        AnchoLogoPie: document.getElementById("AnchoLogoPie").value,
        LogoEmpresaBase64: logoEmpresaBase64,
        LogoPieBase64: logoPieBase64
    };

    const configGeneral = {
        Empresa: document.getElementById("Empresa").value,
        CorreoDestino: correosDestino,
        UsarCCO: document.getElementById("UsarCCO").checked,
        CorreoRemitente: document.getElementById("CorreoRemitente").value,
        SmtpPassword: document.getElementById("SmtpPassword").value,
        SmtpServer: document.getElementById("SmtpServer").value,
        SmtpPort: document.getElementById("SmtpPort").value,
        HoraInicio: document.getElementById("HoraInicio").value,
        RutaBase: document.getElementById("RutaBase").value,
        Ghostscript: document.getElementById("Ghostscript").value
    };

    try {
        await setDoc(doc(db, "portadas", "config"), configGeneral);
        await setDoc(doc(db, "portadas", "correo"), datosCorreo);
        await setDoc(doc(db, "portadas", "contactos"), { historialCorreos });
        alert("Configuración guardada en Firebase correctamente.");
    } catch (e) {
        alert("Error al guardar: " + e.message);
    }
}

btnGuardar.addEventListener("click", guardar);

document.getElementById("btnPreviewOutlook").addEventListener("click", () => {
    const previewHtml = document.getElementById("correoPreview").outerHTML;
    const asunto = document.getElementById("Asunto").value || "Preview Portada";
    const remitente = document.getElementById("CorreoRemitente").value || "test@empresa.cl";
    
    // Create EML content
    const emlContent = 
`To: Test <test@test.com>
From: ${remitente}
Subject: ${asunto}
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; }
  #cabecera, #pieLogo { background: ${document.getElementById("ColorCabecera").value}; color: white; text-align: center; padding: 20px; }
  .imagen { background: #f1f5f9; padding: 20px; text-align: center; }
  .contenido { padding: 20px; }
  #portada { width: ${document.getElementById("AnchoPortada").value}px; }
  img { max-width: 100%; }
</style>
</head>
<body>
${previewHtml}
</body>
</html>`;

    // Download as .eml file
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preview_outlook.eml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById("buscarCorreo").addEventListener("input", () => {
    const texto = document.getElementById("buscarCorreo").value.toLowerCase();
    const lista = document.getElementById("CorreoDestino");
    lista.innerHTML = "";
    correosDestino
        .filter(correo => correo.toLowerCase().includes(texto))
        .forEach(correo => {
            const op = document.createElement("option");
            op.value = correo;
            op.textContent = correo;
            lista.appendChild(op);
        });
});

document.getElementById("btnImportarCorreos").addEventListener("click", () => {
    const texto = document.getElementById("correosMasivos").value;
    if (!texto.trim()) return;

    const lineas = texto.split(/\r?\n/);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let agregados = 0;

    lineas.forEach(correo => {
        correo = correo.trim().toLowerCase();
        if (!correo) return;
        if (!regex.test(correo)) return;

        if (!correosDestino.includes(correo)) {
            correosDestino.push(correo);
            agregados++;
        }
        if (!historialCorreos.includes(correo)) {
            historialCorreos.push(correo);
        }
    });

    correosDestino.sort();
    historialCorreos.sort();
    actualizarListaCorreos();
    actualizarHistorial();
    document.getElementById("correosMasivos").value = "";

    alert(agregados + " correos agregados. Recuerda guardar.");
});

window.onload = async () => {
    await cargar();
    await cargarContactos();
    await cargarConfigGeneral();
};