'use strict';

require('dotenv').config();

const app = require('./app');
const { seedIfEmpty } = require('./seed');

const PORT = process.env.PORT || 3000;

seedIfEmpty();

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║         ustoz.uz API — v1.0.0          ║
  ║  Site:  http://localhost:${PORT}             ║
  ║  DB:    SQLite (data/ustoz.db)         ║
  ╠══════════════════════════════════════════╣
  ║  POST /api/applications/student         ║
  ║  POST /api/applications/tutor           ║
  ║  GET  /api/tutors  POST /api/tutors/match║
  ║  POST /api/auth/register|login          ║
  ║  POST /api/bookings          [auth]     ║
  ╚══════════════════════════════════════════╝
  `);
});
