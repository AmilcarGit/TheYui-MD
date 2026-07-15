export default {
  command: ["add"],
  category: "Grupo",
  description: "Agrega un número al grupo directamente.",
  groupOnly: true,
  adminOnly: true,
  requiereBotAdmin: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const numero = args[0]?.replace(/\D/g, "");

    if (!numero || numero.length < 8) {
      return await sock.sendMessage(
        chatId,
        { text: "❀ Uso: *add <número>*\nEjemplo: *add 51910227479* (con código de país, sin + ni espacios)" },
        { quoted: msg }
      );
    }

    const jid = `${numero}@s.whatsapp.net`;

    try {
      const resultado = await sock.groupParticipantsUpdate(chatId, [jid], "add");
      const estado = resultado?.[0]?.status;

      if (estado === "200") {
        return await sock.sendMessage(
          chatId,
          { text: `✅ @${numero} fue agregado al grupo.`, mentions: [jid] },
          { quoted: msg }
        );
      }

      if (estado === "403") {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `⚠️ No pude agregar a @${numero} directamente (tiene la privacidad restringida).\n` +
              `Le mandé una invitación en su lugar, si el grupo lo permite.`,
            mentions: [jid],
          },
          { quoted: msg }
        );
      }

      return await sock.sendMessage(
        chatId,
        { text: `❌ No se pudo agregar a ${numero} (código: ${estado || "desconocido"}).` },
        { quoted: msg }
      );
    } catch (err) {
      await sock.sendMessage(
        chatId,
        { text: "❌ Ocurrió un error al intentar agregar al usuario." },
        { quoted: msg }
      );
    }
  },
};
