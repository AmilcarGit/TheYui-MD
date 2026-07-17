import {
  estaRegistrado,
  obtenerRegistro,
  registrarUsuario,
  eliminarRegistro,
} from "../registerDB.js";

export default {
  command: ["reg", "registrar", "register"],
  category: "General",
  description: "Regístrate para poder usar ciertos comandos. Uso: reg <nombre> <edad>",
  bypassApagado: true,

  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    const numero = sender.split("@")[0].split(":")[0];

    if (args[0]?.toLowerCase() === "borrar" || args[0]?.toLowerCase() === "eliminar") {
      const eliminado = eliminarRegistro(numero);
      return await sock.sendMessage(
        chatId,
        {
          text: eliminado
            ? "✅ Tu registro fue eliminado."
            : "💕 No tenías ningún registro guardado.",
        },
        { quoted: msg }
      );
    }

    if (estaRegistrado(numero)) {
      const datos = obtenerRegistro(numero);
      const fecha = new Date(datos.fechaRegistro).toLocaleDateString("es-PE");

      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 📋 *YA ESTÁS REGISTRADO* 」\n` +
            `│ 👤 Nombre: ${datos.nombre}\n` +
            `│ 🎂 Edad: ${datos.edad}\n` +
            `│ 📅 Desde: ${fecha}\n` +
            `╰────────────────\n\n` +
            `_Escribe *reg borrar* si quieres eliminar tu registro._`,
        },
        { quoted: msg }
      );
    }

    const nombre = args.slice(0, -1).join(" ").trim();
    const edad = parseInt(args[args.length - 1], 10);

    if (!nombre || !edad || edad <= 0 || edad > 120) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 📋 *REGISTRO* 」\n` +
            `│ Para usar ciertos comandos primero\n` +
            `│ debes registrarte.\n` +
            `│\n` +
            `│ Uso: *reg <nombre> <edad>*\n` +
            `│ Ejemplo: *reg Amilcar 20*\n` +
            `╰────────────────`,
        },
        { quoted: msg }
      );
    }

    registrarUsuario(numero, { nombre, edad });

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─「 ✅ *REGISTRO EXITOSO* 」\n` +
          `│ 👤 Nombre: ${nombre}\n` +
          `│ 🎂 Edad: ${edad}\n` +
          `╰────────────────\n\n` +
          `💕 ¡Ya puedes usar todos los comandos!`,
        mentions: [sender],
      },
      { quoted: msg }
    );
  },
};
