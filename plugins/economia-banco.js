import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

export default {
  command: ["depositar", "retirar"],
  category: "Economia",
  requiereRegistro: true,
  description: "Deposita o retira Yui del banco. Uso: depositar <monto> / retirar <monto>",

  run: async (sock, msg, args, context) => {
    const { sender, chatId, body } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const accion = body.trim().split(/\s+/)[0].toLowerCase();

    const usuario = obtenerUsuario(numero);
    const montoTexto = args[0];
    const esTodo = montoTexto?.toLowerCase() === "todo";

    if (accion === "depositar") {
      const monto = esTodo ? usuario.saldo : parseInt(montoTexto, 10);

      if (!monto || monto <= 0) {
        return await sock.sendMessage(
          chatId,
          { text: "💵 Uso: *depositar <monto>* o *depositar todo*" },
          { quoted: msg }
        );
      }

      if (usuario.saldo < monto) {
        return await sock.sendMessage(
          chatId,
          { text: `❌ No tienes suficiente efectivo. Disponible: ${formatearMonto(usuario.saldo)}` },
          { quoted: msg }
        );
      }

      guardarUsuario(numero, {
        saldo: usuario.saldo - monto,
        banco: usuario.banco + monto,
      });

      return await sock.sendMessage(
        chatId,
        { text: `🏦 Depositaste ${formatearMonto(monto)} en el banco.` },
        { quoted: msg }
      );
    }

    if (accion === "retirar") {
      const monto = esTodo ? usuario.banco : parseInt(montoTexto, 10);

      if (!monto || monto <= 0) {
        return await sock.sendMessage(
          chatId,
          { text: "💵 Uso: *retirar <monto>* o *retirar todo*" },
          { quoted: msg }
        );
      }

      if (usuario.banco < monto) {
        return await sock.sendMessage(
          chatId,
          { text: `❌ No tienes suficiente en el banco. Disponible: ${formatearMonto(usuario.banco)}` },
          { quoted: msg }
        );
      }

      guardarUsuario(numero, {
        saldo: usuario.saldo + monto,
        banco: usuario.banco - monto,
      });

      return await sock.sendMessage(
        chatId,
        { text: `💰 Retiraste ${formatearMonto(monto)} del banco.` },
        { quoted: msg }
      );
    }
  },
};
