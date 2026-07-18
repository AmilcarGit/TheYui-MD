export default {
  command: ["tagall", "everyone", "mencionartodos"],
  category: "Grupo",
  description: "Menciona a todos los miembros del grupo. Uso: tagall [mensaje opcional]",
  groupOnly: true,
  adminOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    let metadata;
    try {
      metadata = await sock.groupMetadata(chatId);
    } catch (e) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ No pude obtener la lista de miembros del grupo." },
        { quoted: msg }
      );
    }

    const participantes = metadata.participants.map((p) => p.id);
    const mensajeExtra = args.join(" ").trim();

    let texto = `╭─「 📢 *TAGALL* 」\n`;
    if (mensajeExtra) {
      texto += `│ ${mensajeExtra}\n`;
      texto += `╰────────────────\n\n`;
    } else {
      texto += `│ ¡Atención a todos! 🦋\n`;
      texto += `╰────────────────\n\n`;
    }

    for (const p of participantes) {
      const numero = p.split("@")[0].split(":")[0];
      texto += `📍 @${numero}\n`;
    }

    await sock.sendMessage(
      chatId,
      { text: texto, mentions: participantes },
      { quoted: msg }
    );
  },
};
