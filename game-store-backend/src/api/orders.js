const express = require('express');
const db = require('../db/init');

const router = express.Router();

router.get('/:user_id', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM order_summary WHERE user_id = ?', [req.params.user_id]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM order_summary');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { user_id } = req.body;
  try {
    await db.query('CALL place_order(?)', [user_id]);
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.sqlMessage || 'Error placing order' });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const [result] = await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
