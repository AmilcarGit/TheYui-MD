import fs from "fs";
import path from "path";

const DB_PATH = "./database/grupos.json";

function asegurarDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

export function cargarGrupos() {
  asegurarDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

export function guardarGrupos(grupos) {
  asegurarDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(grupos, null, 2));
}

export function obtenerConfigGrupo(chatId) {
  const grupos = cargarGrupos();
  return {
    welcome: true,
    antilink: true,
    activo: true,
    soloPrincipal: false,
    ...(grupos[chatId] || {}),
  };
}

export function actualizarConfigGrupo(chatId, cambios) {
  const grupos = cargarGrupos();
  const actual = obtenerConfigGrupo(chatId);
  grupos[chatId] = { ...actual, ...cambios };
  guardarGrupos(grupos);
  return grupos[chatId];
}