import { config } from "../config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_IMAGE_PATH = path.join(__dirname, "..", "assets", "menu.jpg");

let imagenMenuCache = null;

async function obtenerImagenMenu() {
  if (imagenMenuCache) return imagenMenuCache;
  try {
    imagenMenuCache = fs.readFileSync(MENU_IMAGE_PATH);
    return imagenMenuCache;
  } catch (err) {
    return null;
  }
}

const ICONOS_CATEGORIA = {
  General: "🦋",
  Grupo: "👑",
  Descargas: "🌹",
  Anime: "💕",
  Owner: "💎",
  Info: "🎀",
  Otros: "✨",
  Diversión: "🎮",
  Utilidades: "🔧",
  Seguridad: "🛡️",
};

function formatearUptime(segundos) {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default {
  command: ["menu", "help", "ayuda"],
  category: "General",
  description: "Muestra el menú de comandos con estilo waifu.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId, allPlugins } = context;

    const categorias = {};
    for (const plugin of allPlugins) {
      const categoria = plugin.category || "Otros";
      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(plugin);
    }

    const fecha = new Date().toLocaleString("es-HN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const totalComandos = allPlugins.reduce(
      (acc, p) => acc + p.command.length,
      0
    );
    const numero = sender.split("@")[0].split(":")[0];
    const uptime = formatearUptime(process.uptime());
    const nombresCategorias = Object.keys(categorias).sort();

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `   ✨ *${config.botName.toUpperCase()}* ✨\n`;
    texto += `   _Tu waifu inteligente_ 💕\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    texto += `╭─🎀 *ESTADÍSTICAS* 🎀\n`;
    texto += `│ 👤 Usuario: @${numero}\n`;
    texto += `│ 💎 Creador: ${config.creator}\n`;
    texto += `│ 💵 Moneda: Yui\n`;
    texto += `│ ⏱️ Uptime: ${uptime}\n`;
    texto += `│ ⚡ Comandos: ${totalComandos}\n`;
    texto += `│ 📦 Plugins: ${allPlugins.length}\n`;
    texto += `│ 🕐 ${fecha}\n`;
    texto += `╰────────────────────────╯\n`;

    for (const categoria of nombresCategorias) {
      const icono = ICONOS_CATEGORIA[categoria] || "✨";
      texto += `\n╭─${icono} *${categoria.toUpperCase()}* ${icono}\n`;
      for (const plugin of categorias[categoria]) {
        const comandoPrincipal = plugin.command[0];
        const alias = plugin.command.slice(1).length > 0
          ? ` (${plugin.command.slice(1).join(", ")})`
          : "";
        texto += `│ ➤ *${comandoPrincipal}*${alias}\n`;
        texto += `│   ${plugin.description || "Sin descripción"}\n`;
      }
      texto += `╰────────────────────────╯\n`;
    }

    texto += `\n🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 _Sin prefijo — escribe el comando directo_\n`;
    texto += `🌹 *${config.botName}* — Inteligente · Rápida · Segura · Leal 🌹`;

    const imagen = await obtenerImagenMenu();
    if (imagen) {
      await sock.sendMessage(
        chatId,
        {
          image: imagen,
          caption: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    }
  },
};