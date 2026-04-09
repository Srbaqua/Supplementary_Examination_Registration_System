require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Connecting to MySQL without database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log(`Creating database ${process.env.DB_NAME} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    console.log('Creating tables...');
    
    // Create Students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student (
        roll_no INT PRIMARY KEY,
        name VARCHAR(45) NOT NULL,
        branch VARCHAR(45) NOT NULL,
        sem VARCHAR(45) NOT NULL,
        email VARCHAR(45) NOT NULL
      )
    `);

    // Create Courses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        code VARCHAR(45) PRIMARY KEY,
        name VARCHAR(45) NOT NULL,
        dept VARCHAR(45) NOT NULL,
        credits VARCHAR(45) NOT NULL
      )
    `);

    // Create Grades table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS grades (
        roll_no INT,
        course_code VARCHAR(45),
        dept VARCHAR(45) NOT NULL,
        credits VARCHAR(45) NOT NULL,
        grade_id VARCHAR(45) NOT NULL,
        PRIMARY KEY (roll_no, course_code),
        FOREIGN KEY (roll_no) REFERENCES student(roll_no),
        FOREIGN KEY (course_code) REFERENCES courses(code)
      )
    `);

    // Create Payment table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment (
        transaction_no INT PRIMARY KEY,
        roll_no INT,
        course_code VARCHAR(45),
        amount INT NOT NULL,
        date DATE NOT NULL,
        payment_status VARCHAR(45) NOT NULL,
        FOREIGN KEY (roll_no) REFERENCES student(roll_no),
        FOREIGN KEY (course_code) REFERENCES courses(code)
      )
    `);

    // Create Supplementary table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS supplementary (
        sup_id INT PRIMARY KEY,
        roll_no INT,
        transaction_no INT,
        course_code VARCHAR(45),
        date DATE NOT NULL,
        FOREIGN KEY (roll_no) REFERENCES student(roll_no),
        FOREIGN KEY (transaction_no) REFERENCES payment(transaction_no),
        FOREIGN KEY (course_code) REFERENCES courses(code)
      )
    `);

    console.log('Tables created successfully.');
    
    console.log('Executing procedures script if possible...');
    // We cannot easily execute triggers/procedures with multiple statements via standard query()
    // because it requires multiple statements to be enabled and parsed. 
    // We'll instruct the user to run the procedures script manually or just try executing them one by one here.
    
    const procedures = [
      `CREATE PROCEDURE add_student(
          IN p_roll INT,
          IN p_name VARCHAR(45),
          IN p_branch VARCHAR(45),
          IN p_sem VARCHAR(45),
          IN p_email VARCHAR(45)
      )
      BEGIN
          INSERT INTO student VALUES (p_roll, p_name, p_branch, p_sem, p_email);
      END`,
      `CREATE PROCEDURE add_course(
          IN p_code VARCHAR(45),
          IN p_name VARCHAR(45),
          IN p_dept VARCHAR(45),
          IN p_credits VARCHAR(45)
      )
      BEGIN
          INSERT INTO courses VALUES (p_code, p_name, p_dept, p_credits);
      END`,
      `CREATE PROCEDURE add_grade(
          IN p_roll INT,
          IN p_code VARCHAR(45),
          IN p_dept VARCHAR(45),
          IN p_credits VARCHAR(45),
          IN p_grade VARCHAR(45)
      )
      BEGIN
          INSERT INTO grades VALUES (p_roll, p_code, p_dept, p_credits, p_grade);
      END`,
      `CREATE PROCEDURE add_payment(
          IN p_txn INT,
          IN p_roll INT,
          IN p_code VARCHAR(45),
          IN p_amount INT,
          IN p_date DATE,
          IN p_status VARCHAR(45)
      )
      BEGIN
          INSERT INTO payment VALUES (p_txn, p_roll, p_code, p_amount, p_date, p_status);
      END`,
      `CREATE PROCEDURE register_supplementary(
          IN p_sup INT,
          IN p_roll INT,
          IN p_txn INT,
          IN p_code VARCHAR(45),
          IN p_date DATE
      )
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM grades
              WHERE roll_no = p_roll
              AND course_code = p_code
              AND grade_id = 'F'
          ) THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Student did not fail this course';
          END IF;
          IF NOT EXISTS (
              SELECT 1 FROM payment
              WHERE transaction_no = p_txn
              AND payment_status = 'SUCCESS'
          ) THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Payment not completed';
          END IF;
          INSERT INTO supplementary VALUES (p_sup, p_roll, p_txn, p_code, p_date);
      END`
    ];

    for (const proc of procedures) {
      const procNameMatch = proc.match(/CREATE PROCEDURE ([a-zA-Z_]+)/);
      if (procNameMatch) {
        const procName = procNameMatch[1];
        await connection.query(`DROP PROCEDURE IF EXISTS ${procName}`);
        await connection.query(proc);
        console.log(`Procedure ${procName} created.`);
      }
    }

    console.log('Database setup completed successfully.');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
