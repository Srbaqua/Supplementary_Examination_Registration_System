const express = require('express');
const router = express.Router();
const { getSupplementary, registerSupplementary } = require('../controllers/supplementaryController');

router.route('/').get(getSupplementary).post(registerSupplementary);

module.exports = router;
