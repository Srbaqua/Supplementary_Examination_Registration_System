const express = require('express');
const router = express.Router();
const { getStudent, addStudent, getAllStudents } = require('../controllers/studentController');

router.route('/:roll_no').get(getStudent);
router.route('/').get(getAllStudents).post(addStudent);

module.exports = router;
