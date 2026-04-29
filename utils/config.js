module.exports = {
  name: 'Botify X',
  version: 'v1.0.0',
  prefix: process.env.PREFIX || '*',
  ownerNumber: process.env.OWNER_NUMBER || '',
  ownerJid() {
    const num = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    return num ? `${num}@s.whatsapp.net` : null;
  },
};
