const db = require('../config/db');

// @desc  Teacher login
// @route POST /api/teachers/login
exports.teacherLogin = async (req, res) => {
  const { emp_id, password } = req.body;
  if (!emp_id || !password) {
    return res.status(400).json({ message: 'emp_id and password required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT emp_id, name, dept, email FROM teacher WHERE emp_id = ? AND password = ?',
      [emp_id, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid Employee ID or password' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[teacherLogin]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all teachers
// @route GET /api/teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT emp_id, name, dept, email FROM teacher');
    res.json(rows);
  } catch (err) {
    console.error('[getAllTeachers]', err.message);
    res.status(500).json({ message: err.message });
  }
};
