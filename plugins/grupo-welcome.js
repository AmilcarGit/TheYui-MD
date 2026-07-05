import { actualizarConfigGrupo, obtenerConfigGrupo } from "../groupSettings.js";

export default {
  command: ["welcome"],
  category: "Grupo",
  description: "Activa o desactiva la bienvenida/despedida. Uso: welcome on / welcome off",
  groupOnly: true,
  adminOnly: true,
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const opcion = args[0]?.toLowerCase();

    if (opcion !== "on" && opcion !== "off") {
      const actual = obtenerConfigGrupo(chatId);
      await sock.sendMessage(
        chatId,
        {
          text:
            `❀ Estado actual del welcome: *${actual.welcome ? "activado" : "desactivado"}*\n\n` +
            "Uso: *welcome on* / *welcome off*",
        },
        { quoted: msg }
      );
      return;
    }

    const nuevoValor = opcion === "on";
    actualizarConfigGrupo(chatId, { welcome: nuevoValor });

    await sock.sendMessage(
      chatId,
      {
        text: `✅ Bienvenida/despedida ${nuevoValor ? "activada" : "desactivada"} en este grupo.`,
      },
      { quoted: msg }
    );
  },
};