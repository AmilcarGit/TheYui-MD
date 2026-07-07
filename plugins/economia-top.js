import { obtenerRanking, formatearMonto } from "../economyDB.js";

export default {
  command: ["topricos", "toprich", "ranking"],
  category: "Economia",
  description: "Muestra el top de usuarios con más Yui.",

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    const ranking = obtenerRanking(10);

    if (ranking.length === 0) {
      return await sock.sendMessage(
        chatId,
        { text: "💵 Todavía nadie tiene Yui registrada. ¡Usa *trabajar* o *diario* para empezar!" },
        { quoted: msg }
      );
    }

    const medallas = ["🥇", "🥈", "🥉"];
    let texto = `╭─「 💎 *TOP RICOS* 💎 」\n`;

    ranking.forEach((u, i) => {
      const posicion = medallas[i] || `${i + 1}.`;
      texto += `│ ${posicion} @${u.numero} — ${formatearMonto(u.total)}\n`;
    });

    texto += `╰────────────────`;

    await sock.sendMessage(
      chatId,
      { text: texto, mentions: ranking.map((u) => `${u.numero}@s.whatsapp.net`) },
      { quoted: msg }
    );
  },
};
