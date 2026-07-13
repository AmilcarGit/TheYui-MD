import baileysPkg from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import readline from "readline";
import pino from "pino";
import chalk from "chalk";
import fs from "fs";

import { config } from "./config.js";
import { loadPlugins } from "./pluginLoader.js";
import { pasaFiltros, esAdminDeGrupo, botEsAdmin, esOwner } from "./middlewares.js";
import { evaluarMensaje } from "./spamGuard.js";
import { manejarRespuestaInteractiva } from "./interactiveManager.js";
import { obtenerConfigGrupo } from "./groupSettings.js";
import * as subbotManager from "./subbotManager.js";
import { iniciarLimpiezaAutomatica } from "./limpieza.js";

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = baileysPkg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) =>
  new Promise((resolve) => rl.question(text, resolve));

process.on("uncaughtException", (err) => {
  console.log(chalk.red("❌ Error no controlado (uncaughtException):"), err);
});

process.on("unhandledRejection", (err) => {
  console.log(chalk.red("❌ Promesa rechazada sin manejar (unhandledRejection):"), err);
});

let plugins = [];
const groupMetadataCache = new Map();

async function enviarConReintento(sock, chatId, content, opciones = {}, intentos = 2) {
  for (let i = 0; i <= intentos; i++) {
    try {
      return await sock.sendMessage(chatId, content, opciones);
    } catch (err) {
      if (i === intentos) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function startBot() {
  console.log(
    chalk.magentaBright(`
🌸━━━━━━━━━━━━━━━━━━━━━━━━━━━🌸
        🦋 ${config.botName.toUpperCase()} 🦋
     Creado por ${config.creator} · v${process.env.npm_package_version || "1.0.0"}
🌸━━━━━━━━━━━━━━━━━━━━━━━━━━━🌸
`)
  );

  plugins = await loadPlugins();
  subbotManager.setPlugins(plugins);

  subbotManager
    .reconectarSubbotsGuardados((texto) => {
      console.log(chalk.cyan(texto));
    })
    .catch((err) => {
      console.log(chalk.red("❌ Error reconectando subbots guardados:"), err);
    });

  iniciarLimpiezaAutomatica(30 * 60 * 1000, ({ archivosEliminados, bytesLiberados }) => {
    if (archivosEliminados > 0) {
      console.log(
        chalk.magenta(
          `🧹 Limpieza automática: ${archivosEliminados} archivo(s) temporal(es) eliminado(s).`
        )
      );
    }
  });

  const { state, saveCreds } = await useMultiFileAuthState(
    config.sessionFolder
  );
  const { version } = await fetchLatestBaileysVersion();

  const usePairingCode = !fs.existsSync(
    `${config.sessionFolder}/creds.json`
  );

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: !usePairingCode ? true : false,
    browser: Browsers.ubuntu("Chrome"),
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 90000,
    keepAliveIntervalMs: 25000,
    cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
  });

  async function actualizarCacheGrupo(chatId) {
    try {
      const metadata = await sock.groupMetadata(chatId);
      groupMetadataCache.set(chatId, metadata);
      return metadata;
    } catch (err) {
      const statusCode = err?.output?.statusCode;
      if (statusCode === 403) {
        console.log(
          chalk.yellow(
            `⚠️  No se pudo leer info del grupo ${chatId} (403, probablemente el bot ya no está ahí).`
          )
        );
      } else {
        console.log(chalk.red("❌ Error actualizando caché del grupo:"), err);
      }
      return null;
    }
  }

  sock.ev.on("groups.update", async ([event]) => {
    if (event?.id) await actualizarCacheGrupo(event.id);
  });

  sock.contacts = {};

  sock.ev.on("contacts.upsert", (contactos) => {
    for (const contacto of contactos) {
      sock.contacts[contacto.id] = contacto;
    }
  });

  sock.ev.on("contacts.update", (actualizaciones) => {
    for (const act of actualizaciones) {
      if (sock.contacts[act.id]) {
        Object.assign(sock.contacts[act.id], act);
      } else {
        sock.contacts[act.id] = act;
      }
    }
  });

  const enviarOriginal = sock.sendMessage.bind(sock);
  sock.sendMessage = (jid, content, options = {}) => {
    const newsletterContext = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.newsletterJid,
        newsletterName: config.botName,
        serverMessageId: 143,
      },
    };

    const contentConContexto = {
      ...content,
      contextInfo: {
        ...(content?.contextInfo || {}),
        ...newsletterContext,
      },
    };

    return enviarOriginal(jid, contentConContexto, options);
  };

  if (usePairingCode) {
    const metodo = await question(
      chalk.yellow(
        "\n¿Cómo quieres vincular a TheYui-MD?\n1) Código de 8 dígitos\n2) Código QR\nElige 1 o 2: "
      )
    );

    if (metodo.trim() === "1") {
      const numero = await question(
        chalk.yellow(
          "\nEscribe tu número de WhatsApp con código de país (sin + ni espacios). Ej: 51910227479\nNúmero: "
        )
      );

      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(numero.trim());
          console.log(
            chalk.greenBright(
              `\n✅ Tu código de vinculación es: `
            ) + chalk.bold.white(code)
          );
          console.log(
            chalk.gray(
              "Ve a WhatsApp > Dispositivos vinculados > Vincular con número de teléfono, e ingresa el código.\n"
            )
          );
        } catch (err) {
          console.log(chalk.red("❌ Error solicitando el código de vinculación:"), err);
        }
      }, 3000);
    } else {
      console.log(
        chalk.yellow(
          "\nEscanea el código QR que aparecerá arriba con WhatsApp > Dispositivos vinculados.\n"
        )
      );
    }
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        chalk.red(
          `⚠️  Conexión cerrada. ${
            shouldReconnect ? "Reconectando..." : "Sesión cerrada, borra la carpeta 'session' para reiniciar."
          }`
        )
      );

      if (shouldReconnect) {
        startBot().catch((err) => {
          console.log(chalk.red("❌ Error al reconectar, reintentando en 5s:"), err);
          setTimeout(() => startBot().catch(() => {}), 5000);
        });
      }
    } else if (connection === "open") {
      console.log(
        chalk.greenBright(
          `\n✅ ${config.botName} conectada y lista para trabajar 💕\n`
        )
      );

      (async () => {
        try {
          const todosLosGrupos = await sock.groupFetchAllParticipating();
          for (const chatId of Object.keys(todosLosGrupos)) {
            groupMetadataCache.set(chatId, todosLosGrupos[chatId]);
          }
          console.log(
            chalk.magenta(
              `📦 ${Object.keys(todosLosGrupos).length} grupo(s) en caché.`
            )
          );
        } catch (err) {
          console.log(chalk.red("❌ Error precargando grupos:"), err);
        }
      })();
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

        try {
          if (action === "add") {
            const texto =
              `⭐ ¡Bienvenido/a @${numero} a *${nombreGrupo}*!\n` +
              `Esperamos que la pases increíble por aquí. ❀\n\n` +
              `👥 Ahora somos *${totalMiembros}* miembros.`;

            await enviarConReintento(sock, chatId, {
              image: { url: fotoPerfil },
              caption: texto,
              mentions: [participante],
            });
          } else if (action === "remove") {
            const texto =
              `👋 @${numero} salió de *${nombreGrupo}*. ¡Hasta pronto!\n\n` +
              `👥 Quedamos *${totalMiembros}* miembros.`;

            await enviarConReintento(sock, chatId, {
              image: { url: fotoPerfil },
              caption: texto,
              mentions: [participante],
            });
          }
        } catch (errEnvio) {
          console.log(
            chalk.yellow(
              `⚠️  No se pudo enviar bienvenida/despedida en ${chatId} (posible internet lento).`
            )
          );
        }
      }
    } catch (err) {
      console.log(chalk.red("❌ Error en bienvenida/despedida:"), err);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const contextInteractivo = { chatId, sender, allPlugins: plugins };
    const fueInteractivo = await manejarRespuestaInteractiva(sock, msg, contextInteractivo).catch(
      (err) => {
        console.log(chalk.red("❌ Error manejando respuesta interactiva:"), err);
        return false;
      }
    );
    if (fueInteractivo) return;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!body) return;

    const numeroLimpio = sender.split("@")[0];
    console.log(chalk.blueBright(`📩 ${numeroLimpio}: `) + body);

    const esGrupo = chatId.endsWith("@g.us");
    const contieneLink = /chat\.whatsapp\.com\/[a-zA-Z0-9]+/i.test(body);

    if (esGrupo && contieneLink) {
      const configGrupo = obtenerConfigGrupo(chatId);

      if (configGrupo.antilink) {
        const numeroBase = numeroLimpio.split(":")[0];
        const esDueño = esOwner(numeroBase);
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
              await enviarConReintento(sock, chatId, {
                text: `🚫 @${numeroBase} fue *expulsado* por enviar enlaces no permitidos.`,
                mentions: [sender],
              });
            } catch (err) {
              console.log(chalk.red(`❌ No se pudo expulsar a ${numeroBase} por antilink:`), err);
              await enviarConReintento(sock, chatId, {
                text: `🚫 @${numeroBase} no se permiten enlaces en este grupo (no pude expulsarlo).`,
                mentions: [sender],
              });
            }
          } else {
            await enviarConReintento(sock, chatId, {
              text:
                `🚫 @${numeroBase} no se permiten enlaces en este grupo.\n` +
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
      const numeroBase = numeroLimpio.split(":")[0];
      const esDueño = esOwner(numeroBase);
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
                await enviarConReintento(sock, chatId, {
                  text: `🚫 @${numeroBase} fue *expulsado* por ${motivo}.`,
                  mentions: [sender],
                });
              } catch (err) {
                await enviarConReintento(sock, chatId, {
                  text: `⚠️ @${numeroBase} está ${motivo} (no pude expulsarlo).`,
                  mentions: [sender],
                });
              }
            } else {
              await enviarConReintento(sock, chatId, {
                text: `⚠️ @${numeroBase} está ${motivo}. Hazme *administrador* para poder expulsar automáticamente.`,
                mentions: [sender],
              });
            }
          } else {
            await enviarConReintento(sock, chatId, {
              text: `⚠️ @${numeroBase}, deja de ${motivo} o serás expulsado.`,
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

    const context = { sender, chatId, body, allPlugins: plugins };

    const configGrupoActual = esGrupo ? obtenerConfigGrupo(chatId) : null;
    const botApagadoEnGrupo =
      esGrupo && configGrupoActual && configGrupoActual.activo === false;

    for (const plugin of plugins) {
      if (plugin.command.includes(primeraPalabra)) {
        if (botApagadoEnGrupo && !plugin.bypassApagado) {
          break;
        }

        try {
          const puedeContinuar = await pasaFiltros(sock, msg, plugin, context);
          if (!puedeContinuar) break;

          await plugin.run(sock, msg, args, context);
        } catch (err) {
          console.log(
            chalk.red(`❌ Error ejecutando el plugin ${plugin.fileName}:`),
            err
          );
        }
        break;
      }
    }
  });
}

startBot().catch((err) => {
  console.log(chalk.red("❌ Error al iniciar el bot:"), err);
});
