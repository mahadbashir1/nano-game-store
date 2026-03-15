const express = require('express');
const db = require('../db/init');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [games] = await db.query('SELECT * FROM games');
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [games] = await db.query('SELECT * FROM games WHERE game_id = ?', [req.params.id]);
    if (games.length === 0) return res.status(404).json({ message: 'Game not found' });
    res.json(games[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, price, genre, platform, stock_quantity } = req.body;
  try {
    await db.query(
      'INSERT INTO games (title, description, price, genre, platform, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, price, genre, platform, stock_quantity]
    );
    res.status(201).json({ message: 'Game added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, description, price, genre, platform, stock_quantity } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE games SET title = ?, description = ?, price = ?, genre = ?, platform = ?, stock_quantity = ? WHERE game_id = ?',
      [title, description, price, genre, platform, stock_quantity, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Game not found' });
    res.json({ message: 'Game updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM games WHERE game_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
