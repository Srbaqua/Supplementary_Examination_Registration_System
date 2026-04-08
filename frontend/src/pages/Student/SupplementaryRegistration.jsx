import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function SupplementaryRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCourse = searchParams.get('course') || '';
  const rollNo = localStorage.getItem('student_roll_no');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    course: initialCourse,
    rollNo: rollNo || '',
    amount: 1000,
    curDate: new Date().toISOString().split('T')[0]
  });

  const [eligibleCourses, setEligibleCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTxn, setGeneratedTxn] = useState(null);
  const [generatedSup, setGeneratedSup] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!rollNo) navigate('/login');
  }, [rollNo, navigate]);

  // Fetch only eligible (failed and not yet registered) courses
  useEffect(() => {
    if (!rollNo) return;
    const load = async () => {
      setCoursesLoading(true);
      try {
        const [gradeRes, suppRes] = await Promise.all([
          fetch(`${API}/grades/${rollNo}`),
          fetch(`${API}/supplementary`)
        ]);

        let alreadyRegistered = new Set();
        if (suppRes.ok) {
          const allSupp = await suppRes.json();
          const mine = allSupp.filter(s => String(s.roll_no) === String(rollNo));
          alreadyRegistered = new Set(mine.map(s => s.course_code));
        }

        if (gradeRes.ok) {
          const grades = await gradeRes.json();
          if (Array.isArray(grades)) {
            setEligibleCourses(grades.filter(g => g.grade_id === 'F' && !alreadyRegistered.has(g.course_code)));
          }
        }
      } catch (err) {
        console.error('Could not load eligible courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    load();
  }, [rollNo]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const txn = Math.floor(Math.random() * 9000000) + 1000000;
      const sup_id = Math.floor(Math.random() * 90000) + 10000;

      // Step 1: Record payment
      const payRes = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn,
          roll_no: parseInt(formData.rollNo),
          code: formData.course,
          amount: formData.amount,
          date: formData.curDate,
          status: 'SUCCESS'
        })
      });
      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.message || 'Payment failed');
      }

      // Step 2: Register supplementary
      const supRes = await fetch(`${API}/supplementary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sup_id,
          roll_no: parseInt(formData.rollNo),
          txn,
          code: formData.course,
          date: formData.curDate
        })
      });
      if (!supRes.ok) {
        const err = await supRes.json();
        throw new Error(err.message || 'Registration failed');
      }

      setGeneratedTxn(`TXN${txn}`);
      setGeneratedSup(sup_id);
      setStep(3);
    } catch (err) {
      alert('Registration failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const stepLabel = (n, label) => (
    <div style={{ fontWeight: 600, color: step >= n ? (n === 3 ? 'var(--success)' : 'var(--primary)') : 'var(--text-muted)' }}>
      {n}. {label}
    </div>
  );

  return (
    <div style={{ maxWidth: 650, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Register for Supplementary</h1>
        <p className="text-muted">Complete the 3-step registration process below.</p>
      </div>

      <div className="glass-panel">
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          {stepLabel(1, 'Course Details')}
          {stepLabel(2, 'Payment')}
          {stepLabel(3, 'Confirmation')}
        </div>

        {/* Step 1: Course Selection */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-2" style={{ marginBottom: '1rem' }}>
              <div className="input-group">
                <label>Student Roll Number</label>
                <input className="input-field" value={formData.rollNo} disabled />
              </div>
              <div className="input-group">
                <label>Exam Date</label>
                <input type="date" className="input-field" value={formData.curDate} disabled />
              </div>
            </div>

            <div className="input-group">
              <label>Select Failed Course</label>
              {coursesLoading ? (
                <p className="text-muted" style={{ padding: '0.75rem 0' }}>Loading eligible courses...</p>
              ) : eligibleCourses.length === 0 ? (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger)', borderRadius: 8, padding: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                  <AlertCircle size={16} />
                  No eligible courses found. You may have already registered for all your failed courses.
                </div>
              ) : (
                <select
                  className="input-field"
                  value={formData.course}
                  onChange={e => setFormData({ ...formData, course: e.target.value })}
                >
                  <option value="">-- Select a course --</option>
                  {eligibleCourses.map((c, i) => (
                    <option key={i} value={c.course_code}>{c.course_code} (Dept: {c.dept})</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/student')}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!formData.course || eligibleCourses.length === 0} onClick={handleNext}>
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2.5rem', margin: 0 }}>₹{formData.amount}</h2>
              <p className="text-muted">Examination Fee for {formData.course}</p>
            </div>

            <div className="input-group">
              <label>Card Number</label>
              <input className="input-field" placeholder="1234 5678 9101 1121" />
            </div>
            <div className="grid grid-cols-2">
              <div className="input-group">
                <label>Expiry</label>
                <input className="input-field" placeholder="MM/YY" />
              </div>
              <div className="input-group">
                <label>CVV</label>
                <input type="password" className="input-field" placeholder="•••" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleBack} disabled={isProcessing}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : <><CreditCard size={16} /> Complete Payment</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle2 size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Registration Successful!</h2>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Your supplementary examination has been recorded in the database.</p>

            <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 8, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>System Record</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span className="text-muted">Supplementary ID</span><br /><strong>{generatedSup}</strong></div>
                <div><span className="text-muted">Transaction No</span><br /><strong>{generatedTxn}</strong></div>
                <div><span className="text-muted">Student Roll No</span><br /><strong>{formData.rollNo}</strong></div>
                <div><span className="text-muted">Course Code</span><br /><strong>{formData.course}</strong></div>
                <div><span className="text-muted">Payment Status</span><br /><span className="badge badge-success">SUCCESS</span></div>
                <div><span className="text-muted">Date</span><br /><strong>{formData.curDate}</strong></div>
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={() => navigate('/student')}>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
