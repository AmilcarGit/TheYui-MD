import { actualizarConfigGrupo, obtenerConfigGrupo } from "../groupSettings.js";

export default {
  command: ["antispam"],
  category: "Grupo",
  description: "Expulsa a quien repita el mismo mensaje varias veces. Uso: antispam on / antispam off",
  groupOnly: true,
  adminOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const opcion = args[0]?.toLowerCase();

    if (opcion !== "on" && opcion !== "off") {
      const actual = obtenerConfigGrupo(chatId);
      return await sock.sendMessage(
        chatId,
        {
          text:
            `🚫 *Antispam*\n\n` +
            `Estado actual: *${actual.antispam ? "Activado ✅" : "Desactivado ❌"}*\n\n` +
            `💕 *antispam on* — activarlo\n` +
            `💕 *antispam off* — desactivarlo`,
        },
        { quoted: msg }
      );
    }

    const nuevoValor = opcion === "on";
    actualizarConfigGrupo(chatId, { antispam: nuevoValor });

    await sock.sendMessage(
      chatId,
      {
        text: nuevoValor
          ? "✅ Antispam activado. Si alguien repite el mismo mensaje varias veces seguidas, se le borra, se le advierte, y si insiste se le expulsa."
          : "❌ Antispam desactivado en este grupo.",
      },
      { quoted: msg }
    );
  },
};
