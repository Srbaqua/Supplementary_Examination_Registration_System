import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileCheck, Coins, Database, DollarSign, Award, FileText, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [payments, setPayments] = useState([]);
  const [supplementaries, setSupplementaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stR, crR, grR, pyR, spR] = await Promise.all([
          fetch(`${API}/students`),
          fetch(`${API}/courses`),
          fetch(`${API}/grades`),
          fetch(`${API}/payments`),
          fetch(`${API}/supplementary`)
        ]);
        if (stR.ok) setStudents(await stR.json());
        if (crR.ok) setCourses(await crR.json());
        if (grR.ok) setGrades(await grR.json());
        if (pyR.ok) setPayments(await pyR.json());
        if (spR.ok) setSupplementaries(await spR.json());
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- Helper lookups ---
  const studentMap = Object.fromEntries(students.map(s => [String(s.roll_no), s]));
  const courseMap  = Object.fromEntries(courses.map(c => [c.code || c.course_code, c]));
  const paymentByTxn = Object.fromEntries(payments.map(p => [String(p.transaction_no), p]));

  // Supplementary enriched rows — fully joined
  const enrichedSupp = supplementaries.map(s => ({
    ...s,
    studentName: studentMap[String(s.roll_no)]?.name || '—',
    branch:      studentMap[String(s.roll_no)]?.branch || '—',
    courseName:  courseMap[s.course_code]?.name || s.course_code,
    payStatus:   paymentByTxn[String(s.transaction_no)]?.payment_status || '—',
    amount:      paymentByTxn[String(s.transaction_no)]?.amount || '—',
  }));

  // Students who have NOT yet registered for their failed courses
  const registeredKeys = new Set(supplementaries.map(s => `${s.roll_no}_${s.course_code}`));
  const pendingStudents = grades
    .filter(g => g.grade_id === 'F' && !registeredKeys.has(`${g.roll_no}_${g.course_code}`))
    .map(g => ({ ...g, studentName: studentMap[String(g.roll_no)]?.name || '—', branch: studentMap[String(g.roll_no)]?.branch || '—' }));

  const totalRevenue = payments.filter(p => p.payment_status === 'SUCCESS').reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const Spinner = () => (
    <div className="glass-panel flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-muted">Loading data...</p>
    </div>
  );

  const Empty = ({ label }) => (
    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No {label} found.</td></tr>
  );

  const tabs = [
    { id: 'overview',        label: 'Overview',        icon: <Database size={16} /> },
    { id: 'registrations',   label: 'Registrations',   icon: <FileText size={16} /> },
    { id: 'pending',         label: `Pending (${pendingStudents.length})`, icon: <AlertTriangle size={16} /> },
    { id: 'students',        label: 'Students',        icon: <Users size={16} /> },
    { id: 'courses',         label: 'Courses',         icon: <BookOpen size={16} /> },
    { id: 'grades',          label: 'Grades',          icon: <Award size={16} /> },
    { id: 'payments',        label: 'Payments',        icon: <DollarSign size={16} /> },
  ];

  const renderContent = () => {
    if (loading) return <Spinner />;

    switch (activeTab) {

      /* ═══ SUPPLEMENTARY REGISTRATIONS (JOINED VIEW) ═══ */
      case 'registrations':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(59,130,246,0.05)' }}>
              <h3 style={{ margin: 0 }}>Supplementary Registrations</h3>
              <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                All students who have registered and paid for a supplementary examination.
              </p>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sup ID</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Branch</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Amount Paid</th>
                    <th>Payment</th>
                    <th>Exam Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedSupp.length === 0
                    ? <Empty label="supplementary registrations" />
                    : enrichedSupp.map((s, i) => (
                        <tr key={i}>
                          <td>#{s.sup_id}</td>
                          <td>{s.roll_no}</td>
                          <td><strong>{s.studentName}</strong></td>
                          <td>{s.branch}</td>
                          <td>{s.course_code}</td>
                          <td>{s.courseName}</td>
                          <td>₹{s.amount}</td>
                          <td>
                            <span className={`badge badge-${s.payStatus === 'SUCCESS' ? 'success' : 'danger'}`}>
                              {s.payStatus}
                            </span>
                          </td>
                          <td>{String(s.date).split('T')[0]}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ PENDING — STUDENTS WHO FAILED BUT NOT YET REGISTERED ═══ */
      case 'pending':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(239,68,68,0.05)' }}>
              <h3 style={{ margin: 0, color: 'var(--danger)' }}>Pending Registrations</h3>
              <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                Students who have a failing grade but have <strong>not yet registered</strong> for the supplementary exam.
              </p>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th><th>Student Name</th><th>Branch</th>
                    <th>Course Code</th><th>Department</th><th>Credits</th><th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--success)' }}>✓ All failed students have registered.</td></tr>
                    : pendingStudents.map((g, i) => (
                        <tr key={i}>
                          <td>{g.roll_no}</td>
                          <td><strong>{g.studentName}</strong></td>
                          <td>{g.branch}</td>
                          <td>{g.course_code}</td>
                          <td>{g.dept}</td>
                          <td>{g.credits}</td>
                          <td><span className="badge badge-danger">{g.grade_id}</span></td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ ALL STUDENTS ═══ */
      case 'students':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Roll No</th><th>Name</th><th>Branch</th><th>Semester</th><th>Email</th><th>Supplementary Exams</th></tr></thead>
                <tbody>
                  {students.length === 0 ? <Empty label="students" /> :
                    students.map((s, i) => {
                      const studentSupps = supplementaries.filter(sp => String(sp.roll_no) === String(s.roll_no));
                      return (
                        <tr key={i}>
                          <td>{s.roll_no}</td>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.branch}</td>
                          <td>Sem {s.sem}</td>
                          <td>{s.email}</td>
                          <td>
                            {studentSupps.length === 0
                              ? <span className="text-muted">None</span>
                              : <span className="badge badge-warning">{studentSupps.length} registered</span>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ COURSES ═══ */
      case 'courses':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Course Code</th><th>Name</th><th>Department</th><th>Credits</th><th>Students Failed</th><th>Supp. Registered</th></tr></thead>
                <tbody>
                  {courses.length === 0 ? <Empty label="courses" /> :
                    courses.map((c, i) => {
                      const code = c.code || c.course_code;
                      const failed = grades.filter(g => g.course_code === code && g.grade_id === 'F').length;
                      const registered = supplementaries.filter(s => s.course_code === code).length;
                      return (
                        <tr key={i}>
                          <td>{code}</td><td>{c.name}</td><td>{c.dept}</td><td>{c.credits}</td>
                          <td>{failed > 0 ? <span className="badge badge-danger">{failed} failed</span> : <span className="text-muted">0</span>}</td>
                          <td>{registered > 0 ? <span className="badge badge-success">{registered} registered</span> : <span className="text-muted">0</span>}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ GRADES ═══ */
      case 'grades':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Roll No</th><th>Student Name</th><th>Course Code</th><th>Department</th><th>Credits</th><th>Grade</th><th>Supp. Status</th></tr></thead>
                <tbody>
                  {grades.length === 0 ? <Empty label="grade records" /> :
                    grades.map((g, i) => {
                      const isRegistered = registeredKeys.has(`${g.roll_no}_${g.course_code}`);
                      return (
                        <tr key={i}>
                          <td>{g.roll_no}</td>
                          <td>{studentMap[String(g.roll_no)]?.name || '—'}</td>
                          <td>{g.course_code}</td>
                          <td>{g.dept}</td>
                          <td>{g.credits}</td>
                          <td><span className={`badge badge-${g.grade_id === 'F' ? 'danger' : 'success'}`}>{g.grade_id}</span></td>
                          <td>
                            {g.grade_id === 'F'
                              ? isRegistered
                                ? <span className="badge badge-success">Registered</span>
                                : <span className="badge badge-danger">Not Registered</span>
                              : <span className="text-muted">N/A</span>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ PAYMENTS ═══ */
      case 'payments':
        return (
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Transaction No</th><th>Roll No</th><th>Student Name</th><th>Course Code</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.length === 0 ? <Empty label="payments" /> :
                    payments.map((p, i) => (
                      <tr key={i}>
                        <td>TXN{p.transaction_no}</td>
                        <td>{p.roll_no}</td>
                        <td>{studentMap[String(p.roll_no)]?.name || '—'}</td>
                        <td>{p.course_code}</td>
                        <td>₹{p.amount}</td>
                        <td>{String(p.date).split('T')[0]}</td>
                        <td><span className={`badge badge-${p.payment_status === 'SUCCESS' ? 'success' : 'danger'}`}>{p.payment_status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      /* ═══ OVERVIEW ═══ */
      default:
        return (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                <Users size={32} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>{students.length}</h2>
                <p className="text-muted">Total Students</p>
              </div>
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                <BookOpen size={32} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>{courses.length}</h2>
                <p className="text-muted">Active Courses</p>
              </div>
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                <FileCheck size={32} color="var(--warning)" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>{supplementaries.length}</h2>
                <p className="text-muted">Supp. Registrations</p>
              </div>
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '2rem 1.5rem' }}>
                <Coins size={32} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>₹{totalRevenue.toLocaleString()}</h2>
                <p className="text-muted">Revenue Collected</p>
              </div>
            </div>

            {/* Alert: Pending Students */}
            {pendingStudents.length > 0 && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 10, padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#facc15' }}>
                <AlertTriangle size={20} />
                <span><strong>{pendingStudents.length}</strong> student(s) with failing grades have not yet registered for the supplementary exam.</span>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setActiveTab('pending')}
                >
                  View →
                </button>
              </div>
            )}

            {/* Recent Registrations joined table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0 }}>Recent Supplementary Registrations</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Sup ID</th><th>Roll No</th><th>Student Name</th><th>Course</th><th>Exam Date</th><th>Payment</th></tr>
                  </thead>
                  <tbody>
                    {enrichedSupp.length === 0
                      ? <Empty label="registrations" />
                      : [...enrichedSupp].reverse().slice(0, 8).map((s, i) => (
                          <tr key={i}>
                            <td>#{s.sup_id}</td>
                            <td>{s.roll_no}</td>
                            <td><strong>{s.studentName}</strong></td>
                            <td>{s.course_code} — {s.courseName}</td>
                            <td>{String(s.date).split('T')[0]}</td>
                            <td>
                              <span className={`badge badge-${s.payStatus === 'SUCCESS' ? 'success' : 'danger'}`}>
                                {s.payStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Teacher Admin Portal</h1>
          <p className="text-muted">
            Welcome, <strong>{localStorage.getItem('teacher_name') || 'Admin'}</strong>
            {localStorage.getItem('teacher_dept') ? ` — Dept. of ${localStorage.getItem('teacher_dept')}` : ''}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => { localStorage.removeItem('teacher_name'); localStorage.removeItem('teacher_dept'); window.location.href = '/login'; }}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          Sign Out
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(15,23,42,0.6)', padding: '0.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1rem', borderRadius: '8px', border: 'none',
              background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
