import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

const RECOMPENSA_DIARIA = 500;
const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

export default {
  command: ["diario", "daily"],
  category: "Economia",
  description: "Reclama tu recompensa diaria de Yui (cada 24 horas).",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];

    const usuario = obtenerUsuario(numero);
    const ahora = Date.now();
    const tiempoRestante = usuario.ultimoDaily + VEINTICUATRO_HORAS_MS - ahora;

    if (tiempoRestante > 0) {
      const horas = Math.floor(tiempoRestante / (60 * 60 * 1000));
      const minutos = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));

      return await sock.sendMessage(
        chatId,
        {
          text: `⏳ Ya reclamaste tu diario. Vuelve en *${horas}h ${minutos}m*.`,
        },
        { quoted: msg }
      );
    }

    guardarUsuario(numero, {
      saldo: usuario.saldo + RECOMPENSA_DIARIA,
      ultimoDaily: ahora,
    });

    await sock.sendMessage(
      chatId,
      {
        text:
          `🎁 *¡Recompensa diaria reclamada!*\n\n` +
          `💵 +${formatearMonto(RECOMPENSA_DIARIA)}\n\n` +
          `_Vuelve mañana por más_ 💕`,
        mentions: [sender],
      },
      { quoted: msg }
    );
  },
};
