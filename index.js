require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const { startBot } = require('./events/connection');
const dashboardRoutes = require('./dashboard/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'botify-x-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.get('/', (req, res) => {
  res.send('Botify X is running');
});

app.use('/', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`[server] Botify X listening on port ${PORT}`);
});

startBot().catch((err) => {
  console.error('[bot] Failed to start:', err);
});
