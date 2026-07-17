import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

const MONTO_MAXIMO = 5000;
const TASA_INTERES = 0.2;
const PLAZO_MS = 24 * 60 * 60 * 1000;
const PENALIZACION = 0.3;

export default {
  command: ["prestamo", "pagarprestamo"],
  category: "Economia",
  requiereRegistro: true,
  description: "Pide un préstamo al banco o págalo. Uso: prestamo <monto> / pagarprestamo",

  run: async (sock, msg, args, context) => {
    const { sender, chatId, body } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const comando = body.trim().split(/\s+/)[0].toLowerCase();
    const usuario = obtenerUsuario(numero);

    if (comando === "pagarprestamo") {
      if (!usuario.prestamo) {
        return await sock.sendMessage(
          chatId,
          { text: "❌ No tienes ningún préstamo activo." },
          { quoted: msg }
        );
      }

      const vencido = Date.now() > usuario.prestamo.fechaLimite;
      const totalAPagar = vencido
        ? Math.floor(usuario.prestamo.monto * (1 + PENALIZACION))
        : usuario.prestamo.monto;

      if (usuario.saldo < totalAPagar) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ Necesitas ${formatearMonto(totalAPagar)} para pagar tu préstamo` +
              (vencido ? " (ya incluye penalización por atraso)." : ".") +
              `\nTienes: ${formatearMonto(usuario.saldo)}`,
          },
          { quoted: msg }
        );
      }

      guardarUsuario(numero, { saldo: usuario.saldo - totalAPagar, prestamo: null });

      return await sock.sendMessage(
        chatId,
        { text: `✅ Pagaste tu préstamo de ${formatearMonto(totalAPagar)}. ¡Ya estás al día!` },
        { quoted: msg }
      );
    }

    if (usuario.prestamo) {
      const horasRestantes = Math.max(0, Math.ceil((usuario.prestamo.fechaLimite - Date.now()) / (60 * 60 * 1000)));
      return await sock.sendMessage(
        chatId,
        {
          text:
            `⚠️ Ya tienes un préstamo activo de ${formatearMonto(usuario.prestamo.monto)}.\n` +
            `⏳ Te quedan ${horasRestantes} hora(s) antes de que se aplique penalización.\n` +
            `Usa *pagarprestamo* para saldarlo.`,
        },
        { quoted: msg }
      );
    }

    const monto = parseInt(args[0], 10);

    if (!monto || monto <= 0) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `🏦 Uso: *prestamo <monto>* (máximo ${formatearMonto(MONTO_MAXIMO)})\n\n` +
            `Interés: ${TASA_INTERES * 100}%\n` +
            `Plazo: 24 horas\n` +
            `Penalización por atraso: ${PENALIZACION * 100}% extra`,
        },
        { quoted: msg }
      );
    }

    if (monto > MONTO_MAXIMO) {
      return await sock.sendMessage(
        chatId,
        { text: `❌ El préstamo máximo es de ${formatearMonto(MONTO_MAXIMO)}.` },
        { quoted: msg }
      );
    }

    const montoAPagar = Math.floor(monto * (1 + TASA_INTERES));

    guardarUsuario(numero, {
      saldo: usuario.saldo + monto,
      prestamo: {
        monto: montoAPagar,
        fechaLimite: Date.now() + PLAZO_MS,
      },
    });

    await sock.sendMessage(
      chatId,
      {
        text:
          `🏦 Te prestamos *${formatearMonto(monto)}*.\n\n` +
          `💵 Debes pagar: *${formatearMonto(montoAPagar)}* (incluye ${TASA_INTERES * 100}% de interés)\n` +
          `⏳ Plazo: 24 horas\n\n` +
          `Usa *pagarprestamo* cuando quieras saldarlo.`,
      },
      { quoted: msg }
    );
  },
};
