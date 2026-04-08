const express = require('express');
const router = express.Router();
const { getPayments, addPayment } = require('../controllers/paymentController');

router.route('/').get(getPayments).post(addPayment);

module.exports = router;
