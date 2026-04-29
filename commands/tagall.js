module.exports = {
  name: 'tagall',
  aliases: ['everyone', 'all'],
  description: 'Mention every member of the group',
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(
        from,
        { text: 'This command works in groups only.' },
        { quoted: msg }
      );
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map((p) => p.id);

      const note = args.join(' ').trim();
      const header = `📢 *Tag All — ${metadata.subject}*`;
      const body = note ? `\n${note}\n` : '\n';
      const list = participants.map((p) => `• @${p.split('@')[0]}`).join('\n');

      await sock.sendMessage(
        from,
        { text: `${header}${body}\n${list}`, mentions: participants },
        { quoted: msg }
      );
    } catch (err) {
      console.error('[tagall]', err);
      await sock.sendMessage(
        from,
        { text: '⚠️ Could not tag members.' },
        { quoted: msg }
      );
    }
  },
};
