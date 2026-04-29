const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'poststatus',
  aliases: ['repost', 'tostatus'],
  description: 'Reply to a media/text message and repost it as the bot status',
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(
        from,
        {
          text: 'Reply to a message (text or media) with this command to repost it as a status.',
        },
        { quoted: msg }
      );
    }

    const type = Object.keys(quoted)[0];
    const fakeMsg = {
      key: {
        remoteJid: from,
        id: ctx.stanzaId,
        participant: ctx.participant,
        fromMe: false,
      },
      message: quoted,
    };

    try {
      const statusJid = 'status@broadcast';
      let payload;

      if (type === 'imageMessage') {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        payload = { image: buffer, caption: quoted.imageMessage.caption || '' };
      } else if (type === 'videoMessage') {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        payload = { video: buffer, caption: quoted.videoMessage.caption || '' };
      } else if (type === 'audioMessage') {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        payload = {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: !!quoted.audioMessage.ptt,
        };
      } else if (type === 'conversation' || type === 'extendedTextMessage') {
        const text =
          quoted.conversation || quoted.extendedTextMessage?.text || '';
        if (!text.trim()) {
          return sock.sendMessage(
            from,
            { text: 'Cannot post empty text to status.' },
            { quoted: msg }
          );
        }
        payload = { text };
      } else {
        return sock.sendMessage(
          from,
          { text: 'Unsupported message type for status.' },
          { quoted: msg }
        );
      }

      await sock.sendMessage(statusJid, payload);
      await sock.sendMessage(
        from,
        { text: '✓ Reposted to status.' },
        { quoted: msg }
      );
    } catch (err) {
      console.error('[poststatus]', err);
      await sock.sendMessage(
        from,
        { text: '⚠️ Failed to post to status.' },
        { quoted: msg }
      );
    }
  },
};
