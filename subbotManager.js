import { createRequire } from "module";
const require = createRequire(import.meta.url);
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require("@whiskeysockets/baileys");
import { Boom } from "@hapi/boom";
import pino from "pino";
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { config } from "./config.js";
import { pasaFiltros, esAdminDeGrupo, botEsAdmin, esOwner } from "./middlewares.js";
import { evaluarMensaje } from "./spamGuard.js";
import { manejarRespuestaInteractiva } from "./interactiveManager.js";
import { obtenerConfigGrupo } from "./groupSettings.js";

const CARPETA_SUBBOTS = "./subbots";
const MAX_INTENTOS_RECONEXION = 2;

let pluginsCompartidos = [];
export function setPlugins(plugins) {
  pluginsCompartidos = plugins;
}

const subbotsActivos = new Map();

function limpiarNumero(numero) {
  return String(numero || "").replace(/\D/g, "");
}

function limpiarSubbotDeDisco(numeroLimpio, sessionFolder) {
  subbotsActivos.delete(numeroLimpio);

  try {
    fs.rmSync(sessionFolder, { recursive: true, force: true });
    console.log(chalk.gray(`🗑️  [Subbot ${numeroLimpio}] Carpeta de sesión eliminada.`));
  } catch (err) {
    console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] No se pudo borrar la carpeta de sesión:`), err);
  }
}

export function listarSubbots() {
  return Array.from(subbotsActivos.values()).map((s) => ({
    numero: s.numero,
    conectado: s.conectado,
  }));
}

export function existeSubbot(numero) {
  return subbotsActivos.has(limpiarNumero(numero));
}

export async function eliminarSubbot(numero) {
  const numeroLimpio = limpiarNumero(numero);
  const info = subbotsActivos.get(numeroLimpio);
  if (!info) return false;

  try {
    await info.sock?.logout?.();
  } catch (_) {}
  try {
    info.sock?.end?.(undefined);
  } catch (_) {}

  subbotsActivos.delete(numeroLimpio);

  try {
    fs.rmSync(info.sessionFolder, { recursive: true, force: true });
  } catch (_) {}

  return true;
}

/**
 * Recorre la carpeta ./subbots y reconecta automáticamente cualquier
 * subbot que ya tenga una sesión válida guardada (creds.json), sin pedir
 * código de vinculación de nuevo. Pensado para llamarse al arrancar el
 * bot principal, así los subbots no quedan "dormidos" tras un reinicio.
 */
export async function reconectarSubbotsGuardados(onEstado) {
  if (!fs.existsSync(CARPETA_SUBBOTS)) return;

  const carpetas = fs
    .readdirSync(CARPETA_SUBBOTS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (carpetas.length === 0) return;

  console.log(
    chalk.cyan(`🦋 Revisando subbots guardados (${carpetas.length} encontrado(s))...`)
  );

  for (const numero of carpetas) {
    const sessionFolder = path.join(CARPETA_SUBBOTS, numero);
    const credsPath = path.join(sessionFolder, "creds.json");

    if (!fs.existsSync(credsPath)) {
      continue;
    }

    if (subbotsActivos.has(numero)) continue;

    const registro = { sock: null, sessionFolder, conectado: false, numero };
    subbotsActivos.set(numero, registro);

    console.log(chalk.cyan(`🔄 Reconectando subbot guardado: ${numero}...`));

    try {
      await iniciarSocketSubbot(numero, sessionFolder, registro, {
        onPairingCode: () => {},
        onEstado,
      });
    } catch (err) {
      console.log(chalk.red(`❌ No se pudo reconectar el subbot ${numero}:`), err);
      subbotsActivos.delete(numero);
    }
  }
}

/**
 * Crea (o reconecta) un subbot para el número indicado.
 * onPairingCode(code) se llama cuando WhatsApp entrega el código de 8 dígitos.
 * onEstado(texto) se llama con actualizaciones de estado legibles para el usuario.
 */
export async function crearSubbot(numeroDestino, { onPairingCode, onEstado } = {}) {
  const numeroLimpio = limpiarNumero(numeroDestino);

  if (!numeroLimpio || numeroLimpio.length < 8) {
    throw new Error("Número inválido. Escríbelo con código de país, sin + ni espacios.");
  }

  if (subbotsActivos.has(numeroLimpio)) {
    throw new Error("Ya hay un subbot activo o conectándose con ese número.");
  }

  const sessionFolder = path.join(CARPETA_SUBBOTS, numeroLimpio);
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  const registro = { sock: null, sessionFolder, conectado: false, numero: numeroLimpio };
  subbotsActivos.set(numeroLimpio, registro);

  await iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado });

  return registro;
}

async function iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado }) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const usePairingCode = !fs.existsSync(`${sessionFolder}/creds.json`);

  const groupMetadataCache = new Map();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 90000,
    keepAliveIntervalMs: 25000,
    cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
  });

  registro.sock = sock;

  async function actualizarCacheGrupo(chatId) {
    try {
      const metadata = await sock.groupMetadata(chatId);
      groupMetadataCache.set(chatId, metadata);
      return metadata;
    } catch (_) {
      return null;
    }
  }

  sock.ev.on("groups.update", async ([event]) => {
    if (event?.id) await actualizarCacheGrupo(event.id);
  });

  if (usePairingCode) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(numeroLimpio);
        console.log(
          chalk.greenBright(`\n✅ [Subbot ${numeroLimpio}] Código de vinculación: `) +
            chalk.bold.white(code)
        );
        if (onPairingCode) onPairingCode(code);
      } catch (err) {
        console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] Error pidiendo el código:`), err);
        if (onEstado) onEstado(`❌ No se pudo generar el código de vinculación. Intenta de nuevo.`);
        subbotsActivos.delete(numeroLimpio);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      registro.conectado = false;

      if (shouldReconnect) {
        registro.intentosReconexion = (registro.intentosReconexion || 0) + 1;

        if (registro.intentosReconexion > MAX_INTENTOS_RECONEXION) {
          console.log(
            chalk.red(
              `❌ [Subbot ${numeroLimpio}] Se agotaron los ${MAX_INTENTOS_RECONEXION} intentos de reconexión. Eliminando sesión.`
            )
          );
          if (onEstado) {
            onEstado(
              `❌ El subbot @${numeroLimpio} no pudo reconectarse tras ${MAX_INTENTOS_RECONEXION} intentos. Se eliminó su sesión, vincúlalo de nuevo con *subbot ${numeroLimpio}*.`
            );
          }
          limpiarSubbotDeDisco(numeroLimpio, sessionFolder);
          return;
        }

        console.log(
          chalk.yellow(
            `⚠️  [Subbot ${numeroLimpio}] Conexión cerrada, reconectando... (intento ${registro.intentosReconexion}/${MAX_INTENTOS_RECONEXION})`
          )
        );
        iniciarSocketSubbot(numeroLimpio, sessionFolder, registro, { onPairingCode, onEstado }).catch(
          (err) => {
            console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] Error al reconectar:`), err);
            limpiarSubbotDeDisco(numeroLimpio, sessionFolder);
          }
        );
      } else {
        console.log(chalk.red(`⚠️  [Subbot ${numeroLimpio}] Sesión cerrada (logout).`));
        if (onEstado) {
          onEstado(
            `⚠️ El subbot @${numeroLimpio} cerró sesión desde el teléfono. Se eliminó su sesión guardada.`
          );
        }
        limpiarSubbotDeDisco(numeroLimpio, sessionFolder);
      }
    } else if (connection === "open") {
      const esPrimeraConexion = !registro.yaNotificoConexion;
      registro.conectado = true;
      registro.intentosReconexion = 0;
      console.log(chalk.greenBright(`\n👑 [Subbot ${numeroLimpio}] Conectado correctamente.\n`));

      if (esPrimeraConexion) {
        registro.yaNotificoConexion = true;
        if (onEstado) onEstado(`✅ Subbot @${numeroLimpio} conectado y listo para usarse.`);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("group-participants.update", async (update) => {
    const { id: chatId, participants, action } = update;

    try {
      const configGrupo = obtenerConfigGrupo(chatId);
      const metadata = await actualizarCacheGrupo(chatId);
      if (!metadata) return;
      if (!configGrupo.welcome) return;

      const nombreGrupo = metadata.subject;
      const totalMiembros = metadata.participants.length;

      for (const participante of participants) {
        const numero = participante.split("@")[0].split(":")[0];

        let fotoPerfil = null;
        try {
          fotoPerfil = await sock.profilePictureUrl(participante, "image");
        } catch (_) {
          fotoPerfil = "https://i.imgur.com/1Q9ZQ2M.png";
        }

        if (action === "add") {
          const texto =
            `⭐ ¡Bienvenido/a @${numero} a *${nombreGrupo}*!\n` +
            `Esperamos que la pases increíble por aquí. ❀\n\n` +
            `👥 Ahora somos *${totalMiembros}* miembros.`;

          await sock.sendMessage(chatId, {
            image: { url: fotoPerfil },
            caption: texto,
            mentions: [participante],
          });
        } else if (action === "remove") {
          const texto =
            `👋 @${numero} salió de *${nombreGrupo}*. ¡Hasta pronto!\n\n` +
            `👥 Quedamos *${totalMiembros}* miembros.`;

          await sock.sendMessage(chatId, {
            image: { url: fotoPerfil },
            caption: texto,
            mentions: [participante],
          });
        }
      }
    } catch (_) {}
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const contextInteractivo = { chatId, sender, allPlugins: pluginsCompartidos };
    const fueInteractivo = await manejarRespuestaInteractiva(sock, msg, contextInteractivo).catch(
      () => false
    );
    if (fueInteractivo) return;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!body) return;

    const esGrupo = chatId.endsWith("@g.us");
    const contieneLink = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/i.test(body);

    if (esGrupo && contieneLink) {
      const configGrupo = obtenerConfigGrupo(chatId);

      if (configGrupo.antilink) {
        const numeroLimpioSender = sender.split("@")[0].split(":")[0];
        const esDueño = esOwner(numeroLimpioSender);
        let esAdmin = false;

        if (!esDueño) {
          try {
            esAdmin = await esAdminDeGrupo(sock, chatId, sender);
          } catch (_) {}
        }

        if (!esDueño && !esAdmin) {
          try {
            await sock.sendMessage(chatId, { delete: msg.key });
          } catch (_) {}

          await new Promise((r) => setTimeout(r, 800));

          let botAdmin = false;
          try {
            botAdmin = await botEsAdmin(sock, chatId);
          } catch (_) {}

          if (botAdmin) {
            try {
              await sock.groupParticipantsUpdate(chatId, [sender], "remove");
              await sock.sendMessage(chatId, {
                text: `🚫 @${numeroLimpioSender} fue *expulsado* por enviar enlaces no permitidos.`,
                mentions: [sender],
              });
            } catch (err) {
              await sock.sendMessage(chatId, {
                text: `🚫 @${numeroLimpioSender} no se permiten enlaces en este grupo (no pude expulsarlo).`,
                mentions: [sender],
              });
            }
          } else {
            await sock.sendMessage(chatId, {
              text:
                `🚫 @${numeroLimpioSender} no se permiten enlaces en este grupo.\n` +
                `⚠️ Hazme *administrador* para que pueda expulsar automáticamente a quien los envíe.`,
              mentions: [sender],
            });
          }

          return;
        }
      }
    }

    if (esGrupo && (obtenerConfigGrupo(chatId).antiflood || obtenerConfigGrupo(chatId).antispam)) {
      const configGrupo = obtenerConfigGrupo(chatId);
      const numeroLimpioSender = sender.split("@")[0].split(":")[0];
      const esDueño = esOwner(numeroLimpioSender);
      let esAdmin = false;

      if (!esDueño) {
        try {
          esAdmin = await esAdminDeGrupo(sock, chatId, sender);
        } catch (_) {}
      }

      if (!esDueño && !esAdmin) {
        const { esFlood, esSpamRepetido, debeExpulsar } = evaluarMensaje(chatId, sender, body);
        const activoFlood = configGrupo.antiflood && esFlood;
        const activoSpam = configGrupo.antispam && esSpamRepetido;

        if (activoFlood || activoSpam) {
          try {
            await sock.sendMessage(chatId, { delete: msg.key });
          } catch (_) {}

          const motivo = activoFlood ? "mandar demasiados mensajes muy rápido" : "repetir el mismo mensaje varias veces";

          if (debeExpulsar) {
            await new Promise((r) => setTimeout(r, 800));
            let botAdmin = false;
            try {
              botAdmin = await botEsAdmin(sock, chatId);
            } catch (_) {}

            if (botAdmin) {
              try {
                await sock.groupParticipantsUpdate(chatId, [sender], "remove");
                await sock.sendMessage(chatId, {
                  text: `🚫 @${numeroLimpioSender} fue *expulsado* por ${motivo}.`,
                  mentions: [sender],
                });
              } catch (err) {
                await sock.sendMessage(chatId, {
                  text: `⚠️ @${numeroLimpioSender} está ${motivo} (no pude expulsarlo).`,
                  mentions: [sender],
                });
              }
            } else {
              await sock.sendMessage(chatId, {
                text: `⚠️ @${numeroLimpioSender} está ${motivo}. Hazme *administrador* para poder expulsar automáticamente.`,
                mentions: [sender],
              });
            }
          } else {
            await sock.sendMessage(chatId, {
              text: `⚠️ @${numeroLimpioSender}, deja de ${motivo} o serás expulsado.`,
              mentions: [sender],
            });
          }

          return;
        }
      }
    }

    const textoLower = body.trim().toLowerCase();
    const primeraPalabra = textoLower.split(/\s+/)[0];
    const args = body.trim().split(/\s+/).slice(1);

    const context = { sender, chatId, body, allPlugins: pluginsCompartidos };

    const configGrupoActual = esGrupo ? obtenerConfigGrupo(chatId) : null;
    const botApagadoEnGrupo = esGrupo && configGrupoActual && configGrupoActual.activo === false;
    const soloBotPrincipalActivo = esGrupo && configGrupoActual && configGrupoActual.soloPrincipal === true;

    for (const plugin of pluginsCompartidos) {
      if (plugin.command.includes(primeraPalabra)) {
        if (plugin.soloBotPrincipal) continue;
        if (soloBotPrincipalActivo) break;
        if (botApagadoEnGrupo && !plugin.bypassApagado) break;

        try {
          const puedeContinuar = await pasaFiltros(sock, msg, plugin, context);
          if (!puedeContinuar) break;

          await plugin.run(sock, msg, args, context);
        } catch (err) {
          console.log(chalk.red(`❌ [Subbot ${numeroLimpio}] Error en plugin:`), err);
        }
        break;
      }
    }
  });
}
