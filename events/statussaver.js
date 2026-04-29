const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../utils/config');

async function handleStatusReply(sock, msg) {
  const ext = msg.message?.extendedTextMessage;
  if (!ext) return false;

  const ctx = ext.contextInfo;
  if (!ctx?.quotedMessage) return false;

  // A reply to a status carries remoteJid = "status@broadcast"
  if (ctx.remoteJid !== 'status@broadcast') return false;

  const replyText = (ext.text || '').trim();
  if (!replyText) return false;

  const quoted = ctx.quotedMessage;
  const type = Object.keys(quoted)[0];

  const fakeMsg = {
    key: {
      remoteJid: 'status@broadcast',
      id: ctx.stanzaId,
      participant: ctx.participant,
      fromMe: false,
    },
    message: quoted,
  };

  try {
    let payload;
    let buffer;
    let captionText = '';

    if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
      buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
    }

    if (type === 'imageMessage') {
      captionText = quoted.imageMessage.caption || '';
      payload = {
        image: buffer,
        caption: `📌 *Saved Status*${captionText ? `\n\n${captionText}` : ''}`,
      };
    } else if (type === 'videoMessage') {
      captionText = quoted.videoMessage.caption || '';
      payload = {
        video: buffer,
        caption: `📌 *Saved Status*${captionText ? `\n\n${captionText}` : ''}`,
      };
    } else if (type === 'audioMessage') {
      payload = {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: !!quoted.audioMessage.ptt,
      };
    } else if (type === 'conversation' || type === 'extendedTextMessage') {
      const t = quoted.conversation || quoted.extendedTextMessage?.text || '';
      payload = { text: `📌 *Saved Status*\n\n${t}` };
    } else {
      return false;
    }

    await sock.sendMessage(msg.key.remoteJid, payload, { quoted: msg });

    // Forward to owner
    const ownerJid = config.ownerJid();
    if (ownerJid) {
      const sender = ctx.participant || 'unknown';
      const meta = `💾 *Saved status forwarded*\n• Posted by: ${sender}`;

      let ownerPayload;
      if (type === 'imageMessage') ownerPayload = { image: buffer, caption: meta };
      else if (type === 'videoMessage') ownerPayload = { video: buffer, caption: meta };
      else if (type === 'audioMessage')
        ownerPayload = {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: !!quoted.audioMessage.ptt,
        };
      else ownerPayload = { text: `${meta}\n\n${payload.text}` };

      await sock.sendMessage(ownerJid, ownerPayload);
      if (type === 'audioMessage') {
        await sock.sendMessage(ownerJid, { text: meta });
      }
    }

    return true;
  } catch (err) {
    console.error('[statussaver]', err);
    return false;
  }
}

module.exports = { handleStatusReply };
