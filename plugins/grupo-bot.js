import { actualizarConfigGrupo, obtenerConfigGrupo } from "../groupSettings.js";

export default {
  command: ["bot"],
  category: "Grupo",
  description:
    "Apaga o enciende al bot en este grupo. Uso: bot off / bot on",
  groupOnly: true,
  adminOnly: true,
  // Permite que este comando siga funcionando aunque el bot esté "apagado"
  // en el grupo, para que un admin pueda volver a encenderlo.
  bypassApagado: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const opcion = args[0]?.toLowerCase();

    if (opcion !== "on" && opcion !== "off") {
      const actual = obtenerConfigGrupo(chatId);
      await sock.sendMessage(
        chatId,
        {
          text:
            `❀ Estado actual del bot en este grupo: *${
              actual.activo ? "encendido" : "apagado"
            }*\n\n` + "Uso: *bot on* / *bot off*",
        },
        { quoted: msg }
      );
      return;
    }

    const nuevoValor = opcion === "on";
    actualizarConfigGrupo(chatId, { activo: nuevoValor });

    await sock.sendMessage(
      chatId,
      {
        text: nuevoValor
          ? "✅ Bot *encendido* en este grupo. Ya vuelvo a responder comandos."
          : "🔕 Bot *apagado* en este grupo. No responderé a más comandos hasta que un admin escriba *bot on*.",
      },
      { quoted: msg }
    );
  },
};
