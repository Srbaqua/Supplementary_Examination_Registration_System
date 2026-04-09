const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/supplementary', require('./routes/supplementaryRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
