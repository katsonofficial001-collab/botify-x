const express = require('express');
const path = require('path');
const fs = require('fs');

const { verifyUser, isExpired, loadUsers } = require('../utils/access');

const router = express.Router();

function loadView(name) {
  return fs.readFileSync(path.join(__dirname, 'views', `${name}.html`), 'utf8');
}

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] === undefined || vars[k] === null ? '' : String(vars[k])
  );
}

function errorHtml(message) {
  if (!message) return '';
  const escaped = String(message)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div class="err">${escaped}</div>`;
}

router.get('/login', (req, res) => {
  res.send(render(loadView('login'), { error: errorHtml('') }));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = verifyUser(username, password);
  if (!user) {
    return res.send(
      render(loadView('login'), {
        error: errorHtml('Invalid username or password.'),
      })
    );
  }
  if (isExpired(user)) {
    return res.send(
      render(loadView('login'), {
        error: errorHtml('Subscription expired. Contact the owner.'),
      })
    );
  }
  req.session.user = { username: user.username };
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/dashboard', (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const data = loadUsers();
  const user = data.users.find((u) => u.username === req.session.user.username);
  if (!user) {
    req.session.destroy(() => {});
    return res.redirect('/login');
  }
  const expired = isExpired(user);
  const status = expired ? 'Expired' : 'Active';
  const expiresAt = new Date(user.expiresAt).toLocaleString();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(user.expiresAt).getTime() - Date.now()) / 86400000)
  );
  res.send(
    render(loadView('dashboard'), {
      username: user.username,
      status,
      statusClass: expired ? 'expired' : 'active',
      expiresAt,
      daysLeft,
    })
  );
});

module.exports = router;
