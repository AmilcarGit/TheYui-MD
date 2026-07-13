const VENTANA_FLOOD_MS = 7000;
const MAX_MENSAJES_FLOOD = 6;
const MAX_REPETICIONES_SPAM = 4;
const MAX_ADVERTENCIAS_ANTES_KICK = 3;

const historial = new Map();

export function evaluarMensaje(chatId, sender, texto) {
  const key = `${chatId}:${sender}`;
  const ahora = Date.now();
  const registro = historial.get(key) || {
    timestamps: [],
    ultimoTexto: "",
    repeticiones: 0,
    advertencias: 0,
  };

  registro.timestamps = registro.timestamps.filter((t) => ahora - t < VENTANA_FLOOD_MS);
  registro.timestamps.push(ahora);
  const esFlood = registro.timestamps.length > MAX_MENSAJES_FLOOD;

  const textoNormalizado = (texto || "").trim().toLowerCase();
  if (textoNormalizado && textoNormalizado === registro.ultimoTexto) {
    registro.repeticiones += 1;
  } else {
    registro.repeticiones = 1;
    registro.ultimoTexto = textoNormalizado;
  }
  const esSpamRepetido = textoNormalizado.length > 0 && registro.repeticiones >= MAX_REPETICIONES_SPAM;

  let debeExpulsar = false;
  if (esFlood || esSpamRepetido) {
    registro.advertencias += 1;
    registro.timestamps = [];
    registro.repeticiones = 0;
    debeExpulsar = registro.advertencias >= MAX_ADVERTENCIAS_ANTES_KICK;
    if (debeExpulsar) registro.advertencias = 0;
  }

  historial.set(key, registro);

  return { esFlood, esSpamRepetido, debeExpulsar };
}

export function reiniciarUsuario(chatId, sender) {
  historial.delete(`${chatId}:${sender}`);
}
