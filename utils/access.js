const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function ensureFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadUsers() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return { users: [] };
  }
}

function saveUsers(data) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function addUser(username, password, days = 30) {
  const data = loadUsers();
  if (data.users.find((u) => u.username === username)) {
    throw new Error('User already exists');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  data.users.push({
    username,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  saveUsers(data);
  return data.users[data.users.length - 1];
}

function removeUser(username) {
  const data = loadUsers();
  const before = data.users.length;
  data.users = data.users.filter((u) => u.username !== username);
  saveUsers(data);
  return before !== data.users.length;
}

function verifyUser(username, password) {
  const data = loadUsers();
  const user = data.users.find((u) => u.username === username);
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return user;
}

function isExpired(user) {
  if (!user || !user.expiresAt) return true;
  return new Date(user.expiresAt).getTime() < Date.now();
}

module.exports = {
  addUser,
  removeUser,
  verifyUser,
  isExpired,
  loadUsers,
  saveUsers,
};
