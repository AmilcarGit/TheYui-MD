export default {
  command: ["kiss", "beso"],
  category: "Anime",
  description: "Envía un beso anime. Si respondes a alguien, le das un beso.",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;

    let mencionado = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      mencionado = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      mencionado = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const usuario = sender.split("@")[0];
    let texto = `@${usuario} te ha dado un beso 💋`;

    if (mencionado) {
      const mencionadoNum = mencionado.split("@")[0];
      texto = `@${usuario} le dio un beso a @${mencionadoNum} 💋💕`;
    }

    try {
      let imageUrl = null;
      try {
        const response = await fetch("https://api.waifu.pics/sfw/kiss");
        const data = await response.json();
        imageUrl = data.url;
      } catch (e) {
        const response2 = await fetch("https://nekos.life/api/v2/img/kiss");
        const data2 = await response2.json();
        imageUrl = data2.url;
      }

      if (!imageUrl) throw new Error("No se obtuvo imagen de ninguna API");

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
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Ocurrió un error al obtener la imagen de beso. Intenta más tarde.",
        },
        { quoted: msg }
      );
    }
  },
};
