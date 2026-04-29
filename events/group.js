const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/i;

async function isAdmin(sock, groupJid, userJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const me = sock.user?.id?.split(':')[0];
    const found = metadata.participants.find(
      (p) => p.id === userJid || p.id.split('@')[0] === userJid?.split('@')[0]
    );
    return {
      isUserAdmin: !!found?.admin,
      isBotAdmin: !!metadata.participants.find(
        (p) => p.id.split('@')[0] === me
      )?.admin,
      metadata,
    };
  } catch {
    return { isUserAdmin: false, isBotAdmin: false, metadata: null };
  }
}

async function handleAntilink(sock, msg, body) {
  if (!body || !linkRegex.test(body)) return false;
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;

  const { isUserAdmin, isBotAdmin } = await isAdmin(sock, from, sender);
  if (isUserAdmin) return false;

  try {
    if (isBotAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
    }
    await sock.sendMessage(from, {
      text: `🚫 Links are not allowed in this group.\n@${sender.split('@')[0]}, please don't share links here.`,
      mentions: [sender],
    });
    return true;
  } catch (err) {
    console.error('[antilink]', err);
    return false;
  }
}

async function handleAntiStatusMention(sock, msg) {
  const from = msg.key.remoteJid;
  if (!from.endsWith('@g.us')) return false;

  const ctx =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo;

  const looksLikeStatusMention =
    ctx?.remoteJid === 'status@broadcast' ||
    !!ctx?.quotedMessage?.statusMentionMessage;

  if (!looksLikeStatusMention) return false;

  const sender = msg.key.participant || from;
  const { isUserAdmin, isBotAdmin } = await isAdmin(sock, from, sender);
  if (isUserAdmin) return false;

  try {
    if (isBotAdmin) {
      await sock.sendMessage(from, { delete: msg.key });
    }
    await sock.sendMessage(from, {
      text: `🚫 Status mentions are not allowed here.\n@${sender.split('@')[0]}, please avoid forwarding status to the group.`,
      mentions: [sender],
    });
    return true;
  } catch (err) {
    console.error('[anti-status-mention]', err);
    return false;
  }
}

async function handleGroupParticipantsUpdate(sock, { id, participants, action }) {
  let metadata;
  try {
    metadata = await sock.groupMetadata(id);
  } catch {
    metadata = { subject: 'the group' };
  }

  for (const jid of participants) {
    try {
      if (action === 'add') {
        await sock.sendMessage(id, {
          text:
            `👋 Welcome @${jid.split('@')[0]} to *${metadata.subject}*!\n` +
            `Please read the group rules and enjoy your stay.`,
          mentions: [jid],
        });
      } else if (action === 'remove') {
        await sock.sendMessage(id, {
          text: `👋 Goodbye @${jid.split('@')[0]}. We'll miss you!`,
          mentions: [jid],
        });
      }
    } catch (err) {
      console.error('[group event]', err);
    }
  }
}

module.exports = {
  handleAntilink,
  handleAntiStatusMention,
  handleGroupParticipantsUpdate,
};
