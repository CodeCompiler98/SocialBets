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

// LMSR Functions
const LIQUIDITY_PARAM = 350; // Liquidity parameter for LMSR

const calculatePrices = (yesShares, noShares, b = LIQUIDITY_PARAM) => {
  const expYes = Math.exp(yesShares / b);
  const expNo = Math.exp(noShares / b);
  const total = expYes + expNo;
  const yesPrice = (expYes / total) * 100; // Convert to percentage
  const noPrice = (expNo / total) * 100;  // Convert to percentage
  return {
    yes_price: Math.round(Math.max(1, Math.min(99, yesPrice))), // Ensure prices are between 1 and 99
    no_price: Math.round(Math.max(1, Math.min(99, noPrice))),
  };
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
    console.error('Login error:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Create a bet (initialize yes_shares and no_shares)
app.post('/bets', verifyToken, async (req, res) => {
  const { description, icon } = req.body; // Removed amount
  console.log('Received bet creation request:', { description, icon, userId: req.user.id });

  if (!description || !icon) {
    console.error('Missing required fields:', { description, icon });
    return res.status(400).send('Description and icon are required');
  }

  const initialOdds = JSON.stringify([{ timestamp: new Date().toISOString(), yes_price: 50, no_price: 50 }]);
  const currentTimestamp = new Date();

  try {
    console.log('Executing INSERT query with values:', [description, icon, req.user.id, 50, 50, 0, 0, 0, initialOdds, currentTimestamp]);
    const result = await pool.query(
      'INSERT INTO bets (description, icon, user_id, yes_price, no_price, total_volume, yes_shares, no_shares, odds_history, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [description, icon, req.user.id, 50, 50, 0, 0, 0, initialOdds, currentTimestamp]
    );
    const bet = result.rows[0];
    console.log('Bet created successfully:', bet);

    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0]) {
      console.error('User not found for ID:', req.user.id);
      return res.status(404).send('User not found');
    }
    bet.username = userResult.rows[0].username;
    console.log('Fetched username:', bet.username);

    res.status(201).json(bet);
  } catch (err) {
    console.error('Error adding bet:', err.stack);
    res.status(500).send('Server error: ' + (err.message || 'Unknown error'));
  }
});

// Fetch all bets (include yes_shares and no_shares)
app.get('/bets', verifyToken, async (req, res) => {
  try {
    console.log('Fetching bets for user ID:', req.user.id);
    const userBets = await pool.query('SELECT bet_id FROM user_bets WHERE user_id = $1', [req.user.id]);
    const userBetIds = userBets.rows.map((row) => row.bet_id);
    console.log('User bet IDs:', userBetIds);

    const query = userBetIds.length
      ? 'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id WHERE b.id NOT IN (' + userBetIds.join(',') + ')'
      : 'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id';
    console.log('Executing query:', query);
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bets:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Fetch user's bets for CurrentBets tab (include yes_shares and no_shares)
app.get('/user_bets', verifyToken, async (req, res) => {
  try {
    console.log('Fetching user bets for user ID:', req.user.id);
    const result = await pool.query(
      'SELECT ub.*, b.description, b.icon, b.yes_price, b.no_price, b.total_volume, b.yes_shares, b.no_shares, u.username ' +
      'FROM user_bets ub ' +
      'JOIN bets b ON ub.bet_id = b.id ' +
      'JOIN users u ON b.user_id = u.id ' +
      'WHERE ub.user_id = $1',
      [req.user.id]
    );
    console.log('Fetched user bets:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user bets:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Buy a position on a bet (update shares and recalculate prices with LMSR)
app.post('/bets/buy', verifyToken, async (req, res) => {
  const { bet_id, position, amount } = req.body;
  console.log('Received buy request:', { bet_id, position, amount });

  if (!bet_id || !position || !amount) {
    console.error('Missing required fields:', { bet_id, position, amount });
    return res.status(400).send('Bet ID, position, and amount are required');
  }

  try {
    await pool.query('BEGIN');

    // Fetch current bet state
    const betResult = await pool.query('SELECT * FROM bets WHERE id = $1', [bet_id]);
    const bet = betResult.rows[0];
    if (!bet) {
      await pool.query('ROLLBACK');
      console.error('Bet not found for ID:', bet_id);
      return res.status(404).send('Bet not found');
    }
    console.log('Current bet state:', bet);

    // Calculate the number of shares to buy based on the total amount and current price
    const pricePerShare = position === 'Yes' ? bet.yes_price : bet.no_price;
    const sharesToBuy = Math.floor(amount / (pricePerShare / 100)); // Convert price to dollars, then compute shares
    console.log('Calculated shares to buy:', sharesToBuy);

    if (sharesToBuy <= 0) {
      await pool.query('ROLLBACK');
      console.error('Invalid share amount:', sharesToBuy);
      return res.status(400).send('Invalid share amount');
    }

    // Update share counts
    let newYesShares = bet.yes_shares;
    let newNoShares = bet.no_shares;
    if (position === 'Yes') {
      newYesShares += sharesToBuy;
    } else {
      newNoShares += sharesToBuy;
    }
    console.log('New share counts:', { newYesShares, newNoShares });

    // Recalculate prices using LMSR
    const { yes_price, no_price } = calculatePrices(newYesShares, newNoShares);
    console.log('New prices:', { yes_price, no_price });

    // Insert into user_bets (store the number of shares bought)
    const result = await pool.query(
      'INSERT INTO user_bets (user_id, bet_id, position, amount, shares) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, bet_id, position, amount, sharesToBuy]
    );
    const userBet = result.rows[0];
    console.log('Inserted into user_bets:', userBet);

    // Update bets table
    const newOdds = { timestamp: new Date().toISOString(), yes_price, no_price };
    await pool.query(
      'UPDATE bets SET yes_price = $1, no_price = $2, yes_shares = $3, no_shares = $4, total_volume = total_volume + $5, odds_history = odds_history || $6::jsonb WHERE id = $7',
      [yes_price, no_price, newYesShares, newNoShares, amount, JSON.stringify(newOdds), bet_id]
    );
    console.log('Updated bets table with new prices and shares');

    await pool.query('COMMIT');
    res.status(201).json(userBet);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error buying position:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Sell a position on a bet (update shares and recalculate prices with LMSR)
app.post('/bets/sell', verifyToken, async (req, res) => {
  const { bet_id, amount } = req.body;
  console.log('Received sell request:', { bet_id, amount });

  if (!bet_id || !amount) {
    console.error('Missing required fields:', { bet_id, amount });
    return res.status(400).send('Bet ID and amount are required');
  }

  try {
    await pool.query('BEGIN');

    // Fetch user bet and bet state
    const userBetResult = await pool.query(
      'SELECT * FROM user_bets WHERE user_id = $1 AND bet_id = $2 LIMIT 1',
      [req.user.id, bet_id]
    );
    if (userBetResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      console.error('No position found for user ID:', req.user.id, 'and bet ID:', bet_id);
      return res.status(400).send('No position found to sell');
    }
    const userBet = userBetResult.rows[0];
    console.log('User bet:', userBet);

    const betResult = await pool.query('SELECT * FROM bets WHERE id = $1', [bet_id]);
    const bet = betResult.rows[0];
    console.log('Current bet state:', bet);

    // Calculate shares to sell based on the amount
    const pricePerShare = userBet.position === 'Yes' ? bet.yes_price : bet.no_price;
    const sharesToSell = Math.floor(amount / (pricePerShare / 100));
    console.log('Calculated shares to sell:', sharesToSell);

    if (sharesToSell <= 0 || sharesToSell > userBet.shares) {
      await pool.query('ROLLBACK');
      console.error('Invalid share amount to sell:', sharesToSell, 'User shares:', userBet.shares);
      return res.status(400).send('Invalid share amount to sell');
    }

    // Update share counts
    let newYesShares = bet.yes_shares;
    let newNoShares = bet.no_shares;
    if (userBet.position === 'Yes') {
      newYesShares -= sharesToSell;
    } else {
      newNoShares -= sharesToSell;
    }
    console.log('New share counts:', { newYesShares, newNoShares });

    // Recalculate prices using LMSR
    const { yes_price, no_price } = calculatePrices(newYesShares, newNoShares);
    console.log('New prices:', { yes_price, no_price });

    // Update user_bets (reduce shares or delete if fully sold)
    if (userBet.shares === sharesToSell) {
      await pool.query(
        'DELETE FROM user_bets WHERE user_id = $1 AND bet_id = $2',
        [req.user.id, bet_id]
      );
      console.log('Deleted user_bets entry');
    } else {
      await pool.query(
        'UPDATE user_bets SET amount = amount - $1, shares = shares - $2 WHERE user_id = $3 AND bet_id = $4',
        [amount, sharesToSell, req.user.id, bet_id]
      );
      console.log('Updated user_bets with new amount and shares');
    }

    // Update bets table
    const newOdds = { timestamp: new Date().toISOString(), yes_price, no_price };
    await pool.query(
      'UPDATE bets SET yes_price = $1, no_price = $2, yes_shares = $3, no_shares = $4, total_volume = total_volume - $5, odds_history = odds_history || $6::jsonb WHERE id = $7',
      [yes_price, no_price, newYesShares, newNoShares, amount, JSON.stringify(newOdds), bet_id]
    );
    console.log('Updated bets table with new prices and shares');

    await pool.query('COMMIT');
    res.status(200).send('Successfully sold position');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error selling position:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Fetch comments for a bet
app.get('/bets/:betId/comments', verifyToken, async (req, res) => {
  const { betId } = req.params;
  console.log('Fetching comments for bet ID:', betId);
  try {
    const result = await pool.query('SELECT * FROM comments WHERE bet_id = $1 ORDER BY created_at DESC', [betId]);
    console.log('Fetched comments:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Post a comment on a bet
app.post('/bets/:betId/comments', verifyToken, async (req, res) => {
  const { betId } = req.params;
  const { message } = req.body;
  console.log('Posting comment for bet ID:', betId, 'Message:', message);

  if (!message) {
    console.error('Missing message field');
    return res.status(400).send('Message is required');
  }

  try {
    const result = await pool.query(
      'INSERT INTO comments (bet_id, user_id, username, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [betId, req.user.id, req.user.username, message]
    );
    console.log('Inserted comment:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting comment:', err.stack);
    res.status(500).send('Server error: ' + err.message);
  }
});

app.listen(3000, () => console.log('Server is running on port 3000'));