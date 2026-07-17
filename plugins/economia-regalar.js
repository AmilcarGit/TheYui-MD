import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

function obtenerObjetivo(msg) {
  if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
    return msg.message.extendedTextMessage.contextInfo.participant;
  }
  return null;
}

export default {
  command: ["regalar"],
  category: "Economia",
  requiereRegistro: true,
  description: "Regala Yui a otro usuario, sin comisión.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];

    const objetivo = obtenerObjetivo(msg);
    const montoTexto = args.find((a) => /^\d+$/.test(a));
    const monto = montoTexto ? parseInt(montoTexto, 10) : null;

    if (!objetivo || !monto) {
      return await sock.sendMessage(
        chatId,
        { text: "🎁 Uso: *regalar <monto>* mencionando o respondiendo a quien quieres regalarle.\nEjemplo: *regalar 100* (respondiendo a un mensaje)" },
        { quoted: msg }
      );
    }

    const numeroObjetivo = objetivo.split("@")[0].split(":")[0];

    if (numeroObjetivo === numero) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ No puedes regalarte Yui a ti mismo/a." },
        { quoted: msg }
      );
    }

    if (monto <= 0) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ El monto debe ser mayor a 0." },
        { quoted: msg }
      );
    }

    const usuario = obtenerUsuario(numero);
    if (usuario.saldo < monto) {
      return await sock.sendMessage(
        chatId,
        { text: `❌ No tienes suficiente saldo. Tienes ${formatearMonto(usuario.saldo)}.` },
        { quoted: msg }
      );
    }

    const receptor = obtenerUsuario(numeroObjetivo);
    guardarUsuario(numero, { saldo: usuario.saldo - monto });
    guardarUsuario(numeroObjetivo, { saldo: receptor.saldo + monto });

    await sock.sendMessage(
      chatId,
      {
        text: `🎁 @${numero} le regaló *${formatearMonto(monto)}* a @${numeroObjetivo}. ¡Qué generosidad! 💕`,
        mentions: [sender, objetivo],
      },
      { quoted: msg }
    );
  },
};
