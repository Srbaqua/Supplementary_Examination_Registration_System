const db = require('../config/db');

// @desc    Get grades for a specific student
// @route   GET /api/grades/:roll_no
exports.getStudentGrades = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grades WHERE roll_no = ?', [req.params.roll_no]);
    res.json(rows);
  } catch (err) {
    console.error('[getStudentGrades]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all grades
// @route   GET /api/grades
exports.getAllGrades = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grades');
    res.json(rows);
  } catch (err) {
    console.error('[getAllGrades]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add a new grade using stored procedure
// @route   POST /api/grades
exports.addGrade = async (req, res) => {
  const { roll_no, code, dept, credits, grade } = req.body;
  if (!roll_no || !code || !dept || !credits || !grade) {
    return res.status(400).json({ message: 'All fields required: roll_no, code, dept, credits, grade' });
  }
  try {
    await db.query('CALL add_grade(?, ?, ?, ?, ?)', [roll_no, code, dept, credits, grade]);
    res.status(201).json({ message: 'Grade added successfully' });
  } catch (err) {
    console.error('[addGrade]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Grade for this student and course already exists' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Student or Course not found. Add student and course first.' });
    }
    res.status(500).json({ message: err.message });
  }
};
