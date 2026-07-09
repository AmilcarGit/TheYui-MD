import { obtenerUsuario, guardarUsuario, formatearMonto, tieneEfecto } from "../economyDB.js";

const ENFRIAMIENTO_MS = 60 * 60 * 1000;
const GANANCIA_MIN = 100;
const GANANCIA_MAX = 800;

const TRABAJOS = [
  "atendiste una cafetería", "programaste una app móvil", "diseñaste un sitio web",
  "cuidaste niños", "vendiste ropa vintage", "hiciste un curso de inglés",
  "reparaste computadoras", "diste clases de matemáticas", "cocinaste para un restaurante",
  "pintaste un cuadro", "escribiste un poema", "editaste un video",
  "diseñaste un logo", "creaste un podcast", "administraste redes sociales",
  "grabaste un tutorial de baile", "reparaste un celular", "instalaste un aire acondicionado",
  "hiciste un mural", "tocaste un instrumento", "bailaste en un show",
  "cuidaste una tienda", "repartiste volantes", "ayudaste en una biblioteca",
  "clasificaste libros", "organizaste un archivo", "hiciste un inventario",
  "diste soporte técnico", "creaste un chatbot", "analizaste datos",
  "hiciste un videojuego", "modelaste en 3D", "animaste un personaje",
  "creaste una historieta", "escribiste un cuento", "tradujiste al japonés",
  "enseñaste a bailar", "fuiste guía turístico", "vendiste artesanías",
  "cuidaste un museo", "ayudaste en un refugio", "domaste caballos",
  "entrenaste perros", "cuidaste una granja", "cultivaste vegetales",
  "vendiste flores", "hiciste arreglos florales", "decoraste un salón",
  "organizaste una fiesta", "fuiste DJ", "mezclaste música",
  "horneaste pan", "preparaste sushi", "hiciste pizza artesanal",
  "elaboraste postres", "diseñaste joyería", "reparaste relojes",
  "limpiaste alfombras", "puliste muebles", "restauraste antigüedades",
  "cuidaste una piscina", "entrenaste atletas", "enseñaste a nadar",
  "fuiste socorrista", "cuidaste un faro", "pescaste en el mar",
  "navegaste un barco", "reparaste motores", "cuidaste un taller",
  "pintaste una casa", "construiste una pared", "hiciste carpintería fina",
  "reparaste techos", "pusiste baldosas", "diseñaste interiores",
  "asesoraste en moda", "vendiste cosméticos", "diste masajes",
  "cuidaste ancianos", "ayudaste en un hospital", "preparaste medicinas",
  "investigaste curas", "enseñaste primeros auxilios", "fuiste voluntario",
  "recolectaste donaciones", "organizaste una campaña", "diseñaste un cartel",
  "creaste una app de citas", "programaste un juego de mesa", "automatizaste un proceso",
  "diste una charla TED", "escribiste un artículo", "editaste una foto",
  "creaste un meme", "grabaste un corto", "actuaste en teatro",
  "fuiste extra en una película", "hiciste doblaje de voz", "locución para radio",
  "fuiste youtuber", "streamer de videojuegos", "probaste videojuegos",
  "reportaste errores", "mejoraste una IA", "programaste un asistente",
  "diseñaste bases de datos", "optimizaste un servidor", "hiciste seguridad informática",
  "auditoría de sistemas", "redacción de contratos", "traducción jurada",
  "mediación de conflictos", "coaching personal", "asesoría de negocios"
];

export default {
  command: ["trabajar", "work"],
  category: "Economia",
  description: "Trabaja para ganar Yui (cada 1 hora). Las mejoras aumentan tus ganancias.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];

    const usuario = obtenerUsuario(numero);
    const ahora = Date.now();

    let enfriamientoMs = ENFRIAMIENTO_MS;
    if (tieneEfecto(numero, "enfriamiento_menos")) {
      enfriamientoMs = Math.floor(ENFRIAMIENTO_MS * 0.7);
    }

    const tiempoRestante = usuario.ultimoTrabajo + enfriamientoMs - ahora;

    if (tiempoRestante > 0) {
      const minutos = Math.ceil(tiempoRestante / (60 * 1000));
      return await sock.sendMessage(
        chatId,
        { text: `⏳ Estás cansada/o. Vuelve a trabajar en *${minutos} minuto(s)*.` },
        { quoted: msg }
      );
    }

    let ganancia = Math.floor(Math.random() * (GANANCIA_MAX - GANANCIA_MIN + 1)) + GANANCIA_MIN;

    const suerte = tieneEfecto(numero, "suerte");
    if (suerte) {
      ganancia = Math.floor(ganancia * 1.5);
    }

    const vipOro = tieneEfecto(numero, "vip_oro");
    const vipPlatino = tieneEfecto(numero, "vip_platino");
    const socio = tieneEfecto(numero, "socio");

    if (vipPlatino) ganancia = ganancia * 3;
    else if (vipOro) ganancia = ganancia * 2;

    if (socio) ganancia = ganancia + 50;

    const trabajo = TRABAJOS[Math.floor(Math.random() * TRABAJOS.length)];

    guardarUsuario(numero, {
      saldo: usuario.saldo + ganancia,
      ultimoTrabajo: ahora,
    });

    let bonus = "";
    if (vipPlatino) bonus = " ✨ (VIP Platino x3)";
    else if (vipOro) bonus = " ✨ (VIP Oro x2)";
    if (socio) bonus += " 🤝 (+50 socio)";
    if (suerte) bonus += " 🍀 (Suerte x1.5)";

    await sock.sendMessage(
      chatId,
      {
        text: `💼 Hoy ${trabajo} y ganaste:\n💵 +${formatearMonto(ganancia)}${bonus}`,
        mentions: [sender],
      },
      { quoted: msg }
    );
  }
};