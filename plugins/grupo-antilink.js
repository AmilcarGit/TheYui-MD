import { actualizarConfigGrupo, obtenerConfigGrupo } from "../groupSettings.js";

export default {
  command: ["antilink"],
  category: "Grupo",
  description: "Activa o desactiva el antilink. Uso: antilink on / antilink off",
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
            `❀ Estado actual del antilink: *${actual.antilink ? "activado" : "desactivado"}*\n\n` +
            "Uso: *antilink on* / *antilink off*",
        },
        { quoted: msg }
      );
      return;
    }

    const nuevoValor = opcion === "on";
    actualizarConfigGrupo(chatId, { antilink: nuevoValor });

    await sock.sendMessage(
      chatId,
      {
        text: `✅ Antilink ${nuevoValor ? "activado" : "desactivado"} en este grupo.`,
      },
      { quoted: msg }
    );
  },
};