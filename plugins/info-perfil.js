import { resolverParticipante } from "../middlewares.js";

export default {
  command: ["perfil", "profile"],
  category: "Info",
  description: "Muestra tu perfil o el de un usuario mencionado.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;

    let objetivo = sender;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      objetivo = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      objetivo = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const numero = objetivo.split("@")[0].split(":")[0];

    let fotoUrl = null;
    try {
      fotoUrl = await sock.profilePictureUrl(objetivo, "image");
    } catch (e) {
      fotoUrl = null;
    }

    const esGrupo = chatId.endsWith("@g.us");
    let esAdminEnGrupo = null;

    if (esGrupo) {
      try {
        const participante = await resolverParticipante(sock, chatId, numero);
        esAdminEnGrupo = Boolean(participante?.admin);
      } catch (e) {
        esAdminEnGrupo = null;
      }
    }

    let texto = `╭─「 👤 *PERFIL* 」\n`;
    texto += `│ 📱 Número: @${numero}\n`;
    if (esGrupo && esAdminEnGrupo !== null) {
      texto += `│ 👑 Admin del grupo: ${esAdminEnGrupo ? "Sí ✅" : "No"}\n`;
    }
    texto += `╰────────────────`;

    if (fotoUrl) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: fotoUrl },
          caption: texto,
          mentions: [objetivo],
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: texto + `\n\n_Sin foto de perfil pública._`,
          mentions: [objetivo],
        },
        { quoted: msg }
      );
    }
  },
};