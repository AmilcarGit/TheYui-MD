import { config } from "../config.js";
import { resolverParticipante } from "../middlewares.js";

export default {
  command: ["kick", "expulsar"],
  category: "Grupo",
  description: "Expulsa a un miembro del grupo.",
  groupOnly: true,
  adminOnly: true,
  requiereBotAdmin: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    let numero = "";

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      numero = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      numero = msg.message.extendedTextMessage.contextInfo.participant
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
    } else if (args[0]) {
      numero = args[0].replace(/\D/g, "");
    }

    if (!numero) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❀ Menciona, responde un mensaje o escribe el número del usuario a expulsar.",
        },
        { quoted: msg }
      );
    }

    if (numero === config.ownerNumber) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❌ No puedo expulsar al *creador* del bot.",
        },
        { quoted: msg }
      );
    }

    const botNumero = String(sock.user?.id || "")
      .split("@")[0]
      .split(":")[0]
      .replace(/\D/g, "");

    if (numero === botNumero) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❌ No puedo expulsarme a mí mismo 😅",
        },
        { quoted: msg }
      );
    }

    const participante = await resolverParticipante(sock, chatId, numero);

    if (!participante) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❌ Ese usuario no pertenece al grupo.",
        },
        { quoted: msg }
      );
    }

    try {
      await sock.groupParticipantsUpdate(
        chatId,
        [participante.id],
        "remove"
      );

      await sock.sendMessage(
        chatId,
        {
          text: `✅ @${numero} fue expulsado del grupo.`,
          mentions: [participante.id],
        },
        { quoted: msg }
      );
    } catch (e) {
      console.log(e);

      await sock.sendMessage(
        chatId,
        {
          text: "❌ No pude expulsar al usuario.",
        },
        { quoted: msg }
      );
    }
  },
};
