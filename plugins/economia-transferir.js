import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

export default {
  command: ["transferir", "pagar", "dar"],
  category: "Economia",
  requiereRegistro: true,
  description: "Transfiere Yui a otro usuario. Uso: transferir <monto> (mencionando o respondiendo a alguien).",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];

    let objetivo = null;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      objetivo = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      objetivo = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const monto = parseInt(args.find((a) => /^\d+$/.test(a)), 10);

    if (!objetivo || !monto || monto <= 0) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `💵 Uso: menciona o responde a alguien y escribe *transferir <monto>*\n` +
            `Ejemplo: *transferir 100* (respondiendo a un mensaje)`,
        },
        { quoted: msg }
      );
    }

    const numeroObjetivo = objetivo.split("@")[0].split(":")[0];

    if (numeroObjetivo === numero) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ No puedes transferirte Yui a ti mismo/a." },
        { quoted: msg }
      );
    }

    const usuario = obtenerUsuario(numero);

    if (usuario.saldo < monto) {
      return await sock.sendMessage(
        chatId,
        {
          text: `❌ No tienes suficiente saldo. Tu efectivo disponible es ${formatearMonto(usuario.saldo)}.`,
        },
        { quoted: msg }
      );
    }

    const receptor = obtenerUsuario(numeroObjetivo);

    guardarUsuario(numero, { saldo: usuario.saldo - monto });
    guardarUsuario(numeroObjetivo, { saldo: receptor.saldo + monto });

    await sock.sendMessage(
      chatId,
      {
        text:
          `✅ *Transferencia exitosa*\n\n` +
          `👤 De: @${numero}\n` +
          `👤 Para: @${numeroObjetivo}\n` +
          `💵 Monto: ${formatearMonto(monto)}`,
        mentions: [sender, objetivo],
      },
      { quoted: msg }
    );
  },
};
