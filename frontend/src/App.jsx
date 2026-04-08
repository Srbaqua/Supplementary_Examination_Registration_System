import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Auth/Login';
import StudentDashboard from './pages/Student/StudentDashboard';
import SupplementaryRegistration from './pages/Student/SupplementaryRegistration';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="page-wrapper container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/register" element={<SupplementaryRegistration />} />
            <Route path="/teacher/*" element={<TeacherDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
