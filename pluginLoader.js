import fs from "fs";
import path from "path";
import url from "url";
import chalk from "chalk";
import { config } from "./config.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pluginsPath = path.join(__dirname, "plugins");

const ANCHO = 48;
const LINEA = "─".repeat(ANCHO);

let ultimoEstadoCarga = { invalidos: [], errores: [] };

const TITULO_GRANDE = "𝗧𝗛𝗘𝗬𝗨𝗜-𝗠𝗗";
const COLORES_LED = ["#ff2fb0", "#ff5fc2", "#ff8fd4", "#ffb8e6", "#e07bff", "#c04fff", "#a020f0", "#ff2fb0", "#ff5fc2"];

function tituloLed3D() {
  const letras = [...TITULO_GRANDE];

  const frente = letras
    .map((c, i) => chalk.hex(COLORES_LED[i % COLORES_LED.length]).bold(c))
    .join("");

  const sombra = chalk.hex("#3a0a4a")(TITULO_GRANDE);
  const brillo = chalk.hex("#ff2fb0")("▔".repeat(TITULO_GRANDE.length + 4));

  return `\n   ${frente}\n    ${sombra}\n   ${brillo}\n`;
}

export function obtenerEstadoUltimaCarga() {
  return ultimoEstadoCarga;
}

function filaConPuntos(etiqueta, valor) {
  const inicio = `  ${etiqueta} `;
  const fin = ` ${valor}`;
  const puntos = Math.max(2, ANCHO - inicio.length - fin.length);
  return chalk.hex("#e07bff")(inicio) + chalk.gray(".".repeat(puntos)) + chalk.white(fin);
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

  console.log(tituloLed3D());
  console.log(chalk.hex("#d9a9ff")(`  por ${config.creator}`));
  console.log(chalk.hex("#ff9ecf")(`  ${LINEA}`));
  console.log("");

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

    const barraLargo = 30;
    const llenos = Math.round(((i + 1) / total) * barraLargo);
    const porcentaje = Math.round(((i + 1) / total) * 100);
    const barra =
      chalk.hex("#ff6fc4")("●".repeat(llenos)) +
      chalk.gray("·".repeat(barraLargo - llenos));

    process.stdout.write(
      `\r  Cargando plugins  ${barra}  ${chalk.white(porcentaje + "%")}   `
    );
  }

  process.stdout.write("\n\n");

  ultimoEstadoCarga = { invalidos, errores };

  const categorias = {};
  for (const p of plugins) {
    const cat = p.category || "Otros";
    categorias[cat] = (categorias[cat] || 0) + 1;
  }

  console.log(filaConPuntos("Comandos cargados", plugins.length));
  console.log("");

  const nombresCategorias = Object.entries(categorias).sort();
  if (nombresCategorias.length > 0) {
    for (const [cat, cantidad] of nombresCategorias) {
      console.log(filaConPuntos(cat, cantidad));
    }
    console.log("");
  }

  if (invalidos.length > 0) {
    console.log(chalk.hex("#ff9ecf")(`  ${LINEA}`));
    console.log(chalk.yellow.bold(`  ⚠  ${invalidos.length} archivo(s) inválido(s)`));
    for (const file of invalidos) {
      console.log(chalk.yellow(`     · ${file}`));
    }
    console.log("");
  }

  if (errores.length > 0) {
    console.log(chalk.hex("#ff9ecf")(`  ${LINEA}`));
    console.log(chalk.red.bold(`  ✕  ${errores.length} con error al cargar`));
    for (const { file, err } of errores) {
      const mensaje = String(err.message || err).slice(0, 40);
      console.log(chalk.red(`     · ${file}`));
      console.log(chalk.redBright(`       ${mensaje}`));
    }
    console.log("");
  }

  console.log(chalk.hex("#ff9ecf")(`  ${LINEA}`));
  console.log(chalk.greenBright(`  ✓  Listo`));
  console.log("");

  return plugins;
}
