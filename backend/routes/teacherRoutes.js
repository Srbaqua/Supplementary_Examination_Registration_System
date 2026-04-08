const express = require('express');
const router = express.Router();
const { teacherLogin, getAllTeachers } = require('../controllers/teacherController');

router.get('/', getAllTeachers);
router.post('/login', teacherLogin);

module.exports = router;
