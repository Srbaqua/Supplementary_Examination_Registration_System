const db = require('../config/db');

// @desc    Get all supplementary registrations
// @route   GET /api/supplementary
exports.getSupplementary = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM supplementary');
    res.json(rows);
  } catch (err) {
    console.error('[getSupplementary]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Register a new supplementary exam using stored procedure
// @route   POST /api/supplementary
exports.registerSupplementary = async (req, res) => {
  const { sup_id, roll_no, txn, code, date } = req.body;
  if (!sup_id || !roll_no || !txn || !code || !date) {
    return res.status(400).json({ message: 'All fields required: sup_id, roll_no, txn, code, date' });
  }
  try {
    await db.query('CALL register_supplementary(?, ?, ?, ?, ?)', [sup_id, roll_no, txn, code, date]);
    res.status(201).json({ message: 'Supplementary registered successfully' });
  } catch (err) {
    console.error('[registerSupplementary]', err.message);
    // Procedure SIGNAL errors (student didn't fail / payment not done)
    if (err.sqlState === '45000') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Already registered for this supplementary exam' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid student, course, or transaction number' });
    }
    res.status(500).json({ message: err.message });
  }
};
