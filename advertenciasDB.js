import fs from "fs";
import path from "path";

const DB_PATH = "./database/advertencias.json";

function asegurarDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

function cargar() {
  asegurarDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function guardar(data) {
  asegurarDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function clave(chatId, numero) {
  return `${chatId}_${numero}`;
}

export function obtenerAdvertencias(chatId, numero) {
  const data = cargar();
  return data[clave(chatId, numero)] || 0;
}

export function agregarAdvertencia(chatId, numero) {
  const data = cargar();
  const k = clave(chatId, numero);
  data[k] = (data[k] || 0) + 1;
  guardar(data);
  return data[k];
}

export function reiniciarAdvertencias(chatId, numero) {
  const data = cargar();
  const k = clave(chatId, numero);
  delete data[k];
  guardar(data);
}
