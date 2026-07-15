export default {
  command: ["abrirgrupo", "cerrargrupo"],
  category: "Grupo",
  description: "Controla si solo los admins pueden escribir en el grupo.",
  groupOnly: true,
  adminOnly: true,
  requiereBotAdmin: true,

  run: async (sock, msg, args, context) => {
    const { chatId, body } = context;
    const comando = body.trim().split(/\s+/)[0].toLowerCase();

    try {
      if (comando === "cerrargrupo") {
        await sock.groupSettingUpdate(chatId, "announcement");
        await sock.sendMessage(
          chatId,
          { text: "🔒 Grupo cerrado. Solo los administradores pueden escribir." },
          { quoted: msg }
        );
      } else {
        await sock.groupSettingUpdate(chatId, "not_announcement");
        await sock.sendMessage(
          chatId,
          { text: "🔓 Grupo abierto. Todos los miembros pueden escribir de nuevo." },
          { quoted: msg }
        );
      }
    } catch (err) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude cambiar la configuración del grupo." },
        { quoted: msg }
      );
    }
  },
};
