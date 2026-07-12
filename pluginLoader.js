import fs from "fs";
import path from "path";
import url from "url";
import chalk from "chalk";
import { config } from "./config.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pluginsPath = path.join(__dirname, "plugins");

const ICONOS_CATEGORIA = {
  General: "🦋",
  Info: "🎀",
  busquedas: "🔭",
  Descargas: "🌹",
  Utilidades: "🔧",
  Grupo: "👑",
  Economia: "💰",
  Diversión: "🎮",
  Anime: "💕",
  Ai: "🦾",
  Seguridad: "🛡️",
  Owner: "💎",
  Otros: "✨",
};

const ANCHO = 40;

let ultimoEstadoCarga = { invalidos: [], errores: [] };

export function obtenerEstadoUltimaCarga() {
  return ultimoEstadoCarga;
}

function lineaCaja(texto = "", color = (t) => t) {
  const visible = texto.replace(/\x1b\[[0-9;]*m/g, "");
  const relleno = Math.max(0, ANCHO - visible.length - 4);
  return chalk.magentaBright("│ ") + color(texto) + " ".repeat(relleno) + chalk.magentaBright(" │");
}

function bordeSuperior() {
  return chalk.magentaBright("╭" + "─".repeat(ANCHO - 2) + "╮");
}

function bordeInferior() {
  return chalk.magentaBright("╰" + "─".repeat(ANCHO - 2) + "╯");
}

export async function loadPlugins() {
  const plugins = [];
  const invalidos = [];
  const errores = [];

  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(pluginsPath)
    .filter((file) => file.endsWith(".js"));

  const total = files.length || 1;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const pluginUrl = url.pathToFileURL(path.join(pluginsPath, file)).href;
      const module = await import(`${pluginUrl}?update=${Date.now()}`);
      const plugin = module.default;

      if (!plugin || !plugin.command || !plugin.run) {
        invalidos.push(file);
      } else {
        plugin.fileName = file;
        plugins.push(plugin);
      }
    } catch (err) {
      errores.push({ file, err });
    }

    const barraLargo = 18;
    const llenos = Math.round(((i + 1) / total) * barraLargo);
    const barra = "▓".repeat(llenos) + "░".repeat(barraLargo - llenos);

    process.stdout.write(
      `\r🦋 ${chalk.magentaBright(barra)} ${i + 1}/${total}  `
    );
  }

  process.stdout.write("\n\n");

  ultimoEstadoCarga = { invalidos, errores };

  const categorias = {};
  for (const p of plugins) {
    const cat = p.category || "Otros";
    categorias[cat] = (categorias[cat] || 0) + 1;
  }

  console.log(bordeSuperior());
  console.log(lineaCaja(`🌹 ${config.botName}`, chalk.white.bold));
  console.log(lineaCaja(`✅ ${plugins.length} plugin(s) cargado(s)`, chalk.green));

  const nombresCategorias = Object.entries(categorias).sort();
  if (nombresCategorias.length > 0) {
    console.log(chalk.magentaBright("├" + "─".repeat(ANCHO - 2) + "┤"));
    for (const [cat, cantidad] of nombresCategorias) {
      const icono = ICONOS_CATEGORIA[cat] || "✨";
      console.log(lineaCaja(`${icono} ${cat}: ${cantidad}`, chalk.gray));
    }
  }

  if (invalidos.length > 0) {
    console.log(chalk.magentaBright("├" + "─".repeat(ANCHO - 2) + "┤"));
    console.log(lineaCaja(`⚠️ ${invalidos.length} inválido(s)`, chalk.yellow));
    for (const file of invalidos) {
      console.log(lineaCaja(`  · ${file}`, chalk.yellow));
    }
  }

  if (errores.length > 0) {
    console.log(chalk.magentaBright("├" + "─".repeat(ANCHO - 2) + "┤"));
    console.log(lineaCaja(`❌ ${errores.length} con error`, chalk.red));
    for (const { file, err } of errores) {
      const mensaje = String(err.message || err).slice(0, 30);
      console.log(lineaCaja(`  · ${file}`, chalk.red));
      console.log(lineaCaja(`    ${mensaje}`, chalk.red));
    }
  }

  console.log(bordeInferior());
  console.log("");

  return plugins;
}
