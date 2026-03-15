const express = require('express');
const db = require('../db/init');

const router = express.Router();

router.get('/:user_id', async (req, res) => {
  try {
    const [cartItems] = await db.query(
      'SELECT c.*, g.title, g.price, g.genre, g.platform, g.game_id AS game_id FROM cart_items c JOIN games g ON c.game_id = g.game_id WHERE c.user_id = ?',
      [req.params.user_id]
    );
    res.json(cartItems.map(item => ({
      ...item,
      game: {
        game_id: item.game_id,
        title: item.title,
        price: item.price,
        genre: item.genre,
        platform: item.platform
      }
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { user_id, game_id, quantity } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND game_id = ?',
      [user_id, game_id]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND game_id = ?',
        [quantity, user_id, game_id]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (user_id, game_id, quantity) VALUES (?, ?, ?)',
        [user_id, game_id, quantity]
      );
    }
    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/', async (req, res) => {
  const { user_id, game_id } = req.body;
  try {
    await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND game_id = ?',
      [user_id, game_id]
    );
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
