const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'betting_cards',
    password: 'Card23Bets24!6', // Replace with your PostgreSQL password
    port: 5432,
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