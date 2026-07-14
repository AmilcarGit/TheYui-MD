import * as subbotManager from "../subbotManager.js";
import { resolverNumeroReal } from "../middlewares.js";

export default {
  command: ["code", "codigo"],
  category: "General",
  description: "Genera tu propio código de vinculación para crear un subbot con tu número.",

  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;

    const numeroManual = args[0]?.replace(/\D/g, "");
    let numero = numeroManual || (await resolverNumeroReal(sock, sender));

    const senderEsLid = sender.endsWith("@lid");
    const idLidCrudo = sender.split("@")[0].split(":")[0].replace(/\D/g, "");
    const noSePudoResolver = senderEsLid && numero === idLidCrudo && !numeroManual;

    if (noSePudoResolver) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "⚠️ No pude detectar tu número real automáticamente.\n\n" +
            "Escribe tu número manualmente así: *code <tu número>*\n" +
            "Ejemplo: *code 51910227479* (con código de país, sin + ni espacios)",
        },
        { quoted: msg }
      );
    }

    if (subbotManager.existeSubbot(numero)) {
      return await sock.sendMessage(
        chatId,
        { text: "⚠️ Ya tienes un subbot activo o conectándose con tu número." },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⏳ Generando tu código de vinculación..." },
      { quoted: msg }
    );

    try {
      await subbotManager.crearSubbot(numero, {
        onPairingCode: async (code) => {
          await sock.sendMessage(chatId, {
            text:
              `🦋 *Tu código de vinculación*\n\n` +
              `📱 Número: ${numero}\n\n` +
              `Ve a WhatsApp > Dispositivos vinculados > Vincular con número de teléfono, e ingresa el código de abajo.\n\n` +
              `⏳ El código expira en unos minutos, si no lo usas a tiempo escribe *code* de nuevo.`,
          });
          await sock.sendMessage(chatId, { text: code });
        },
        onEstado: async (texto) => {
          try {
            await sock.sendMessage(chatId, { text: texto });
          } catch (_) {}
        },
      });
    } catch (err) {
      await sock.sendMessage(
        chatId,
        { text: `❌ ${err.message || "No se pudo generar tu código."}` },
        { quoted: msg }
      );
    }
  },
};
