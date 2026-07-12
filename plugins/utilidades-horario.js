const PAISES = [
  { nombre: "Perú", zona: "America/Lima", bandera: "🇵🇪" },
  { nombre: "México", zona: "America/Mexico_City", bandera: "🇲🇽" },
  { nombre: "Colombia", zona: "America/Bogota", bandera: "🇨🇴" },
  { nombre: "Argentina", zona: "America/Argentina/Buenos_Aires", bandera: "🇦🇷" },
  { nombre: "Chile", zona: "America/Santiago", bandera: "🇨🇱" },
  { nombre: "Venezuela", zona: "America/Caracas", bandera: "🇻🇪" },
  { nombre: "Ecuador", zona: "America/Guayaquil", bandera: "🇪🇨" },
  { nombre: "Bolivia", zona: "America/La_Paz", bandera: "🇧🇴" },
  { nombre: "Paraguay", zona: "America/Asuncion", bandera: "🇵🇾" },
  { nombre: "Uruguay", zona: "America/Montevideo", bandera: "🇺🇾" },
  { nombre: "Brasil", zona: "America/Sao_Paulo", bandera: "🇧🇷" },
  { nombre: "España", zona: "Europe/Madrid", bandera: "🇪🇸" },
  { nombre: "Estados Unidos (Este)", zona: "America/New_York", bandera: "🇺🇸" },
  { nombre: "Estados Unidos (Oeste)", zona: "America/Los_Angeles", bandera: "🇺🇸" },
  { nombre: "Reino Unido", zona: "Europe/London", bandera: "🇬🇧" },
  { nombre: "Francia", zona: "Europe/Paris", bandera: "🇫🇷" },
  { nombre: "Alemania", zona: "Europe/Berlin", bandera: "🇩🇪" },
  { nombre: "Italia", zona: "Europe/Rome", bandera: "🇮🇹" },
  { nombre: "Rusia", zona: "Europe/Moscow", bandera: "🇷🇺" },
  { nombre: "Japón", zona: "Asia/Tokyo", bandera: "🇯🇵" },
  { nombre: "China", zona: "Asia/Shanghai", bandera: "🇨🇳" },
  { nombre: "Corea del Sur", zona: "Asia/Seoul", bandera: "🇰🇷" },
  { nombre: "India", zona: "Asia/Kolkata", bandera: "🇮🇳" },
  { nombre: "Australia", zona: "Australia/Sydney", bandera: "🇦🇺" },
];

function horaEnZona(zona) {
  return new Date().toLocaleString("es-PE", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
  });
}

export default {
  command: ["horario", "hora", "horamundial"],
  category: "Utilidades",
  description: "Ve la hora actual en distintos países.",

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const busqueda = args.join(" ").trim().toLowerCase();

    const lista = busqueda
      ? PAISES.filter((p) => p.nombre.toLowerCase().includes(busqueda))
      : PAISES;

    if (lista.length === 0) {
      await sock.sendMessage(
        chatId,
        { text: `❌ No tengo ese país. Escribe *horario* sin nada para ver la lista completa.` },
        { quoted: msg }
      );
      return;
    }

    let texto = `🌍 *Horario mundial*\n\n`;
    for (const pais of lista) {
      texto += `${pais.bandera} *${pais.nombre}*: ${horaEnZona(pais.zona)}\n`;
    }

    if (!busqueda) {
      texto += `\n_Escribe *horario <país>* para buscar uno en específico._`;
    }

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  },
};
