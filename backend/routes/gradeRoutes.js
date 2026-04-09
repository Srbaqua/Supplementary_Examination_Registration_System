const express = require('express');
const router = express.Router();
const { getStudentGrades, addGrade, getAllGrades } = require('../controllers/gradeController');

router.route('/:roll_no').get(getStudentGrades);
router.route('/').get(getAllGrades).post(addGrade);

module.exports = router;
