const config = require('../utils/config');

module.exports = {
  name: 'gpt',
  aliases: ['ai', 'ask'],
  description: 'Ask the AI a question',
  async execute(sock, msg, args) {
    const question = args.join(' ').trim();
    const jid = msg.key.remoteJid;

    if (!question) {
      return sock.sendMessage(
        jid,
        { text: `Usage: ${config.prefix}gpt <your question>` },
        { quoted: msg }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return sock.sendMessage(
        jid,
        { text: '⚠️ AI is not configured. Set OPENAI_API_KEY in .env.' },
        { quoted: msg }
      );
    }

    try {
      await sock.sendPresenceUpdate('composing', jid);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are Botify X, a friendly and helpful WhatsApp assistant. Keep responses concise, clear, and well formatted for chat.',
            },
            { role: 'user', content: question },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('[gpt] HTTP', res.status, errBody);
        return sock.sendMessage(
          jid,
          { text: `⚠️ AI error (${res.status}). Try again later.` },
          { quoted: msg }
        );
      }

      const data = await res.json();
      const answer =
        data.choices?.[0]?.message?.content?.trim() ||
        'No response from the AI.';

      await sock.sendMessage(jid, { text: answer }, { quoted: msg });
    } catch (err) {
      console.error('[gpt]', err);
      await sock.sendMessage(
        jid,
        { text: '⚠️ Could not reach the AI service.' },
        { quoted: msg }
      );
    } finally {
      await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }
  },
};
