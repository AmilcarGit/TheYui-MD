function formatearUptime(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h}h ${m}m ${s}s`;
}

export default {
  command: ["hola", "hi"],
  category: "General",
  description: "Saludo de ejemplo para probar que el bot responde.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const uptime = formatearUptime(process.uptime());

    await sock.sendMessage(
      chatId,
      {
        text:
          `❀「 *${config.botName}* 」❀\n\n` +
          `👋 Hola @${numero}, ¡todo bien por aquí!\n` +
          `👑 Creador: *${config.creator}*\n` +
          `🔥 Activo desde hace: *${uptime}*\n\n` +
          `_✿ No uso prefijo — escribe el comando directo._\n` +
          `_Escribe *menu* para ver todos mis comandos._`,
        mentions: [sender],
      },
      { quoted: msg }
    );
  },
};
