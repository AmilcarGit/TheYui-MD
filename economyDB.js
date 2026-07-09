import fs from "fs";
import path from "path";

const DB_PATH = "./database/economia.json";
export const NOMBRE_MONEDA = "Yui";
export const EMOJI_MONEDA = "💵";

function asegurarDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

export function cargarEconomia() {
  asegurarDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

export function guardarEconomia(data) {
  asegurarDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function obtenerUsuario(numero) {
  const data = cargarEconomia();
  return (
    data[numero] || {
      saldo: 0,
      banco: 0,
      ultimoDaily: 0,
      ultimoTrabajo: 0,
      inventario: [],
      efectos: [],
      ultimoInteres: 0
    }
  );
}

export function guardarUsuario(numero, cambios) {
  const data = cargarEconomia();
  const actual = obtenerUsuario(numero);
  data[numero] = { ...actual, ...cambios };
  guardarEconomia(data);
  return data[numero];
}

export function sumarSaldo(numero, cantidad) {
  const actual = obtenerUsuario(numero);
  return guardarUsuario(numero, { saldo: actual.saldo + cantidad });
}

export function quitarSaldo(numero, cantidad) {
  const actual = obtenerUsuario(numero);
  const nuevo = Math.max(0, actual.saldo - cantidad);
  return guardarUsuario(numero, { saldo: nuevo });
}

export function formatearMonto(cantidad) {
  return `${cantidad.toLocaleString("es-HN")} ${NOMBRE_MONEDA} ${EMOJI_MONEDA}`;
}

export function obtenerRanking(limite = 10) {
  const data = cargarEconomia();
  return Object.entries(data)
    .map(([numero, info]) => ({
      numero,
      total: (info.saldo || 0) + (info.banco || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

export function obtenerInventarioUsuario(numero) {
  const usuario = obtenerUsuario(numero);
  return usuario.inventario || [];
}

export function guardarInventarioUsuario(numero, items) {
  return guardarUsuario(numero, { inventario: items });
}

export function agregarItem(numero, itemId) {
  const items = obtenerInventarioUsuario(numero);
  items.push(itemId);
  guardarInventarioUsuario(numero, items);
  return items;
}

export function quitarItem(numero, itemId) {
  let items = obtenerInventarioUsuario(numero);
  const index = items.indexOf(itemId);
  if (index !== -1) {
    items.splice(index, 1);
    guardarInventarioUsuario(numero, items);
  }
  return items;
}

export function tieneItem(numero, itemId) {
  const items = obtenerInventarioUsuario(numero);
  return items.includes(itemId);
}

export function contarItem(numero, itemId) {
  const items = obtenerInventarioUsuario(numero);
  return items.filter(id => id === itemId).length;
}

export function agregarEfecto(numero, efectoId) {
  const usuario = obtenerUsuario(numero);
  const efectos = usuario.efectos || [];
  if (!efectos.includes(efectoId)) {
    efectos.push(efectoId);
    guardarUsuario(numero, { efectos });
  }
  return efectos;
}

export function tieneEfecto(numero, efectoId) {
  const usuario = obtenerUsuario(numero);
  return (usuario.efectos || []).includes(efectoId);
}

export function obtenerEfectos(numero) {
  const usuario = obtenerUsuario(numero);
  return usuario.efectos || [];
}