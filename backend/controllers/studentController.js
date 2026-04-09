const db = require('../config/db');

// @desc    Get student by roll number
// @route   GET /api/students/:roll_no
exports.getStudent = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM student WHERE roll_no = ?', [req.params.roll_no]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[getStudent]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all students
// @route   GET /api/students
exports.getAllStudents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM student');
    res.json(rows);
  } catch (err) {
    console.error('[getAllStudents]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add a new student using stored procedure
// @route   POST /api/students
exports.addStudent = async (req, res) => {
  const { roll_no, name, branch, sem, email } = req.body;
  if (!roll_no || !name || !branch || !sem || !email) {
    return res.status(400).json({ message: 'All fields required: roll_no, name, branch, sem, email' });
  }
  try {
    await db.query('CALL add_student(?, ?, ?, ?, ?)', [roll_no, name, branch, sem, email]);
    res.status(201).json({ message: 'Student added successfully' });
  } catch (err) {
    console.error('[addStudent]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};
