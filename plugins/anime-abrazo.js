export default {
  command: ["hug", "abrazo"],
  category: "Anime",
  description: "Envía un abrazo anime. Si respondes a alguien, lo abrazas.",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    let mencionado = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      if (mentions && mentions.length > 0) {
        mencionado = mentions[0];
      }
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      mencionado = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const usuario = sender.split("@")[0];
    let texto = `@${usuario} te ha dado un abrazo 🤗`;

    if (mencionado) {
      const mencionadoNum = mencionado.split("@")[0];
      texto = `@${usuario} abrazó a @${mencionadoNum} 🤗`;
    }

    try {
      const response = await fetch("https://api.waifu.pics/sfw/hug");
      const data = await response.json();
      const imageUrl = data.url;
      if (!imageUrl) throw new Error("No se obtuvo imagen");

      const mentions = [sender];
      if (mencionado) mentions.push(mencionado);

      await sock.sendMessage(
        chatId,
        {
          image: { url: imageUrl },
          caption: texto,
          mentions: mentions,
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error("❌ Error en comando hug:", error);
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Ocurrió un error al obtener la imagen de abrazo. Intenta más tarde.",
        },
        { quoted: msg }
      );
    }
  },
};