const express = require('express');
const app = express();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const SECRET_KEY = '23shtr@thebx23';

app.use(express.json());
app.use(cors());

// Add logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.url}`);
  next();
});

const verifyToken = (req, res, next) => {
  let token = req.headers.authorization;
  console.log('Authorization header:', token);
  if (!token) return res.status(401).send('Access denied');
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(400).send('Invalid token');
  }
};

// Login endpoint (unchanged)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).send('User not found');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid password');
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Create a bet (unchanged)
app.post('/bets', verifyToken, async (req, res) => {
  const { description, amount, icon } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bets (description, amount, icon, user_id, yes_price, no_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [description, amount, icon, req.user.id, 50, 50]
    );
    const bet = result.rows[0];
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    bet.username = userResult.rows[0].username;
    await pool.query(
      'UPDATE bets SET odds_history = $1 WHERE id = $2',
      [JSON.stringify([{ timestamp: new Date().toISOString(), yes_price: 50, no_price: 50 }]), bet.id]
    );
    res.status(201).json(bet);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Fetch all bets (exclude user's bets) (unchanged)
app.get('/bets', verifyToken, async (req, res) => {
  try {
    const userBets = await pool.query('SELECT bet_id FROM user_bets WHERE user_id = $1', [req.user.id]);
    const userBetIds = userBets.rows.map((row) => row.bet_id);
    const query = userBetIds.length
      ? 'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id WHERE b.id NOT IN (' + userBetIds.join(',') + ')'
      : 'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Fetch user's bets for CurrentBets tab
app.get('/user_bets', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ub.*, b.description, b.amount, b.icon, b.yes_price, b.no_price, u.username ' +
      'FROM user_bets ub ' +
      'JOIN bets b ON ub.bet_id = b.id ' +
      'JOIN users u ON b.user_id = u.id ' +
      'WHERE ub.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Buy a position on a bet (unchanged)
app.post('/bets/buy', verifyToken, async (req, res) => {
  const { bet_id, position, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO user_bets (user_id, bet_id, position, amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, bet_id, position, amount]
    );
    const userBet = result.rows[0];

    const betResult = await pool.query('SELECT * FROM bets WHERE id = $1', [bet_id]);
    const bet = betResult.rows[0];
    let yesPrice = bet.yes_price;
    let noPrice = bet.no_price;

    if (position === 'Yes') {
      yesPrice = Math.min(99, yesPrice + Math.floor(amount / 100));
      noPrice = 100 - yesPrice;
    } else {
      noPrice = Math.min(99, noPrice + Math.floor(amount / 100));
      yesPrice = 100 - noPrice;
    }

    const newOdds = { timestamp: new Date().toISOString(), yes_price: yesPrice, no_price: noPrice };
    await pool.query(
      'UPDATE bets SET yes_price = $1, no_price = $2, odds_history = odds_history || $3::jsonb WHERE id = $4',
      [yesPrice, noPrice, JSON.stringify(newOdds), bet_id]
    );

    res.status(201).json(userBet);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Fetch comments for a bet (unchanged)
app.get('/bets/:betId/comments', verifyToken, async (req, res) => {
  const { betId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM comments WHERE bet_id = $1 ORDER BY created_at DESC', [betId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Post a comment on a bet (unchanged)
app.post('/bets/:betId/comments', verifyToken, async (req, res) => {
  const { betId } = req.params;
  const { message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (bet_id, user_id, username, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [betId, req.user.id, req.user.username, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => console.log('Server is running on port 3000'));