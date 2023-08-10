const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Function to handle user registration
function register(req, res) {
    const {
      companyName,
      companyEmail,
      contact,
      location,
      firstName,
      lastName,
      personalEmail,
      designation,
      password,
    } = req.body;
  
    // Check if the company email is already registered
    const emailCheckQuery = 'SELECT * FROM ems.ems_users WHERE CompanyEmail = $1';
    db.query(emailCheckQuery, [companyEmail], (error, emailCheckResult) => {
      if (error) {
        console.error('Error during email check:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      try {
        if (emailCheckResult.length > 0) {
          console.log('Company email already exists');
          return res.status(400).json({ message: 'Company email already exists' });
        }
  
        // Check if the username (company email) is already registered
        const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE personalemail = $1';
        db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
          if (error) {
            console.error('Error during username check:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }
  
          try {
            if (personalEmailCheckResult.length > 0) {
              console.log('Username already exists');
              return res.status(400).json({ message: 'User already exists' });
            }
  
            // Generate a unique 10-digit user ID
            const userId = generateUserId();
  
            // Hash the password
            bcrypt.hash(password, 10, (error, hashedPassword) => {
              if (error) {
                console.error('Error during password hashing:', error);
                return res.status(500).json({ message: 'Internal server error' });
              }
  
              try {
                // Generate a verification token
                const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });
  
                // Insert the user into the database
                const insertQuery =
                  'INSERT INTO ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, personalemail, Password, Designation, VerificationToken, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
                db.query(
                  insertQuery,
                  [
                    userId,
                    personalEmail,
                    firstName,
                    lastName,
                    companyName,
                    companyEmail,
                    contact,
                    location,
                    'Admin',
                    personalEmail,
                    hashedPassword,
                    designation,
                    verificationToken,
                    '0'
                  ],
                  (error, insertResult) => {
                    if (error) {
                      console.error('Error during user insertion:', error);
                      return res.status(500).json({ message: 'Internal server error' });
                    }
  
                    try {
                      // Send the verification token to the user's email
                      sendTokenEmail(personalEmail, verificationToken);
  
                      console.log('User registered successfully');
                      res.json({ message: 'Registration successful. Check your email for the verification token.' });
                    } catch (error) {
                      console.error('Error sending verification token:', error);
                      res.status(500).json({ message: 'Internal server error' });
                    }
                  }
                );
              } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).json({ message: 'Internal server error' });
              }
            });
          } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ message: 'Internal server error' });
          }
        });
      } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  // Helper function to generate a unique 10-digit user ID
function generateUserId() {
    const userIdLength = 10;
    let userId = '';
  
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  
    for (let i = 0; i < userIdLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      userId += characters.charAt(randomIndex);
    }
  
    return userId;
  }
// Function to send an email with the token
function sendTokenEmail(email, token) {
    const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'kpohekar19@gmail.com',
      pass: 'woptjevenzhqmrpp',
    },
  });
  
    // Read the email template file
    const templatePath = path.join(__dirname, '../mail-body/email-template.ejs');
    fs.readFile(templatePath, 'utf8', (err, templateData) => {
      if (err) {
        console.error('Error reading email template:', err);
        return;
      }
  
      // Compile the email template with EJS
      const compiledTemplate = ejs.compile(templateData);
  
      // Render the template with the token
      const html = compiledTemplate({ token });
  
      const mailOptions = {
        from: 'your-email@example.com',
        to: email,
        subject: 'Registration Token',
        html: html,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    });
  }

  // Login function
  function login(req, res) {
    const { Username, Password } = req.body;
  
    // Check if the user exists in the database
    const query = 'SELECT * FROM ems.ems_users WHERE username = $1';
    db.query(query, [Username], (error, result) => {
      try {
        if (error) {
          throw new Error('Error during login');
        }
  
        const user = result.rows[0]; // Accessing the first row
  
        if (!user) {
          return res.status(401).json({ message: 'User does not exist!' });
        }
  
        if (user.verified === 0) { // Using lowercase 'verified' based on the response structure you provided
          return res.status(401).json({ message: 'User is not verified. Please verify your account.' });
        }
  
        // Compare the provided password with the hashed password in the database
        bcrypt.compare(Password, user.password, (error, isPasswordValid) => {
          try {
            if (error) {
              throw new Error('Error during password comparison');
            }
  
            if (!isPasswordValid) {
              return res.status(401).json({ message: 'Invalid credentials' });
            }
  
            // Generate a JWT token
            const token = jwtUtils.generateToken({ Username: user.username });
            res.json({ token });
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
          }
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  function getUserData(req, res) {
    try {
      const userId = req.params.userId;
  
      const userDetailsQuery = 'SELECT * FROM ems.ems_users WHERE username = $1';
      db.query(userDetailsQuery, [userId], (error, result) => {
        if (error) {
          console.error('Error fetching User:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        const userDetail = result.rows[0]; // Accessing the first row
  
        if (!userDetail) {
          return res.status(404).json({ message: 'User details not found' });
        }
  
        res.status(200).json(userDetail);
      });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  module.exports = {
    login,
    register,
    getUserData
  }