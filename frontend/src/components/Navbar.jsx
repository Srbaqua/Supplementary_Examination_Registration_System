import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, LayoutDashboard, FileText, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't show navbar on login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const isTeacher = location.pathname.includes('/teacher');

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <div className="brand">
          <GraduationCap size={28} className="text-primary" color="var(--primary)" />
          <span>SuppExamSys</span>
        </div>
        
        <div className="nav-links">
          {isTeacher ? (
            <>
              <NavLink to="/teacher" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/teacher/registrations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={20} /> Registrations
              </NavLink>
              <div style={{width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem'}}></div>
              <button className="nav-link" onClick={handleLogout} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem'}}>
                <LogOut size={20} /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/student" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                <BookOpen size={20} /> My Courses
              </NavLink>
              <NavLink to="/student/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={20} /> Register Supp.
              </NavLink>
              <div style={{width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem'}}></div>
              <button className="nav-link" onClick={handleLogout} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem'}}>
                <LogOut size={20} /> Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
