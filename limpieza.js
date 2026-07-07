import fs from "fs";
import path from "path";

const CARPETA_TEMP = "./temp";
const EDAD_MAXIMA_MS = 30 * 60 * 1000; // 30 minutos

function asegurarCarpetaTemp() {
  if (!fs.existsSync(CARPETA_TEMP)) {
    fs.mkdirSync(CARPETA_TEMP, { recursive: true });
  }
}

/**
 * Borra archivos de la carpeta ./temp más viejos que EDAD_MAXIMA_MS.
 * Devuelve estadísticas de lo que se limpió.
 */
export function limpiarTemporales() {
  asegurarCarpetaTemp();

  let archivosEliminados = 0;
  let bytesLiberados = 0;
  const ahora = Date.now();

  try {
    const archivos = fs.readdirSync(CARPETA_TEMP);

    for (const nombre of archivos) {
      const rutaCompleta = path.join(CARPETA_TEMP, nombre);

      try {
        const stats = fs.statSync(rutaCompleta);
        const edad = ahora - stats.mtimeMs;

        if (stats.isFile() && edad > EDAD_MAXIMA_MS) {
          bytesLiberados += stats.size;
          fs.unlinkSync(rutaCompleta);
          archivosEliminados++;
        }
      } catch (_) {
        // Si un archivo falla al borrarse, seguimos con los demás.
      }
    }
  } catch (_) {
    // Carpeta vacía o inaccesible, no pasa nada.
  }

  if (global.gc) {
    try {
      global.gc();
    } catch (_) {}
  }

  return { archivosEliminados, bytesLiberados };
}

export function obtenerUsoMemoria() {
  const uso = process.memoryUsage();
  return {
    rssMB: Math.round((uso.rss / 1024 / 1024) * 10) / 10,
    heapUsadoMB: Math.round((uso.heapUsed / 1024 / 1024) * 10) / 10,
  };
}

export function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Activa la limpieza automática cada `intervaloMs` (por defecto cada 30 min).
 */
export function iniciarLimpiezaAutomatica(intervaloMs = 30 * 60 * 1000, onLimpieza) {
  asegurarCarpetaTemp();

  setInterval(() => {
    const resultado = limpiarTemporales();
    if (onLimpieza) onLimpieza(resultado);
  }, intervaloMs);
}
