import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import webp from "node-webpmux";

const execFileAsync = promisify(execFile);

export const PACK_DEFAULT = "𝚃𝙷𝙴𝚈𝚄𝙸🦋";
export const AUTOR_DEFAULT = "© AmilcarGit 2026";

const CARPETA_TEMP = "./temp";

function asegurarCarpetaTemp() {
  if (!fs.existsSync(CARPETA_TEMP)) {
    fs.mkdirSync(CARPETA_TEMP, { recursive: true });
  }
}

/**
 * Convierte un buffer de imagen a .webp de 512x512 (con relleno transparente)
 * usando ffmpeg por línea de comandos. Requiere que ffmpeg esté instalado
 * en el sistema (en Termux: pkg install ffmpeg).
 */
export async function imagenABufferWebp(buffer) {
  asegurarCarpetaTemp();

  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const inputPath = path.join(CARPETA_TEMP, `${id}-in`);
  const outputPath = path.join(CARPETA_TEMP, `${id}-out.webp`);

  fs.writeFileSync(inputPath, buffer);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vf",
      "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
      "-vcodec",
      "libwebp",
      "-lossless",
      "0",
      "-qscale",
      "75",
      "-preset",
      "picture",
      "-an",
      "-vsync",
      "0",
      outputPath,
    ]);

    return fs.readFileSync(outputPath);
  } catch (err) {
    if (String(err.message || err).includes("ENOENT")) {
      throw new Error(
        "ffmpeg no está instalado en el sistema. En Termux corre: pkg install ffmpeg -y"
      );
    }
    throw err;
  } finally {
    try {
      fs.unlinkSync(inputPath);
    } catch (_) {}
    try {
      fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

export async function agregarMetadataSticker(
  webpBuffer,
  packName = PACK_DEFAULT,
  authorName = AUTOR_DEFAULT
) {
  const img = new webp.Image();

  const json = {
    "sticker-pack-id": `thekael-yui-md-${Date.now()}`,
    "sticker-pack-name": packName,
    "sticker-pack-publisher": authorName,
    emojis: ["🦋"],
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  await img.load(webpBuffer);
  img.exif = exif;

  return await img.save(null);
}

/**
 * Convierte un buffer de imagen en un sticker .webp con metadata de pack/autor.
 * Si falla la metadata, devuelve el webp normal (el sticker igual se manda).
 */
export async function convertirImagenASticker(buffer, packName, authorName) {
  const webpBuffer = await imagenABufferWebp(buffer);

  try {
    return await agregarMetadataSticker(webpBuffer, packName, authorName);
  } catch (err) {
    console.log("No se pudo agregar metadata al sticker:", err);
    return webpBuffer;
  }
}
