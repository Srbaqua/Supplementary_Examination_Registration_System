const express = require('express');
const router = express.Router();
const { getCourses, addCourse } = require('../controllers/courseController');

router.route('/').get(getCourses).post(addCourse);

module.exports = router;
