require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connected to:', process.env.DB_NAME);

    // ─── TABLES ────────────────────────────────────────────────
    console.log('\nEnsuring tables exist...');
    await conn.query(`CREATE TABLE IF NOT EXISTS teacher (
      emp_id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      dept VARCHAR(45) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(45) NOT NULL
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS student (
      roll_no INT PRIMARY KEY,
      name VARCHAR(45) NOT NULL,
      branch VARCHAR(45) NOT NULL,
      sem VARCHAR(45) NOT NULL,
      email VARCHAR(45) NOT NULL
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS courses (
      code VARCHAR(45) PRIMARY KEY,
      name VARCHAR(45) NOT NULL,
      dept VARCHAR(45) NOT NULL,
      credits VARCHAR(45) NOT NULL
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS grades (
      roll_no INT,
      course_code VARCHAR(45),
      dept VARCHAR(45) NOT NULL,
      credits VARCHAR(45) NOT NULL,
      grade_id VARCHAR(45) NOT NULL,
      PRIMARY KEY (roll_no, course_code),
      FOREIGN KEY (roll_no) REFERENCES student(roll_no),
      FOREIGN KEY (course_code) REFERENCES courses(code)
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS payment (
      transaction_no INT PRIMARY KEY,
      roll_no INT,
      course_code VARCHAR(45),
      amount INT NOT NULL,
      date DATE NOT NULL,
      payment_status VARCHAR(45) NOT NULL,
      FOREIGN KEY (roll_no) REFERENCES student(roll_no),
      FOREIGN KEY (course_code) REFERENCES courses(code)
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS supplementary (
      sup_id INT PRIMARY KEY,
      roll_no INT,
      transaction_no INT,
      course_code VARCHAR(45),
      date DATE NOT NULL,
      FOREIGN KEY (roll_no) REFERENCES student(roll_no),
      FOREIGN KEY (transaction_no) REFERENCES payment(transaction_no),
      FOREIGN KEY (course_code) REFERENCES courses(code)
    )`);
    console.log('  Tables ready.');

    // ─── STORED PROCEDURES ─────────────────────────────────────
    console.log('\nCreating stored procedures...');
    const procs = {
      add_course:  `CREATE PROCEDURE add_course(IN p_code VARCHAR(45), IN p_name VARCHAR(45), IN p_dept VARCHAR(45), IN p_credits VARCHAR(45))
                    BEGIN INSERT INTO courses VALUES (p_code, p_name, p_dept, p_credits); END`,
      add_student: `CREATE PROCEDURE add_student(IN p_roll INT, IN p_name VARCHAR(45), IN p_branch VARCHAR(45), IN p_sem VARCHAR(45), IN p_email VARCHAR(45))
                    BEGIN INSERT INTO student VALUES (p_roll, p_name, p_branch, p_sem, p_email); END`,
      add_grade:   `CREATE PROCEDURE add_grade(IN p_roll INT, IN p_code VARCHAR(45), IN p_dept VARCHAR(45), IN p_credits VARCHAR(45), IN p_grade VARCHAR(45))
                    BEGIN INSERT INTO grades VALUES (p_roll, p_code, p_dept, p_credits, p_grade); END`,
      add_payment: `CREATE PROCEDURE add_payment(IN p_txn INT, IN p_roll INT, IN p_code VARCHAR(45), IN p_amount INT, IN p_date DATE, IN p_status VARCHAR(45))
                    BEGIN INSERT INTO payment VALUES (p_txn, p_roll, p_code, p_amount, p_date, p_status); END`,
      register_supplementary: `CREATE PROCEDURE register_supplementary(IN p_sup INT, IN p_roll INT, IN p_txn INT, IN p_code VARCHAR(45), IN p_date DATE)
                    BEGIN
                      IF NOT EXISTS (SELECT 1 FROM grades WHERE roll_no = p_roll AND course_code = p_code AND grade_id = 'F') THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student did not fail this course';
                      END IF;
                      IF NOT EXISTS (SELECT 1 FROM payment WHERE transaction_no = p_txn AND payment_status = 'SUCCESS') THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not completed';
                      END IF;
                      INSERT INTO supplementary VALUES (p_sup, p_roll, p_txn, p_code, p_date);
                    END`
    };
    for (const [name, sql] of Object.entries(procs)) {
      await conn.query(`DROP PROCEDURE IF EXISTS ${name}`);
      await conn.query(sql);
    }
    console.log('  All procedures created.');

    // ─── TEACHERS ──────────────────────────────────────────────
    console.log('\nSeeding teachers...');
    const teachers = [
      ['EMP001', 'Dr. Rajesh Sharma',   'CSE',  'rajesh.sharma@gmail.com',  'admin123'],
      ['EMP002', 'Prof. Meena Iyer',    'MATH', 'meena.iyer@gmail.com',     'admin123'],
      ['EMP003', 'Dr. Suresh Pillai',   'ECE',  'suresh.pillai@gmail.com',  'admin123'],
      ['EMP004', 'Prof. Anita Desai',   'CSE',  'anita.desai@gmail.com',    'admin123'],
    ];
    for (const [emp_id, name, dept, email, password] of teachers) {
      try {
        await conn.query(
          'INSERT INTO teacher (emp_id, name, dept, email, password) VALUES (?, ?, ?, ?, ?)',
          [emp_id, name, dept, email, password]
        );
        console.log(`  + ${emp_id} – ${name} (${dept})`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ ${emp_id} already exists, skipped.`);
        else throw e;
      }
    }

    // ─── COURSES ───────────────────────────────────────────────
    console.log('\nSeeding courses...');
    const courses = [
      ['CS301', 'Database Management Systems', 'CSE',  '4'],
      ['CS302', 'Operating Systems',           'CSE',  '4'],
      ['CS303', 'Computer Networks',           'CSE',  '3'],
      ['CS304', 'Software Engineering',        'CSE',  '3'],
      ['MA201', 'Engineering Mathematics III', 'MATH', '3'],
      ['MA202', 'Numerical Methods',           'MATH', '3'],
      ['EC201', 'Analog Electronics',          'ECE',  '4'],
      ['EC202', 'Digital Circuits',            'ECE',  '3'],
    ];
    for (const [code, name, dept, credits] of courses) {
      try {
        await conn.query('CALL add_course(?, ?, ?, ?)', [code, name, dept, credits]);
        console.log(`  + ${code} – ${name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ ${code} already exists, skipped.`);
        else throw e;
      }
    }

    // ─── STUDENTS ──────────────────────────────────────────────
    console.log('\nSeeding students...');
    const students = [
      [10201, 'A', 'CSE',  '5', 'a@gmail.com'],
      [10202, 'B', 'CSE',  '5', 'b@gmail.com'],
      [10203, 'C', 'ECE',  '5', 'c@gmail.com'],
      [10204, 'D', 'MATH', '3', 'd@gmail.com'],
      [10205, 'E', 'CSE',  '5', 'e@gmail.com'],
      [10206, 'F', 'CSE',  '5', 'f@gmail.com'],
      [10207, 'G', 'ECE',  '5', 'g@gmail.com'],
      [10208, 'H', 'MATH', '5', 'h@gmail.com'],
      [10209, 'I', 'CSE',  '3', 'i@gmail.com'],
      [10210, 'J', 'ECE',  '3', 'j@gmail.com'],
    ];
    for (const [roll_no, name, branch, sem, email] of students) {
      try {
        await conn.query('CALL add_student(?, ?, ?, ?, ?)', [roll_no, name, branch, sem, email]);
        console.log(`  + ${roll_no} – ${name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ ${roll_no} already exists, skipped.`);
        else throw e;
      }
    }

    // ─── GRADES ────────────────────────────────────────────────
    console.log('\nSeeding grades...');
    const grades = [
      // A (10201) — DBMS fail, OS pass
      [10201, 'CS301', 'CSE',  '4', 'F'],
      [10201, 'CS302', 'CSE',  '4', 'B'],
      // B (10202) — OS fail, Networks fail, DBMS pass
      [10202, 'CS301', 'CSE',  '4', 'A'],
      [10202, 'CS302', 'CSE',  '4', 'F'],
      [10202, 'CS303', 'CSE',  '3', 'F'],
      // C (10203) — Analog fail, Networks pass
      [10203, 'EC201', 'ECE',  '4', 'F'],
      [10203, 'CS303', 'CSE',  '3', 'C'],
      // D (10204) — Maths III fail
      [10204, 'MA201', 'MATH', '3', 'F'],
      [10204, 'MA202', 'MATH', '3', 'C'],
      // E (10205) — all pass
      [10205, 'CS301', 'CSE',  '4', 'A'],
      [10205, 'CS302', 'CSE',  '4', 'B'],
      // F (10206) — Software Eng fail, DBMS fail
      [10206, 'CS301', 'CSE',  '4', 'F'],
      [10206, 'CS304', 'CSE',  '3', 'F'],
      // G (10207) — Digital Circuits fail
      [10207, 'EC202', 'ECE',  '3', 'F'],
      [10207, 'EC201', 'ECE',  '4', 'B'],
      // H (10208) — Numerical Methods fail
      [10208, 'MA202', 'MATH', '3', 'F'],
      // I (10209) — all pass
      [10209, 'CS301', 'CSE',  '4', 'B'],
      [10209, 'CS302', 'CSE',  '4', 'A'],
      // J (10210) — Analog fail, Digital fail
      [10210, 'EC201', 'ECE',  '4', 'F'],
      [10210, 'EC202', 'ECE',  '3', 'F'],
    ];
    for (const [roll_no, code, dept, credits, grade] of grades) {
      try {
        await conn.query('CALL add_grade(?, ?, ?, ?, ?)', [roll_no, code, dept, credits, grade]);
        console.log(`  + Roll ${roll_no} | ${code} → ${grade}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ Grade ${roll_no}/${code} already exists, skipped.`);
        else throw e;
      }
    }

    // ─── PAYMENTS + SUPPLEMENTARY ──────────────────────────────
    // A→CS301 registered | B→CS302 registered | F→CS301 registered, CS304 pending | J→EC201 registered
    console.log('\nSeeding payments + supplementary registrations...');
    const registrations = [
      [1001001, 10201, 'CS301', 1000, '2026-04-01', 50001],
      [1001002, 10202, 'CS302', 1000, '2026-04-01', 50002],
      [1001003, 10206, 'CS301', 1000, '2026-04-01', 50003],
      [1001004, 10210, 'EC201', 1000, '2026-04-02', 50004],
    ];
    for (const [txn, roll_no, code, amount, date, sup_id] of registrations) {
      try {
        await conn.query('CALL add_payment(?, ?, ?, ?, ?, ?)', [txn, roll_no, code, amount, date, 'SUCCESS']);
        console.log(`  + Payment TXN${txn} | Roll ${roll_no} | ${code}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ Payment TXN${txn} already exists, skipped.`);
        else throw e;
      }
      try {
        await conn.query('CALL register_supplementary(?, ?, ?, ?, ?)', [sup_id, roll_no, txn, code, date]);
        console.log(`  + Supplementary #${sup_id} | Roll ${roll_no} | ${code}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`  ⚠ Supplementary #${sup_id} already exists, skipped.`);
        else if (e.sqlState === '45000') console.log(`  ⚠ Skipped: ${e.message}`);
        else throw e;
      }
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('TEACHER LOGINS (all pass: admin123)');
    console.log('  EMP001 – Dr. Rajesh Sharma   (CSE)');
    console.log('  EMP002 – Prof. Meena Iyer    (MATH)');
    console.log('  EMP003 – Dr. Suresh Pillai   (ECE)');
    console.log('  EMP004 – Prof. Anita Desai   (CSE)');
    console.log('\nSTUDENT LOGINS (any password)');
    console.log('  10201 A – CS301 FAIL (registered)');
    console.log('  10202 B – CS302 registered, CS303 PENDING');
    console.log('  10203 C – EC201 FAIL (not registered)');
    console.log('  10204 D – MA201 FAIL (not registered)');
    console.log('  10205 E – All passed');
    console.log('  10206 F – CS301 registered, CS304 PENDING');
    console.log('  10207 G – EC202 FAIL (not registered)');
    console.log('  10208 H – MA202 FAIL (not registered)');
    console.log('  10209 I – All passed');
    console.log('  10210 J – EC201 registered, EC202 PENDING');
    console.log('═══════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('MySQL is not running. Start the MySQL service first.');
    }
  } finally {
    if (conn) await conn.end();
  }
}

seed();
