import * as subbotManager from "../subbotManager.js";

export default {
  command: ["subbot", "serbot", "subbots", "delsubbot"],
  category: "Owner",
  description:
    "Administra subbots: subbot <número> (vincular), subbots (listar), delsubbot <número> (eliminar).",
  privateOnly: false,
  ownerOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId, body } = context;
    const comando = body.trim().split(/\s+/)[0].toLowerCase();

    if (comando === "subbots") {
      const lista = subbotManager.listarSubbots();

      if (lista.length === 0) {
        return await sock.sendMessage(
          chatId,
          { text: "💕 No hay subbots activos por el momento." },
          { quoted: msg }
        );
      }

      let texto = `╭─「 🦋 *SUBBOTS ACTIVOS* 」\n`;
      for (const s of lista) {
        texto += `│ 📱 ${s.numero} — ${s.conectado ? "✅ Conectado" : "⏳ Conectando..."}\n`;
      }
      texto += `╰────────────────`;

      return await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
    }

    if (comando === "delsubbot") {
      const numero = args[0];
      if (!numero) {
        return await sock.sendMessage(
          chatId,
          { text: "💕 Uso: *delsubbot <número>*" },
          { quoted: msg }
        );
      }

      const eliminado = await subbotManager.eliminarSubbot(numero);
      try {
        return await sock.sendMessage(
          chatId,
          {
            text: eliminado
              ? `✅ Subbot ${numero} eliminado.`
              : `❌ No encontré ningún subbot activo con ese número.`,
          },
          { quoted: msg }
        );
      } catch (_) {
        console.log(`✅ Subbot ${numero} eliminado (no se pudo confirmar por chat porque ese mismo subbot cerró su conexión).`);
        return;
      }
    }

    // comando === "subbot" o "serbot" → crear/vincular uno nuevo
    const numero = args[0];

    if (!numero) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 🦋 *SUBBOTS* 」\n` +
            `│ *subbot <número>* — vincular un subbot nuevo\n` +
            `│ *subbots* — ver los subbots activos\n` +
            `│ *delsubbot <número>* — eliminar un subbot\n` +
            `╰────────────────\n\n` +
            `Ejemplo: *subbot 51987654321*`,
        },
        { quoted: msg }
      );
    }

    if (subbotManager.existeSubbot(numero)) {
      return await sock.sendMessage(
        chatId,
        { text: `⚠️ Ya hay un subbot activo o conectándose con el número ${numero}.` },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      { text: `⏳ Generando el código de vinculación para ${numero}...` },
      { quoted: msg }
    );

    try {
      await subbotManager.crearSubbot(numero, {
        onPairingCode: async (code) => {
          await sock.sendMessage(chatId, {
            text:
              `🦋 *Código de vinculación para el subbot*\n\n` +
              `📱 Número: ${numero}\n` +
              `🔑 Código: *${code}*\n\n` +
              `Ve a WhatsApp > Dispositivos vinculados > Vincular con número de teléfono, e ingresa el código.`,
          });
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
        { text: `❌ ${err.message || "No se pudo crear el subbot."}` },
        { quoted: msg }
      );
    }
  },
};
