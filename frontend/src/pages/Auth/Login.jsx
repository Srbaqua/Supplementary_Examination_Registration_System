import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Lock, BookOpen, Layers } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' or 'teacher'
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.id || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (role === 'student') {
      // Students: store roll number and go — validated on the dashboard
      localStorage.setItem('student_roll_no', formData.id);
      localStorage.removeItem('teacher_name');
      navigate('/student');
    } else {
      // Teachers: validate credentials against the database
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/teachers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emp_id: formData.id, password: formData.password })
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.message || 'Invalid credentials');
          return;
        }
        const teacher = await res.json();
        localStorage.setItem('teacher_name', teacher.name);
        localStorage.setItem('teacher_dept', teacher.dept);
        localStorage.removeItem('student_roll_no');
        navigate('/teacher');
      } catch {
        setError('Could not connect to server. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ marginBottom: '1rem' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '1rem', 
              borderRadius: '50%',
              display: 'inline-flex'
            }}>
              <GraduationCap size={40} color="var(--primary)" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p className="text-muted">Sign in to the Examination System</p>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.375rem', borderRadius: '10px' }}>
          <button 
            type="button"
            onClick={() => setRole('student')}
            style={{ 
              flex: 1, 
              padding: '0.625rem', 
              borderRadius: '8px',
              border: 'none',
              background: role === 'student' ? 'var(--card-bg)' : 'transparent',
              color: role === 'student' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: role === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: role === 'student' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <BookOpen size={18} /> Student
          </button>
          <button 
            type="button"
            onClick={() => setRole('teacher')}
            style={{ 
              flex: 1, 
              padding: '0.625rem', 
              borderRadius: '8px',
              border: 'none',
              background: role === 'teacher' ? 'var(--card-bg)' : 'transparent',
              color: role === 'teacher' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: role === 'teacher' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: role === 'teacher' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={18} /> Teacher
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>{role === 'student' ? 'Roll Number' : 'Employee ID'}</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder={role === 'student' ? 'e.g. 10214' : 'e.g. EMP001'}
                style={{ paddingLeft: '2.5rem' }}
                value={formData.id}
                onChange={(e) => {
                  setFormData({...formData, id: e.target.value});
                  setError('');
                }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.password}
                onChange={(e) => {
                  setFormData({...formData, password: e.target.value});
                  setError('');
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Sign In
          </button>
        </form>
        
       
      </div>
    </div>
  );
}
