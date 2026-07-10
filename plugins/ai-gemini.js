export default {
  cmd: ['ia', 'gemini', 'pregunta'],
  alias: ['ai'],
  category: 'ai',
  desc: 'Pregunta algo a la IA Gemini.',
  async execute({ sock, m, args, text, prefix, command }) {
    if (!text) return await sock.sendMessage(m.chat, { text: `❌ Ejemplo: ${prefix + command} ¿Qué es la IA?` });

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // 🔑 La clave se lee desde .env (NO la subas al repo)
      if (!process.env.GEMINI_API_KEY) throw new Error('API Key no configurada en .env');
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(text);
      const response = result.response.text();

      await sock.sendMessage(m.chat, { text: `🧠 *Gemini:*\n${response}` });
    } catch (e) {
      await sock.sendMessage(m.chat, { text: `⚠️ Error: ${e.message}` });
    }
  }
};