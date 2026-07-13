import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

const COSTO_PROPUESTA = 500;
const TIEMPO_EXPIRACION_MS = 5 * 60 * 1000;

const propuestasPendientes = new Map();

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
  command: ["casarse", "divorciarse", "pareja"],
  category: "Economia",
  description: "Cásate con alguien del grupo o revisa tu estado civil.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId, body } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const comando = body.trim().split(/\s+/)[0].toLowerCase();
    const usuario = obtenerUsuario(numero);

    if (comando === "pareja") {
      if (!usuario.parejaNumero) {
        return await sock.sendMessage(
          chatId,
          { text: "💔 No tienes pareja todavía. Usa *casarse* mencionando a alguien para proponerle matrimonio." },
          { quoted: msg }
        );
      }
      return await sock.sendMessage(
        chatId,
        { text: `💍 Estás casado/a con @${usuario.parejaNumero}.`, mentions: [`${usuario.parejaNumero}@s.whatsapp.net`] },
        { quoted: msg }
      );
    }

    if (comando === "divorciarse") {
      if (!usuario.parejaNumero) {
        return await sock.sendMessage(
          chatId,
          { text: "❌ No tienes pareja de quien divorciarte." },
          { quoted: msg }
        );
      }
      const parejaNumero = usuario.parejaNumero;
      guardarUsuario(numero, { parejaNumero: null });
      guardarUsuario(parejaNumero, { parejaNumero: null });

      return await sock.sendMessage(
        chatId,
        { text: `💔 Te divorciaste de @${parejaNumero}.`, mentions: [`${parejaNumero}@s.whatsapp.net`] },
        { quoted: msg }
      );
    }

    const objetivo = obtenerObjetivo(msg);

    if (!objetivo) {
      return await sock.sendMessage(
        chatId,
        { text: `💍 Menciona o responde a quien le quieres proponer matrimonio.\nEjemplo: *casarse* @persona (cuesta ${formatearMonto(COSTO_PROPUESTA)})` },
        { quoted: msg }
      );
    }

    const numeroObjetivo = objetivo.split("@")[0].split(":")[0];

    if (numeroObjetivo === numero) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ No puedes casarte contigo mismo/a." },
        { quoted: msg }
      );
    }

    if (usuario.parejaNumero) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Ya tienes pareja. Usa *divorciarse* primero si quieres casarte con alguien más." },
        { quoted: msg }
      );
    }

    const objetivoUsuario = obtenerUsuario(numeroObjetivo);
    if (objetivoUsuario.parejaNumero) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Esa persona ya tiene pareja." },
        { quoted: msg }
      );
    }

    const claveDirecta = `${numeroObjetivo}->${numero}`;
    const propuestaRecibida = propuestasPendientes.get(claveDirecta);

    if (propuestaRecibida && Date.now() < propuestaRecibida.expira) {
      if (usuario.saldo < COSTO_PROPUESTA) {
        return await sock.sendMessage(
          chatId,
          { text: `❌ Necesitas ${formatearMonto(COSTO_PROPUESTA)} para aceptar la propuesta.` },
          { quoted: msg }
        );
      }

      propuestasPendientes.delete(claveDirecta);
      guardarUsuario(numero, { saldo: usuario.saldo - COSTO_PROPUESTA, parejaNumero: numeroObjetivo });
      guardarUsuario(numeroObjetivo, { parejaNumero: numero });

      return await sock.sendMessage(
        chatId,
        {
          text: `💒 ¡@${numero} y @${numeroObjetivo} ahora están casados! Felicidades 🎉`,
          mentions: [sender, objetivo],
        },
        { quoted: msg }
      );
    }

    const claveNueva = `${numero}->${numeroObjetivo}`;
    propuestasPendientes.set(claveNueva, { expira: Date.now() + TIEMPO_EXPIRACION_MS });

    return await sock.sendMessage(
      chatId,
      {
        text:
          `💍 @${numero} le propuso matrimonio a @${numeroObjetivo}.\n\n` +
          `Para aceptar, @${numeroObjetivo} debe escribir *casarse* mencionando a @${numero} en los próximos 5 minutos.`,
        mentions: [sender, objetivo],
      },
      { quoted: msg }
    );
  },
};
