import { exec } from "child_process";
import util from "util";

const execute = util.promisify(exec);

export default {
  command: ["update", "gitpull", "pull"],
  category: "Owner",
  description: "Actualiza el bot",
  owner: true,
  ownerOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    try {
      await sock.sendMessage(
        chatId,
        { text: "🔄 Actualizando el bot...\nEjecutando: git pull" },
        { quoted: msg }
      );

      const { stdout, stderr } = await execute("git pull");

      let texto = "✅ *Actualización completada*\n\n";

      if (stdout) texto += `📥 *Salida:*\n\`\`\`\n${stdout.trim()}\n\`\`\`\n`;
      if (stderr) texto += `\n⚠️ *Avisos:*\n\`\`\`\n${stderr.trim()}\n\`\`\`\n`;

      await sock.sendMessage(
        chatId,
        { text: texto },
        { quoted: msg }
      );
    } catch (err) {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ Error al ejecutar git pull.\n\n\`\`\`\n${err.message}\n\`\`\``,
        },
        { quoted: msg }
      );
    }
  },
};