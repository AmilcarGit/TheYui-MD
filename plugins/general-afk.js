import { marcarAfk } from "../afkDB.js";

export default {
  command: ["afk"],
  category: "General",
  description: "Marca que no estás disponible. Uso: afk [razón opcional]",

  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const razon = args.join(" ").trim();

    marcarAfk(numero, razon);

    await sock.sendMessage(
      chatId,
      {
        text:
          `💤 @${numero} ahora está *AFK*.\n` +
          (razon ? `📝 Razón: ${razon}` : `_Sin razón especificada_`) +
          `\n\n_Volverá a estar disponible en cuanto escriba algo._`,
        mentions: [sender],
      },
      { quoted: msg }
    );
  },
};
