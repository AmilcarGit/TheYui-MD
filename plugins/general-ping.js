export default {
  command: ["ping", "speed"],
  category: "General",
  description: "Muestra qué tan rápido responde el bot en este momento.",

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const inicio = Date.now();

    const enviado = await sock.sendMessage(
      chatId,
      { text: "🏓 Calculando velocidad..." },
      { quoted: msg }
    );

    const latencia = Date.now() - inicio;

    let calificacion = "🐢 Un poco lenta";
    if (latencia < 200) calificacion = "⚡ Súper rápida";
    else if (latencia < 600) calificacion = "🦋 Rápida";
    else if (latencia < 1500) calificacion = "🌸 Normal";

    const texto =
      `╭─「 🏓 *PONG!* 」\n` +
      `│ ⏱️ Velocidad: *${latencia} ms*\n` +
      `│ 💕 ${calificacion}\n` +
      `╰────────────────`;

    try {
      await sock.sendMessage(chatId, {
        text: texto,
        edit: enviado.key,
      });
    } catch (_) {
      await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
    }
  },
};
