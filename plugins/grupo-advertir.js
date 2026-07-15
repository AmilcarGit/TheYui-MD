import { esOwner, resolverParticipante } from "../middlewares.js";
import { obtenerAdvertencias, agregarAdvertencia, reiniciarAdvertencias } from "../advertenciasDB.js";

const MAX_ADVERTENCIAS = 3;

export default {
  command: ["advertir", "advertencias", "resetadvertencias"],
  category: "Grupo",
  description: "Da advertencias a un miembro (3 = expulsión automática).",
  groupOnly: true,
  adminOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId, body } = context;
    const comando = body.trim().split(/\s+/)[0].toLowerCase();

    let numero = "";
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      numero = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
        .split("@")[0].split(":")[0].replace(/\D/g, "");
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      numero = msg.message.extendedTextMessage.contextInfo.participant
        .split("@")[0].split(":")[0].replace(/\D/g, "");
    } else if (args[0]) {
      numero = args[0].replace(/\D/g, "");
    }

    if (!numero) {
      return await sock.sendMessage(
        chatId,
        { text: "❀ Menciona, responde un mensaje o escribe el número del usuario." },
        { quoted: msg }
      );
    }

    if (esOwner(numero)) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ No puedo advertir al *creador* del bot." },
        { quoted: msg }
      );
    }

    if (comando === "advertencias") {
      const cantidad = obtenerAdvertencias(chatId, numero);
      return await sock.sendMessage(
        chatId,
        { text: `⚠️ @${numero} tiene *${cantidad}/${MAX_ADVERTENCIAS}* advertencia(s).`, mentions: [`${numero}@s.whatsapp.net`] },
        { quoted: msg }
      );
    }

    if (comando === "resetadvertencias") {
      reiniciarAdvertencias(chatId, numero);
      return await sock.sendMessage(
        chatId,
        { text: `✅ Se reiniciaron las advertencias de @${numero}.`, mentions: [`${numero}@s.whatsapp.net`] },
        { quoted: msg }
      );
    }

    const cantidad = agregarAdvertencia(chatId, numero);

    if (cantidad >= MAX_ADVERTENCIAS) {
      const participante = await resolverParticipante(sock, chatId, numero);
      reiniciarAdvertencias(chatId, numero);

      if (participante) {
        try {
          await sock.groupParticipantsUpdate(chatId, [participante.id], "remove");
          return await sock.sendMessage(
            chatId,
            {
              text: `🚫 @${numero} llegó a *${MAX_ADVERTENCIAS}* advertencias y fue expulsado.`,
              mentions: [participante.id],
            },
            { quoted: msg }
          );
        } catch (_) {
          return await sock.sendMessage(
            chatId,
            {
              text: `⚠️ @${numero} llegó a *${MAX_ADVERTENCIAS}* advertencias pero no pude expulsarlo (hazme admin).`,
              mentions: [`${numero}@s.whatsapp.net`],
            },
            { quoted: msg }
          );
        }
      }
    }

    await sock.sendMessage(
      chatId,
      {
        text: `⚠️ @${numero} recibió una advertencia (*${cantidad}/${MAX_ADVERTENCIAS}*).`,
        mentions: [`${numero}@s.whatsapp.net`],
      },
      { quoted: msg }
    );
  },
};
