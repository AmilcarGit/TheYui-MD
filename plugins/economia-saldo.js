import { obtenerUsuario, formatearMonto } from "../economyDB.js";

export default {
  command: ["saldo", "balance", "bal"],
  category: "Economia",
  requiereRegistro: true,
  description: "Muestra tu saldo en efectivo y en el banco.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];

    const usuario = obtenerUsuario(numero);
    const total = usuario.saldo + usuario.banco;

    let texto = `╭─「 💵 *BILLETERA* 」\n`;
    texto += `│ 👤 @${numero}\n`;
    texto += `│ 💰 Efectivo: ${formatearMonto(usuario.saldo)}\n`;
    texto += `│ 🏦 Banco: ${formatearMonto(usuario.banco)}\n`;
    texto += `│ 💎 Total: ${formatearMonto(total)}\n`;
    texto += `╰────────────────`;

    await sock.sendMessage(
      chatId,
      { text: texto, mentions: [sender] },
      { quoted: msg }
    );
  },
};
