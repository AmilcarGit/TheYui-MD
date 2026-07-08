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

      const texto =
        `╭─🌹 *BIENVENIDA/DESPEDIDA* 🌹\n` +
        `│ 🦋 Estado actual: *${actual.welcome ? "Activada ✅" : "Desactivada ❌"}*\n` +
        `╰────────────────╯\n\n` +
        `💕 *welcome on* — activarla\n` +
        `💕 *welcome off* — desactivarla`;

      await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
      return;
    }

    const nuevoValor = opcion === "on";
    actualizarConfigGrupo(chatId, { welcome: nuevoValor });

    const texto = nuevoValor
      ? `╭─🌹 *BIENVENIDA/DESPEDIDA* 🌹\n│ ✅ Activada en este grupo\n│ 🦋 Saludaré a quien entre o salga\n╰────────────────╯`
      : `╭─🌹 *BIENVENIDA/DESPEDIDA* 🌹\n│ ❌ Desactivada en este grupo\n│ 🦋 Ya no enviaré esos mensajes\n╰────────────────╯`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  },
};
