const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../utils/config');

function getViewOnce(quoted) {
  if (!quoted) return null;
  return (
    quoted.viewOnceMessage?.message ||
    quoted.viewOnceMessageV2?.message ||
    quoted.viewOnceMessageV2Extension?.message ||
    null
  );
}

async function handleViewOnceReply(sock, msg) {
  const ext = msg.message?.extendedTextMessage;
  if (!ext) return false;

  const ctx = ext.contextInfo;
  if (!ctx?.quotedMessage) return false;

  const viewOnce = getViewOnce(ctx.quotedMessage);
  if (!viewOnce) return false;

  // Any reply text/emoji triggers extraction
  const replyText = (ext.text || '').trim();
  if (!replyText) return false;

  const innerType = Object.keys(viewOnce)[0];
  if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(innerType)) {
    return false;
  }

  const fakeMsg = {
    key: {
      remoteJid: msg.key.remoteJid,
      id: ctx.stanzaId,
      participant: ctx.participant,
      fromMe: false,
    },
    message: { [innerType]: viewOnce[innerType] },
  };

  try {
    const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
    const caption = viewOnce[innerType].caption || '';
    const tag = '🔓 *View-once unlocked*';

    let payload;
    if (innerType === 'imageMessage') {
      payload = { image: buffer, caption: caption ? `${tag}\n\n${caption}` : tag };
    } else if (innerType === 'videoMessage') {
      payload = { video: buffer, caption: caption ? `${tag}\n\n${caption}` : tag };
    } else {
      payload = {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: !!viewOnce[innerType].ptt,
      };
    }

    await sock.sendMessage(msg.key.remoteJid, payload, { quoted: msg });

    // Forward to owner ("message yourself")
    const ownerJid = config.ownerJid();
    if (ownerJid) {
      const sender = ctx.participant || msg.key.remoteJid;
      const meta = `📥 *View-once saved*\n• From: ${msg.key.remoteJid}\n• By: ${sender}`;
      let ownerPayload;
      if (innerType === 'imageMessage') ownerPayload = { image: buffer, caption: meta };
      else if (innerType === 'videoMessage') ownerPayload = { video: buffer, caption: meta };
      else
        ownerPayload = {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: !!viewOnce[innerType].ptt,
        };
      await sock.sendMessage(ownerJid, ownerPayload);
      if (innerType === 'audioMessage') {
        await sock.sendMessage(ownerJid, { text: meta });
      }
    }

    return true;
  } catch (err) {
    console.error('[viewonce]', err);
    return false;
  }
}

module.exports = { handleViewOnceReply };
