import { obtenerUsuario, guardarUsuario, formatearMonto } from "../economyDB.js";

const SIMBOLOS = ["🍒", "🍋", "🍇", "🔔", "💎", "7️⃣"];
const PREMIOS = { "🍒": 2, "🍋": 2.5, "🍇": 3, "🔔": 4, "💎": 6, "7️⃣": 10 };
const APUESTA_MINIMA = 20;

function girarSlot() {
  return [0, 0, 0].map(() => SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)]);
}

export default {
  command: ["tragamonedas", "slots", "ruleta"],
  category: "Economia",
  description: "Juega tragamonedas o ruleta apostando Yui.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId, body } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const comando = body.trim().split(/\s+/)[0].toLowerCase();
    const usuario = obtenerUsuario(numero);

    if (comando === "tragamonedas" || comando === "slots") {
      const apuesta = parseInt(args[0], 10);

      if (!apuesta || apuesta < APUESTA_MINIMA) {
        return await sock.sendMessage(
          chatId,
          { text: `🎰 Uso: *tragamonedas <monto>* (mínimo ${formatearMonto(APUESTA_MINIMA)})` },
          { quoted: msg }
        );
      }

      if (usuario.saldo < apuesta) {
        return await sock.sendMessage(
          chatId,
          { text: `❌ No tienes suficiente saldo. Tienes ${formatearMonto(usuario.saldo)}.` },
          { quoted: msg }
        );
      }

      const resultado = girarSlot();
      const [a, b, c] = resultado;
      let ganancia = 0;

      if (a === b && b === c) {
        ganancia = Math.floor(apuesta * PREMIOS[a]);
      } else if (a === b || b === c || a === c) {
        ganancia = Math.floor(apuesta * 1.3);
      }

      const nuevoSaldo = usuario.saldo - apuesta + ganancia;
      guardarUsuario(numero, { saldo: nuevoSaldo });

      const texto =
        `🎰 ┃ ${resultado.join(" ┃ ")} ┃\n\n` +
        (ganancia > 0
          ? `🎉 ¡Ganaste ${formatearMonto(ganancia)}!`
          : `💸 Perdiste ${formatearMonto(apuesta)}, suerte para la próxima.`) +
        `\n\n💰 Saldo actual: ${formatearMonto(nuevoSaldo)}`;

      return await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
    }

    if (comando === "ruleta") {
      const apuesta = parseInt(args[0], 10);
      const color = args[1]?.toLowerCase();

      if (!apuesta || apuesta < APUESTA_MINIMA || !["rojo", "negro", "verde"].includes(color)) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `🎡 Uso: *ruleta <monto> <rojo/negro/verde>*\n` +
              `Ejemplo: *ruleta 100 rojo*\n\n` +
              `🔴 Rojo/Negro paga x2 · 🟢 Verde paga x8 (más difícil)`,
          },
          { quoted: msg }
        );
      }

      if (usuario.saldo < apuesta) {
        return await sock.sendMessage(
          chatId,
          { text: `❌ No tienes suficiente saldo. Tienes ${formatearMonto(usuario.saldo)}.` },
          { quoted: msg }
        );
      }

      const numeroGanador = Math.floor(Math.random() * 37);
      let colorGanador = "verde";
      if (numeroGanador !== 0) {
        colorGanador = numeroGanador % 2 === 0 ? "negro" : "rojo";
      }

      const gano = color === colorGanador;
      const multiplicador = colorGanador === "verde" ? 8 : 2;
      const ganancia = gano ? apuesta * multiplicador : 0;
      const nuevoSaldo = usuario.saldo - apuesta + ganancia;

      guardarUsuario(numero, { saldo: nuevoSaldo });

      const emojiColor = { rojo: "🔴", negro: "⚫", verde: "🟢" };

      const texto =
        `🎡 La bola cayó en *${numeroGanador}* ${emojiColor[colorGanador]}\n\n` +
        (gano
          ? `🎉 ¡Acertaste! Ganaste ${formatearMonto(ganancia)}`
          : `💸 Perdiste ${formatearMonto(apuesta)}, suerte para la próxima.`) +
        `\n\n💰 Saldo actual: ${formatearMonto(nuevoSaldo)}`;

      return await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
    }
  },
};
