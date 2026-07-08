import os from "os";
import { config } from "../config.js";
import * as subbotManager from "../subbotManager.js";

function formatearUptime(segundos) {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatearMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default {
  command: ["infobot", "botinfo", "estado"],
  category: "Info",
  description: "Muestra el estado completo del bot: velocidad, memoria, plugins, subbots y más.",

  run: async (sock, msg, args, context) => {
    const { chatId, allPlugins } = context;

    const inicio = Date.now();
    const enviado = await sock.sendMessage(
      chatId,
      { text: "🦋 Reuniendo información..." },
      { quoted: msg }
    );
    const latencia = Date.now() - inicio;

    const memoria = process.memoryUsage();
    const uptimeProceso = formatearUptime(process.uptime());
    const uptimeSistema = formatearUptime(os.uptime());

    const subbots = subbotManager.listarSubbots();
    const subbotsConectados = subbots.filter((s) => s.conectado).length;

    const categorias = {};
    for (const p of allPlugins) {
      const cat = p.category || "Otros";
      categorias[cat] = (categorias[cat] || 0) + 1;
    }
    const totalComandos = allPlugins.reduce((acc, p) => acc + p.command.length, 0);

    let texto = `╭─「 🦋 *${config.botName.toUpperCase()}* 」\n`;
    texto += `│ 👑 Creador: ${config.creator}\n`;
    texto += `│ 💵 Moneda: Yui\n`;
    texto += `╰────────────────\n\n`;

    texto += `╭─「 ⚡ *VELOCIDAD* 」\n`;
    texto += `│ 🏓 Ping: ${latencia} ms\n`;
    texto += `╰────────────────\n\n`;

    texto += `╭─「 📊 *SISTEMA* 」\n`;
    texto += `│ ⏱️ Bot activo: ${uptimeProceso}\n`;
    texto += `│ 🖥️ Servidor activo: ${uptimeSistema}\n`;
    texto += `│ 💾 RAM usada: ${formatearMB(memoria.rss)}\n`;
    texto += `│ 📦 Heap usado: ${formatearMB(memoria.heapUsed)}\n`;
    texto += `│ 🧩 Node: ${process.version}\n`;
    texto += `│ 🗂️ Plataforma: ${os.type()} (${os.arch()})\n`;
    texto += `╰────────────────\n\n`;

    texto += `╭─「 🔌 *PLUGINS* 」\n`;
    texto += `│ ✅ Total: ${allPlugins.length} plugin(s)\n`;
    texto += `│ ⚡ Comandos: ${totalComandos}\n`;
    for (const [cat, cantidad] of Object.entries(categorias).sort()) {
      texto += `│    · ${cat}: ${cantidad}\n`;
    }
    texto += `╰────────────────\n\n`;

    texto += `╭─「 🦋 *SUBBOTS* 」\n`;
    texto += `│ 📱 Total: ${subbots.length}\n`;
    texto += `│ ✅ Conectados: ${subbotsConectados}\n`;
    texto += `╰────────────────`;

    try {
      await sock.sendMessage(chatId, { text: texto, edit: enviado.key });
    } catch (_) {
      await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
    }
  },
};
