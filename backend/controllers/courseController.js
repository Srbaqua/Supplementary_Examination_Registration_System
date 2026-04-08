const db = require('../config/db');

// @desc    Get all courses
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses');
    res.json(rows);
  } catch (err) {
    console.error('[getCourses]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add a new course using stored procedure
// @route   POST /api/courses
exports.addCourse = async (req, res) => {
  const { code, name, dept, credits } = req.body;
  if (!code || !name || !dept || !credits) {
    return res.status(400).json({ message: 'All fields required: code, name, dept, credits' });
  }
  try {
    await db.query('CALL add_course(?, ?, ?, ?)', [code, name, dept, credits]);
    res.status(201).json({ message: 'Course added successfully' });
  } catch (err) {
    console.error('[addCourse]', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};
