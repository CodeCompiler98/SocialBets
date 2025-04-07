const { Pool } = require('pg');

const pool = new Pool({
    user: 'USER HERE',
    host: 'HOST HERE',
    database: 'DB NAME HERE',
    password: 'PASSWORD HERE',
    port: 'PORT HERE',
  });

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
  release();
});

module.exports = pool;
