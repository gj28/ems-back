const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { logExecution } = require('../api_usage');
const { v4: uuidv4 } = require('uuid');

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

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the registration process
  logExecution('register', tenantId, 'INFO', 'Registration process started');

  // Check if the company email is already registered
  const emailCheckQuery = 'SELECT * FROM ems.ems_users WHERE CompanyEmail = $1';
  db.query(emailCheckQuery, [companyEmail], (error, emailCheckResult) => {
    if (error) {
      console.error('Error during email check:', error);
      // Log the error
      logExecution('register', tenantId, 'ERROR', 'Error during email check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (emailCheckResult.length > 0) {
        console.log('Company email already exists');
        // Log the error
        logExecution('register', tenantId, 'ERROR', 'Company email already exists');
        return res.status(400).json({ message: 'Company email already exists' });
      }

      // Check if the username (company email) is already registered
      const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE personalemail = $1';
      db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
        if (error) {
          console.error('Error during username check:', error);
          // Log the error
          logExecution('register', tenantId, 'ERROR', 'Error during username check');
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          if (personalEmailCheckResult.length > 0) {
            console.log('Username already exists');
            // Log the error
            logExecution('register', tenantId, 'ERROR', 'Username already exists');
            return res.status(400).json({ message: 'User already exists' });
          }

          // Generate a unique 10-digit user ID
          const userId = generateUserId();

          // Hash the password
          bcrypt.hash(password, 10, (error, hashedPassword) => {
            if (error) {
              console.error('Error during password hashing:', error);
              // Log the error
              logExecution('register', tenantId, 'ERROR', 'Error during password hashing');
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
                  '0',
                ],
                (error, insertResult) => {
                  if (error) {
                    console.error('Error during user insertion:', error);
                    // Log the error
                    logExecution('register', tenantId, 'ERROR', 'Error during user insertion');
                    return res.status(500).json({ message: 'Internal server error' });
                  }

                  // Log the registration success
                  logExecution('register', tenantId, 'SUCCESS', 'User registered successfully');

                  try {
                    // Send the verification token to the user's email
                    sendTokenEmail(personalEmail, verificationToken);

                    console.log('User registered successfully');
                    res.json({ message: 'Registration successful. Check your email for the verification token.' });
                  } catch (error) {
                    console.error('Error sending verification token:', error);
                    // Log the error
                    logExecution('register', tenantId, 'ERROR', 'Error sending verification token');
                    res.status(500).json({ message: 'Internal server error' });
                  }
                }
              );
            } catch (error) {
              console.error('Error during registration:', error);
              // Log the error
              logExecution('register', tenantId, 'ERROR', 'Error during registration');
              res.status(500).json({ message: 'Internal server error' });
            }
          });
        } catch (error) {
          console.error('Error during registration:', error);
          // Log the error
          logExecution('register', tenantId, 'ERROR', 'Error during registration');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      // Log the error
      logExecution('register', tenantId, 'ERROR', 'Error during registration');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function register_dashboard(req, res) {
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

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the registration process
  logExecution('register', tenantId, 'INFO', 'Registration process started');

  // Check if the company email is already registered
  const emailCheckQuery = 'SELECT * FROM ems.ems_users WHERE CompanyEmail = $1';
  db.query(emailCheckQuery, [companyEmail], (error, emailCheckResult) => {
    if (error) {
      console.error('Error during email check:', error);
      // Log the error
      logExecution('register', tenantId, 'ERROR', 'Error during email check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (emailCheckResult.length > 0) {
        console.log('Company email already exists');
        // Log the error
        logExecution('register', tenantId, 'ERROR', 'Company email already exists');
        return res.status(400).json({ message: 'Company email already exists' });
      }

      // Check if the username (company email) is already registered
      const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE personalemail = $1';
      db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
        if (error) {
          console.error('Error during username check:', error);
          // Log the error
          logExecution('register', tenantId, 'ERROR', 'Error during username check');
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          if (personalEmailCheckResult.length > 0) {
            console.log('Username already exists');
            // Log the error
            logExecution('register', tenantId, 'ERROR', 'Username already exists');
            return res.status(400).json({ message: 'User already exists' });
          }

          // Generate a unique 10-digit user ID
          const userId = generateUserId();

          // Hash the password
          bcrypt.hash(password, 10, (error, hashedPassword) => {
            if (error) {
              console.error('Error during password hashing:', error);
              // Log the error
              logExecution('register', tenantId, 'ERROR', 'Error during password hashing');
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
                  '0',
                ],
                (error, insertResult) => {
                  if (error) {
                    console.error('Error during user insertion:', error);
                    // Log the error
                    logExecution('register', tenantId, 'ERROR', 'Error during user insertion');
                    return res.status(500).json({ message: 'Internal server error' });
                  }

                  // Log the registration success
                  logExecution('register', tenantId, 'SUCCESS', 'User registered successfully');

                  try {
                    // Send the verification token to the user's email
                    sendTokenEmail(personalEmail, verificationToken);

                    console.log('User registered successfully');
                    res.json({ message: 'Registration successful. Check your email for the verification token.' });
                  } catch (error) {
                    console.error('Error sending verification token:', error);
                    // Log the error
                    logExecution('register', tenantId, 'ERROR', 'Error sending verification token');
                    res.status(500).json({ message: 'Internal server error' });
                  }
                }
              );
            } catch (error) {
              console.error('Error during registration:', error);
              // Log the error
              logExecution('register', tenantId, 'ERROR', 'Error during registration');
              res.status(500).json({ message: 'Internal server error' });
            }
          });
        } catch (error) {
          console.error('Error during registration:', error);
          // Log the error
          logExecution('register', tenantId, 'ERROR', 'Error during registration');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      // Log the error
      logExecution('register', tenantId, 'ERROR', 'Error during registration');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


  // Helper function to generate a unique 10-digit user ID
  function generateUserId() {
    const userIdLength = 10;
    let userId = '';
  
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  
    // Log the start of the function execution
    logExecution('generateUserId', 'YOUR_TENANT_ID', 'INFO', 'Generating user ID');

    for (let i = 0; i < userIdLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      userId += characters.charAt(randomIndex);
    }

    // Log the end of the function execution
    logExecution('generateUserId', 'YOUR_TENANT_ID', 'INFO', 'User ID generated');

    return userId;
}

// Function to send an email with the token
function sendTokenEmail(email, token) {
  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('sendTokenEmail', tenantId, 'INFO', 'Sending registration token email');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: "kpohekar19@gmail.com",
      pass: "woptjevenzhqmrpp"
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
      from: 'kpohekar19@gmail.com',
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

      // Log the end of the function execution
      logExecution('sendTokenEmail', tenantId, 'INFO', 'Registration token email sent');
    });
  });
}



  // Login function
  function login(req, res) {
    const { Username, Password } = req.body;
  
    // Generate a UUID for tenant_id
    const tenantId = uuidv4();
    let errorOccurred = false;
  
    // Check if the user exists in the database
    const query = 'SELECT * FROM ems.ems_users WHERE username = $1';
    db.query(query, [Username], (error, result) => {
      try {
        if (error) {
          throw new Error('Error during login');
        }
        const user = result.rows[0];
        if (!user) {
          // Log the error and response
          console.error('User does not exist!');
          logExecution('login', tenantId, 'ERROR', 'User does not exist!');
          errorOccurred = true;
  
          return res.status(401).json({ message: 'User does not exist!' });
        }
  
        if (user.verified === 0) {
          // Log the error and response
          console.error('User is not verified. Please verify your account.');
          logExecution('login', tenantId, 'ERROR', 'User is not verified. Please verify your account.');
          errorOccurred = true; 
  
          return res.status(401).json({ message: 'User is not verified. Please verify your account.' });
        }
  
        // Compare the provided password with the hashed password in the database
        bcrypt.compare(Password, user.password, (error, isPasswordValid) => {
          try {
            if (error) {
              throw new Error('Error during password comparison');
            }
  
            if (!isPasswordValid) {
              // Log the error and response
              console.error('Invalid credentials');
              logExecution('login', tenantId, 'ERROR', 'Invalid credentials'); 
              errorOccurred = true; 
  
              return res.status(401).json({ message: 'Invalid credentials' });
            }
  
            // Generate a JWT token
            const token = jwtUtils.generateToken({ Username: user.username });
  
            // Log the success and token generation if no error occurred
            if (!errorOccurred) {
              logExecution('login', tenantId, 'SUCCESS', 'Login successful');
            }
  
            res.json({ token });
          } catch (error) {
            // Log the error and response
            console.error(error);
            logExecution('login', tenantId, 'ERROR', 'Internal server error');
  
            res.status(500).json({ message: 'Internal server error' });
          }
        });
      } catch (error) {
        // Log the error and response
        console.error(error);
        logExecution('login', tenantId, 'ERROR', 'Internal server error'); 
  
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }
  
  //working for specific user 

  // function getUserData(req, res) {
  //   try {
  //     const userId = req.params.userId;
  
  //     const userDetailsQuery = 'SELECT * FROM ems.ems_users WHERE username = $1';
  //     db.query(userDetailsQuery, [userId], (error, result) => {
  //       if (error) {
  //         console.error('Error fetching User:', error);
  //         return res.status(500).json({ message: 'Internal server error' });
  //       }
  
  //       const userDetail = result.rows[0]; // Accessing the first row
  
  //       if (!userDetail) {
  //         return res.status(404).json({ message: 'User details not found' });
  //       }
  
  //       res.status(200).json(userDetail);
  //     });
  //   } catch (error) {
  //     console.error('An error occurred:', error);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // }
  
  // User details endpoint
  function getUserDetails(req, res) {
    const tenantId = uuidv4(); // Generate a UUID for tenant_id
  
    // Log the start of the function execution
    logExecution('getUserDetails', tenantId, 'INFO', 'Fetching user details');
  
    const token = req.headers.authorization.split(' ')[1];
  
    console.log('Extracted Token:', token);
  
    try {
      // Verify the token
      const decodedToken = jwtUtils.verifyToken(token);
  
      if (!decodedToken) {
        // Log the error and response
        console.log('Invalid Token');
        logExecution('getUserDetails', tenantId, 'ERROR', 'Invalid token');
  
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      console.log('Decoded Token:', decodedToken);
  
      const query = 'SELECT * FROM ems.ems_users WHERE username = $1';
      db.query(query, [decodedToken.Username], (error, result) => {
        if (error) {
          // Log the error and response
          console.error('Error executing query:', error);
          logExecution('getUserDetails', tenantId, 'ERROR', 'Error executing database query');
  
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        console.log('Query result:', result);
        if (result.rowCount === 0) {
          // Log the error and response
          console.log('User Not Found');
          logExecution('getUserDetails', tenantId, 'ERROR', 'User not found');
  
          return res.status(404).json({ message: 'User not found' });
        }
  
        const userDetail = result.rows[0];
        console.log('User Details:', userDetail);
  
        // Log the end of the function execution
        logExecution('getUserDetails', tenantId, 'INFO', 'User details fetched successfully');
  
        res.json(userDetail);
      });
    } catch (error) {
      console.error('Token verification error:', error);
      logExecution('getUserDetails', tenantId, 'ERROR', 'Token verification error');
      return res.status(401).json({ message: 'Token verification error' });
    }
  }

 // Forgot password
 function forgotPassword(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('forgotPassword', tenantId, 'INFO', 'Initiating password reset');

  const query = 'SELECT * FROM ems.ems_users WHERE personalemail = $1';
  db.query(query, [personalEmail], (error, result) => {
    if (error) {
      console.error(error);
      // Log the error and response
      logExecution('forgotPassword', tenantId, 'ERROR', 'Internal server error');
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.rows.length === 0) {
      // Log the error and response
      logExecution('forgotPassword', tenantId, 'ERROR', 'User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwtUtils.generateToken({ personalEmail });

    const userId = result.rows[0].userid; 
    const insertQuery = 'INSERT INTO ems.ems_reset_tokens (userid, token) VALUES ($1, $2)';
    db.query(insertQuery, [userId, resetToken], (insertError) => {
      if (insertError) {
        console.error(insertError);
        // Log the error and response
        logExecution('forgotPassword', tenantId, 'ERROR', 'Error saving reset token');
        return res.status(500).json({ message: 'Error saving reset token' });
      }
      sendResetTokenEmail(personalEmail, resetToken);

      // Log the success
      logExecution('forgotPassword', tenantId, 'SUCCESS', 'Reset token sent to email');

      res.json({ message: 'Reset token sent to your email' });
    });
  });
}



function resendResetToken(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('resendResetToken', tenantId, 'INFO', 'Initiating resend of reset token');

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM ems.ems_user WHERE personalemail = $1';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      // Log the error and response
      logExecution('resendResetToken', tenantId, 'ERROR', 'Internal server error');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
      // Log the error and response
      logExecution('resendResetToken', tenantId, 'ERROR', 'User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new verification token
    const userId = userResult[0].UserId;
    const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

    // Update the user's verification token in the database
    const updateQuery = 'UPDATE ems.ems_reset_tokens SET token = $1 WHERE userid = $2';
    db.query(updateQuery, [verificationToken, userId], (error, updateResult) => {
      if (error) {
        console.error('Error updating Resend link:', error);
        // Log the error and response
        logExecution('resendResetToken', tenantId, 'ERROR', 'Internal server error');
        return res.status(500).json({ message: 'Internal server error' });
      }

      try {
        // Send the new verification token to the user's email
        sendResetTokenEmail(personalEmail, verificationToken);

        // Log the success
        logExecution('resendResetToken', tenantId, 'SUCCESS', 'Resend link resent');

        console.log('Resend link resent');
        res.json({ message: 'Resend link resent. Check your email for the new token.' });
      } catch (error) {
        console.error('Error sending verification token:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  });
}


function resetPassword(req, res) {
  const { token, password } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('resetPassword', tenantId, 'INFO', 'Resetting password');

  // Check if the email and reset token match in the database
  const query = 'SELECT * FROM ems.ems_reset_tokens WHERE token = $1';
  db.query(query, [token], (error, result) => {
    if (error) {
      console.error('Error during reset password query:', error);
      // Log the error and response
      logExecution('resetPassword', tenantId, 'ERROR', 'Internal server error');
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.rowCount === 0) {
      // Log the error and response
      logExecution('resetPassword', tenantId, 'ERROR', 'Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    const tokenData = result.rows[0];
    const userId = tokenData.userid;

    // Hash the new password
    bcrypt.hash(password, 10, (error, hashedPassword) => {
      if (error) {
        console.error('Error during password hashing:', error);
        // Log the error and response
        logExecution('resetPassword', tenantId, 'ERROR', 'Internal server error');
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Update the password in the database
      const updateQuery = 'UPDATE ems.ems_users SET Password = $1 WHERE UserId = $2';
      db.query(updateQuery, [hashedPassword, userId], (error, updateResult) => {
        if (error) {
          console.error('Error updating password:', error);
          // Log the error and response
          logExecution('resetPassword', tenantId, 'ERROR', 'Internal server error');
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Delete the reset token from the reset_tokens table
        const deleteQuery = 'DELETE FROM ems.ems_reset_tokens WHERE token = $1';
        db.query(deleteQuery, [token], (error, deleteResult) => {
          if (error) {
            console.error('Error deleting reset token:', error);
          }

          // Log the success
          logExecution('resetPassword', tenantId, 'SUCCESS', 'Password reset successful');

          res.json({ message: 'Password reset successful' });
        });
      });
    });
  });
}



// Function to send an email with the token
function sendTokenEmail(email, token) {
  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('sendTokenEmail', tenantId, 'INFO', 'Sending registration token email');

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
      // Log the error
      logExecution('sendTokenEmail', tenantId, 'ERROR', 'Error reading email template');
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
        // Log the error
        logExecution('sendTokenEmail', tenantId, 'ERROR', 'Error sending email');
      } else {
        console.log('Email sent:', info.response);
        // Log the end of the function execution
        logExecution('sendTokenEmail', tenantId, 'INFO', 'Registration token email sent');
      }
    });
  });
}


function sendResetTokenEmail(personalEmail, resetToken) {
  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('sendResetTokenEmail', tenantId, 'INFO', 'Sending reset password email');

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
  const templatePath = path.join(__dirname, '../mail-body/email-template-forgot-password.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      // Log the error
      logExecution('sendResetTokenEmail', tenantId, 'ERROR', 'Error reading email template');
      return;
    }

    // Compile the email template with EJS
    const compiledTemplate = ejs.compile(templateData);

    // Render the template with the reset token
    const html = compiledTemplate({ resetToken });

    const mailOptions = {
      from: 'kpohekar19@gmail.com',
      to: personalEmail,
      subject: 'Reset Password Link',
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Log the error
        logExecution('sendResetTokenEmail', tenantId, 'ERROR', 'Error sending email');
      } else {
        console.log('Email sent:', info.response);
        // Log the end of the function execution
        logExecution('sendResetTokenEmail', tenantId, 'INFO', 'Reset password email sent');
      }
    });
  });
}


// Function to handle token verification
function verifyToken(req, res) {
  const { token } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('verifyToken', tenantId, 'INFO', 'Verifying user token');

  // Check if the token matches the one stored in the database
  const tokenCheckQuery = 'SELECT * FROM ems.ems_users WHERE VerificationToken = $1';
  db.query(tokenCheckQuery, [token], (error, tokenCheckResult) => {
    if (error) {
      console.error('Error during token verification:', error);
      // Log the error
      logExecution('verifyToken', tenantId, 'ERROR', 'Error during token verification');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (tokenCheckResult.length === 0) {
        console.log('Token verification failed');
        // Log the end of the function execution with an error message
        logExecution('verifyToken', tenantId, 'ERROR', 'Token verification failed');
        return res.status(400).json({ message: 'Token verification failed' });
      }

      // Token matches, update the user's status as verified
      const updateQuery = 'UPDATE ems.ems_users SET Verified = $1 WHERE VerificationToken = $2';
      db.query(updateQuery, [true, token], (error, updateResult) => {
        if (error) {
          console.error('Error updating user verification status:', error);
          // Log the error
          logExecution('verifyToken', tenantId, 'ERROR', 'Error updating user verification status');
          return res.status(500).json({ message: 'Internal server error' });
        }

        console.log('Token verification successful');
        // Log the end of the function execution
        logExecution('verifyToken', tenantId, 'INFO', 'Token verification successful');
        res.json({ message: 'Token verification successful. You can now log in.' });
      });
    } catch (error) {
      console.error('Error during token verification:', error);
      // Log the error
      logExecution('verifyToken', tenantId, 'ERROR', 'Error during token verification');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


// Function to resend the verification token

function resendToken(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('resendToken', tenantId, 'INFO', 'Resending verification token');

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM ems.ems_users WHERE PersonalEmail = $1';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      // Log the error
      logExecution('resendToken', tenantId, 'ERROR', 'Error checking user availability');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is already verified, send a bad request error response
    if (userResult[0].Verified === '1') {
      // Log the end of the function execution with an error message
      logExecution('resendToken', tenantId, 'ERROR', 'User already verified');
      return res.status(400).json({ message: 'User already verified' });
    } else {
      // Generate a new verification token
      const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

      // Update the user's verification token in the database
      const updateQuery = 'UPDATE ems.ems_users SET VerificationToken = $1 WHERE PersonalEmail = $2';
      db.query(updateQuery, [verificationToken, personalEmail], (error, updateResult) => {
        if (error) {
          console.error('Error updating verification token:', error);
          // Log the error
          logExecution('resendToken', tenantId, 'ERROR', 'Error updating verification token');
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          // Send the new verification token to the user's email
          sendTokenEmail(personalEmail, verificationToken);

          console.log('Verification token resent');
          // Log the end of the function execution with a success message
          logExecution('resendToken', tenantId, 'INFO', 'Verification token resent');
          res.json({ message: 'Verification token resent. Check your email for the new token.' });
        } catch (error) {
          console.error('Error sending verification token:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    }
  });
}


// function register_dashboard(req, res) {
//   const {
//     companyName,
//     companyEmail,
//     contact,
//     location,
//     firstName,
//     lastName,
//     personalEmail,
//     designation,
//     password,
//     userType
//   } = req.body;

//   // Generate a UUID for tenant_id
//   const tenantId = uuidv4();

//   // Log the start of the function execution
//   logExecution('register_dashboard', tenantId, 'INFO', 'User registration started');

//   // Check if the username (company email) is already registered
//   const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE PersonalEmail = $1';
//   db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
//     if (error) {
//       console.error('Error during username check:', error);
//       // Log the error
//       logExecution('register_dashboard', tenantId, 'ERROR', 'Error during username check');
//       return res.status(500).json({ message: 'Internal server error' });
//     }

//     try {
//       if (personalEmailCheckResult.length > 0) {
//         console.log('Username already exists');
//         // Log the end of the function execution with an error message
//         logExecution('register_dashboard', tenantId, 'ERROR', 'Username already exists');
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Generate a unique 10-digit user ID
//       const userId = generateUserId();

//       // Hash the password
//       bcrypt.hash(password, 10, (error, hashedPassword) => {
//         if (error) {
//           console.error('Error during password hashing:', error);
//           // Log the error
//           logExecution('register_dashboard', tenantId, 'ERROR', 'Error during password hashing');
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         try {
//           // Generate a verification token
//           const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

//           // Insert the user into the database
//           const insertQuery =
//             'INSERT INTO ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
//           db.query(
//             insertQuery,
//             [
//               userId,
//               personalEmail,
//               firstName,
//               lastName,
//               companyName,
//               companyEmail,
//               contact,
//               location,
//               userType,
//               personalEmail,
//               hashedPassword,
//               designation,
//               verificationToken,
//               '0'
//             ],
//             (error, insertResult) => {
//               if (error) {
//                 console.error('Error during user insertion:', error);
//                 // Log the error
//                 logExecution('register_dashboard', tenantId, 'ERROR', 'Error during user insertion');
//                 return res.status(500).json({ message: 'Internal server error' });
//               }

//               try {
//                 // Send the verification token to the user's email
//                 sendTokenDashboardEmail(personalEmail, verificationToken);

//                 console.log('User registered successfully');
//                 // Log the end of the function execution with a success message
//                 logExecution('register_dashboard', tenantId, 'INFO', 'User registered successfully');
//                 res.json({ message: 'Registration successful. Check your email for the verification token.' });
//               } catch (error) {
//                 console.error('Error sending verification token:', error);
//                 res.status(500).json({ message: 'Internal server error' });
//               }
//             }
//           );
//         } catch (error) {
//           console.error('Error during registration:', error);
//           res.status(500).json({ message: 'Internal server error' });
//         }
//       });
//     } catch (error) {
//       console.error('Error during registration:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });
// }
// function register_dashboard(req, res) {
//   const {
//     companyName,
//     companyEmail,
//     contact,
//     location,
//     firstName,
//     lastName,
//     personalEmail,
//     designation,
//     password,
//     userType
//   } = req.body;

//   // Generate a UUID for tenant_id
//   const tenantId = uuidv4();

//   // Log the start of the function execution
//   logExecution('register_dashboard', tenantId, 'INFO', 'User registration attempt');

//   // Check if the username (company email) is already registered
//   const personalEmailCheckQuery = 'SELECT * FROM tms_users WHERE PersonalEmail = ?';
//   db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
//     try {
//       if (error) {
//         console.error('Error during username check:', error);
//         // Log the error
//         logExecution('register_dashboard', tenantId, 'ERROR', 'Error during username check');
//         throw new Error('Error during username check');
//       }

//       if (personalEmailCheckResult.length > 0) {
//         // Log the end of the function execution with an error message
//         logExecution('register_dashboard', tenantId, 'ERROR', 'User already exists');
//         console.log('Username already exists');
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Generate a unique 10-digit user ID
//       const userId = generateUserId();

//       // Hash the password
//       bcrypt.hash(password, 10, (error, hashedPassword) => {
//         try {
//           if (error) {
//             console.error('Error during password hashing:', error);
//             // Log the error
//             logExecution('register_dashboard', tenantId, 'ERROR', 'Error during password hashing');
//             throw new Error('Error during password hashing');
//           }

//           // Generate a verification token
//           const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

//           // Insert the user into the database
//           const insertQuery =
//             'INSERT INTO tms_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
//           db.query(
//             insertQuery,
//             [
//               userId,
//               personalEmail,
//               firstName,
//               lastName,
//               companyName,
//               companyEmail,
//               contact,
//               location,
//               userType,
//               personalEmail,
//               hashedPassword,
//               designation,
//               verificationToken,
//               '0'
//             ],
//             (error, insertResult) => {
//               try {
//                 if (error) {
//                   console.error('Error during user insertion:', error);
//                   // Log the error
//                   logExecution('register_dashboard', tenantId, 'ERROR', 'Error during user insertion');
//                   throw new Error('Error during user insertion');
//                 }

//                 // Send the verification token to the user's email
//                 sendTokenDashboardEmail(personalEmail, verificationToken);

//                 // Log the end of the function execution with a success message
//                 logExecution('register_dashboard', tenantId, 'INFO', 'User registered successfully');
//                 console.log('User registered successfully');
//                 res.json({ message: 'Registration successful. Check your email for the verification token.' });
//               } catch (error) {
//                 console.error('Error sending verification token:', error);
//                 // Log the error
//                 logExecution('register_dashboard', tenantId, 'ERROR', 'Error sending verification token');
//                 res.status(500).json({ message: 'Internal server error' });
//               }
//             }
//           );
//         } catch (error) {
//           console.error('Error during registration:', error);
//           // Log the error
//           logExecution('register_dashboard', tenantId, 'ERROR', 'Internal server error');
//           res.status(500).json({ message: 'Internal server error' });
//         }
//       });
//     } catch (error) {
//       console.error('Error during registration:', error);
//       // Log the error
//       logExecution('register_dashboard', tenantId, 'ERROR', 'Internal server error');
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });
// }

// function register_dashboard(req, res) {
//   const {
//     companyName,
//     companyEmail,
//     contact,
//     location,
//     firstName,
//     lastName,
//     personalEmail,
//     designation,
//     password,
//     userType
//   } = req.body;

//   // Generate a UUID for tenant_id
//   const tenantId = uuidv4();

//   // Check if the username (company email) is already registered
//   const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE PersonalEmail = $1';
//   db.query(personalEmailCheckQuery, [personalEmail], (error, personalEmailCheckResult) => {
//     if (error) {
//       console.error('Error during username check:', error);
//       // Log the error
//       logExecution('register_dashboard', tenantId, 'ERROR', 'Error during username check');
//       return res.status(500).json({ message: 'Internal server error' });
//     }

//     try {
//       if (personalEmailCheckResult.length > 0) {
//         console.log('Username already exists');
//         // Log the end of the function execution with an error message
//         logExecution('register_dashboard', tenantId, 'ERROR', 'Username already exists');
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Generate a unique 10-digit user ID
//       const userId = generateUserId();

//       // Hash the password
//       bcrypt.hash(password, 10, (error, hashedPassword) => {
//         if (error) {
//           console.error('Error during password hashing:', error);
//           // Log the error
//           logExecution('register_dashboard', tenantId, 'ERROR', 'Error during password hashing');
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         try {
//           // Generate a verification token
//           const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

//           // Insert the user into the database
//           const insertQuery =
//             'INSERT INTO ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
//           db.query(
//             insertQuery,
//             [
//               userId,
//               personalEmail,
//               firstName,
//               lastName,
//               companyName,
//               companyEmail,
//               contact,
//               location,
//               userType,
//               personalEmail,
//               hashedPassword,
//               designation,
//               verificationToken,
//               '0'
//             ],
//             (error, insertResult) => {
//               if (error) {
//                 console.error('Error during user insertion:', error);
//                 // Log the error
//                 logExecution('register_dashboard', tenantId, 'ERROR', 'Error during user insertion');
//                 return res.status(500).json({ message: 'Internal server error' });
//               }

//               try {
//                 // Send the verification token to the user's email
//                 sendTokenDashboardEmail(personalEmail, verificationToken);

//                 console.log('User registered successfully');
//                 // Log the end of the function execution with a success message
//                 logExecution('register_dashboard', tenantId, 'INFO', 'User registered successfully');
//                 res.json({ message: 'Registration successful. Check your email for the verification token.' });
//               } catch (error) {
//                 console.error('Error sending verification token:', error);
//                 res.status(500).json({ message: 'Internal server error' });
//               }
//             }
//           );
//         } catch (error) {
//           console.error('Error during registration:', error);
//           res.status(500).json({ message: 'Internal server error' });
//         }
//       });
//     } catch (error) {
//       console.error('Error during registration:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });
// }
function Block(req, res) {
  const { userid } = req.params;
  const { action } = req.body;
  
  if (action !== 'block' && action !== 'unblock') {
    return res.status(400).json({ message: 'Invalid action. Use "block" or "unblock".' });
  }

  const blockValue = action === 'block' ? 1 : 0;

  // Check if the user is already blocked or unblocked
  const checkQuery = 'SELECT block FROM ems.ems_users WHERE userid = $1';

  db.query(checkQuery, [userid], (checkError, checkResult) => {
    if (checkError) {
      console.error(`Error checking user block status:`, checkError);
      return res.status(500).json({ message: 'Error checking user block status' });
    }

    if (!checkResult || checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBlockStatus = checkResult.rows[0].block;

    if (currentBlockStatus === blockValue) {
      const statusMessage = blockValue === 1 ? 'already blocked' : 'already unblocked';
      return res.status(200).json({ message: `User is ${statusMessage}` });
    }

    // User is not in the desired block state; update the block status
    const updateQuery = 'UPDATE ems.ems_users SET block = $1 WHERE userid = $2';

    db.query(updateQuery, [blockValue, userid], (updateError, updateResult) => {
      if (updateError) {
        console.error(`Error during user ${action}ing:`, updateError);
        return res.status(500).json({ message: `Error ${action}ing user` });
      }

      if (!updateResult || updateResult.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const successMessage = `User ${action}ed successfully`;
      res.status(200).json({ message: successMessage });
    });
  });
}





  module.exports = {
    register,
    generateUserId,
    login,
    //getUserData,
    getUserDetails,
    forgotPassword,
    resendResetToken,
    resetPassword,
    sendTokenEmail,
    sendResetTokenEmail,
    verifyToken,
    resendToken,
    register_dashboard,
    Block
  }