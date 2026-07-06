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
  General: "◆",
  Grupo: "◈",
  Descargas: "▣",
  Owner: "▲",
  Otros: "◇", 
  Anime: "𖤐",
  Info: "☙", 
};

function formatearUptime(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h}h ${m}m ${s}s`;
}

function barraDeCarga(porcentaje = 100, largo = 10) {
  const llenos = Math.round((porcentaje / 100) * largo);
  return "▓".repeat(llenos) + "░".repeat(largo - llenos);
}

export default {
  command: ["menu", "help", "ayuda"],
  category: "General",
  description: "Muestra el menú de comandos ordenado por categorías.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId, allPlugins } = context;

    const categorias = {};
    for (const plugin of allPlugins) {
      const categoria = plugin.category || "Otros";
      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(plugin);
    }

    const fecha = new Date().toLocaleString("es-HN", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const totalComandos = allPlugins.reduce(
      (acc, p) => acc + p.command.length,
      0
    );
    const numero = sender.split("@")[0].split(":")[0];
    const uptime = formatearUptime(process.uptime());

    let texto = `𓆩 ⚡ SYSTEM ONLINE ⚡ 𓆪\n`;
    texto += `『 ${config.botName.toUpperCase()} IS NOW ACTIVE 』\n`;
    texto += `${barraDeCarga(100)} 100%\n`;
    texto += `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n`;

    texto += `┌─「 *STATUS* 」\n`;
    texto += `│ ▲ Creador ······ ${config.creator}\n`;
    texto += `│ ▲ Usuario ······ @${numero}\n`;
    texto += `│ ▲ Uptime ······· ${uptime}\n`;
    texto += `│ ▲ Comandos ····· ${totalComandos}\n`;
    texto += `│ ▲ Plugins ······ ${allPlugins.length}\n`;
    texto += `│ ▲ Fecha ········ ${fecha}\n`;
    texto += `└────────────────────\n`;

    const nombresCategorias = Object.keys(categorias).sort();

    for (const categoria of nombresCategorias) {
      const icono = ICONOS_CATEGORIA[categoria] || "◇";
      texto += `\n┌─「 ${icono} *${categoria.toUpperCase()}* 」\n`;
      for (const plugin of categorias[categoria]) {
        const comandoPrincipal = plugin.command[0];
        texto += `│ ➤ *${comandoPrincipal}*\n`;
        texto += `│   ↳ ${plugin.description || "Sin descripción"}\n`;
      }
      texto += `└────────────────────\n`;
    }

    texto += `\n▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n`;
    texto += `> STATUS: CONECTADO\n`;
    texto += `> MODO: SIN PREFIJO — escribe el comando directo\n`;
    texto += `> POWERED BY: ${config.creator}\n`;
    texto += `𓆩 «${config.botName}» — Más que un bot, una leyenda. 𓆪`;

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
