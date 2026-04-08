const db = require('../config/db');

// @desc    Get all payments
// @route   GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment');
    res.json(rows);
  } catch (err) {
    console.error('[getPayments]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add a new payment using stored procedure
// @route   POST /api/payments
exports.addPayment = async (req, res) => {
  const { txn, roll_no, code, amount, date, status } = req.body;
  if (!txn || !roll_no || !code || !amount || !date || !status) {
    return res.status(400).json({ message: 'All fields required: txn, roll_no, code, amount, date, status' });
  }
  try {
    await db.query('CALL add_payment(?, ?, ?, ?, ?, ?)', [txn, roll_no, code, amount, date, status]);
    res.status(201).json({ message: 'Payment added successfully' });
  } catch (err) {
    console.error('[addPayment]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Transaction number already exists' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Student or Course not found. Add student and course first.' });
    }
    res.status(500).json({ message: err.message });
  }
};
