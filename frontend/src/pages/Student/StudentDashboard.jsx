import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, User, BookOpen, Mail, Hash, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const rollNo = localStorage.getItem('student_roll_no');

  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [registeredCodes, setRegisteredCodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rollNo) { navigate('/login'); return; }

    const load = async () => {
      try {
        const [profRes, gradeRes, suppRes] = await Promise.all([
          fetch(`${API}/students/${rollNo}`),
          fetch(`${API}/grades/${rollNo}`),
          fetch(`${API}/supplementary`)
        ]);

        if (profRes.status === 404) { setError('Student not found. Please log in again.'); return; }
        if (profRes.ok) setProfile(await profRes.json());
        if (gradeRes.ok) setGrades(await gradeRes.json());

        if (suppRes.ok) {
          const all = await suppRes.json();
          const mine = all.filter(s => String(s.roll_no) === String(rollNo));
          setRegisteredCodes(new Set(mine.map(s => s.course_code)));
        }
      } catch {
        setError('Could not connect to server. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [rollNo, navigate]);

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-muted">Loading your profile...</p>
    </div>
  );

  if (error) return (
    <div className="glass-panel flex-center" style={{ gap: '1rem', padding: '3rem', marginTop: '4rem', flexDirection: 'column', color: 'var(--danger)' }}>
      <AlertCircle size={48} />
      <p>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate('/login')}>Back to Login</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1>Student Portal</h1>
          <p className="text-muted">Manage your supplementary examinations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/student/register')}>
          <PlusCircle size={18} /> Register New
        </button>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(59,130,246,0.15)', padding: '1.25rem', borderRadius: '50%' }}>
            <User size={44} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.4rem 0' }}>{profile.name}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Hash size={14} />{profile.roll_no}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={14} />{profile.branch}</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Semester {profile.sem}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={14} />{profile.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grades & Registration */}
      <h2 style={{ marginBottom: '1rem' }}>Academic Record &amp; Grades</h2>
      {grades.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>No grade records found for your account.</p>
          <p style={{ fontSize: '0.85rem' }}>Grades need to be added by your teacher/admin via Postman.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {grades.map((g, i) => {
            const isF = g.grade_id === 'F';
            const alreadyReg = registeredCodes.has(g.course_code);
            return (
              <div key={i} className="glass-panel" style={{ borderLeft: `4px solid ${isF ? 'var(--danger)' : 'var(--success)'}` }}>
                <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 className="text-muted">{g.course_code}{isF ? ' (Failed)' : ''}</h3>
                  <span className={`badge badge-${isF ? 'danger' : 'success'}`}>Grade: {g.grade_id}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <p><span className="text-muted">Code: </span>{g.course_code}</p>
                  <p><span className="text-muted">Dept: </span>{g.dept}</p>
                  <p><span className="text-muted">Credits: </span>{g.credits}</p>
                </div>
                {isF ? (
                  alreadyReg ? (
                    <button className="btn btn-secondary btn-block" disabled style={{ opacity: 0.75 }}>
                      <CheckCircle size={16} /> Already Registered
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-block" onClick={() => navigate(`/student/register?course=${g.course_code}`)}>
                      Register Supplementary
                    </button>
                  )
                ) : (
                  <button className="btn btn-secondary btn-block" disabled>
                    <CheckCircle size={16} /> Course Passed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
