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
                  '0',
                ],
                (error, insertResult) => {
                  if (error) {
                    console.error('Error during user insertion:', error);
                    return res.status(500).json({ message: 'Internal server error' });
                  }

                  // Log the execution
                  logExecution('register', '60ca6460-46ac-11ee-91bb-c7905c3b6796');

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
    const token = req.headers.authorization.split(' ')[1]; 
  
    console.log('Extracted Token:', token); 
  
    // Verify the token
    const decodedToken = jwtUtils.verifyToken(token);
    if (!decodedToken) {
      console.log('Invalid Token');
      return res.status(401).json({ message: 'Invalid token' });
    }
  
    console.log('Decoded Token:', decodedToken); 
  
    const query = 'SELECT * FROM ems.ems_users WHERE username = $1';
    db.query(query, [decodedToken.Username], (error, result) => {
      if (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      console.log('Query result:', result); 
      if (result.rowCount === 0) {
        console.log('User Not Found');
        return res.status(404).json({ message: 'User not found' });
      }
  
      const userDetail = result.rows[0];
      console.log('User Details:', userDetail);
      res.json(userDetail);
    });
  }
 // Forgot password
 function forgotPassword(req, res) {
  const { personalEmail } = req.body;

  const query = 'SELECT * FROM ems.ems_users WHERE personalemail = $1';
  db.query(query, [personalEmail], (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwtUtils.generateToken({ personalEmail });

    const userId = result.rows[0].userid; 
    const insertQuery = 'INSERT INTO ems.ems_reset_tokens (userid, token) VALUES ($1, $2)';
    db.query(insertQuery, [userId, resetToken], (insertError) => {
      if (insertError) {
        console.error(insertError);
        return res.status(500).json({ message: 'Error saving reset token' });
      }
      sendResetTokenEmail(personalEmail, resetToken);

      res.json({ message: 'Reset token sent to your email' });
    });
  });
}


function resendResetToken(req, res) {
  const { personalEmail } = req.body;

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM ems.ems_user WHERE personalemail = $1';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
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
        return res.status(500).json({ message: 'Internal server error' });
      }

      try {
        // Send the new verification token to the user's email
        sendResetTokenEmail(personalEmail, verificationToken);

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

  // Check if the email and reset token match in the database
  const query = 'SELECT * FROM ems.ems_reset_tokens WHERE token = $1';
  db.query(query, [token], (error, result) => {
    if (error) {
      console.error('Error during reset password query:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const tokenData = result.rows[0];
    const userId = tokenData.userid;

    // Hash the new password
    bcrypt.hash(password, 10, (error, hashedPassword) => {
      if (error) {
        console.error('Error during password hashing:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Update the password in the database
      const updateQuery = 'UPDATE ems.ems_users SET Password = $1 WHERE UserId = $2';
      db.query(updateQuery, [hashedPassword, userId], (error, updateResult) => {
        if (error) {
          console.error('Error updating password:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Delete the reset token from the reset_tokens table
        const deleteQuery = 'DELETE FROM ems.ems_reset_tokens WHERE token = $1';
        db.query(deleteQuery, [token], (error, deleteResult) => {
          if (error) {
            console.error('Error deleting reset token:', error);
          }

          res.json({ message: 'Password reset successful' });
        });
      });
    });
  });
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

function sendResetTokenEmail(personalEmail, resetToken) {
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
      return;
    }

    // Compile the email template with EJS
    const compiledTemplate = ejs.compile(templateData);

    // Render the template with the token
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
      } else {
        console.log('Email sent:', info.response);
      }
    });
  });
}

// Function to handle token verification
function verifyToken(req, res) {
  const { token } = req.body;

  // Check if the token matches the one stored in the database
  const tokenCheckQuery = 'SELECT * FROM ems.ems_users WHERE VerificationToken = $1';
  db.query(tokenCheckQuery, [token], (error, tokenCheckResult) => {
    if (error) {
      console.error('Error during token verification:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (tokenCheckResult.length === 0) {
        console.log('Token verification failed');
        return res.status(400).json({ message: 'Token verification failed' });
      }

      // Token matches, update the user's status as verified
      const updateQuery = 'UPDATE ems.ems_users SET Verified = $1 WHERE VerificationToken = $2';
      db.query(updateQuery, [true, token], (error, updateResult) => {
        if (error) {
          console.error('Error updating user verification status:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        console.log('Token verification successful');
        res.json({ message: 'Token verification successful. You can now log in.' });
      });
    } catch (error) {
      console.error('Error during token verification:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

// Function to resend the verification token

function resendToken(req, res) {
  const { personalEmail } = req.body;

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM ems.ems_users WHERE PersonalEmail = $1';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is already verified, send a bad request error response
    if (userResult[0].Verified === '1') {
      return res.status(400).json({ message: 'User already verified' });
    } else {
      // Generate a new verification token
      const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

      // Update the user's verification token in the database
      const updateQuery = 'UPDATE ems.ems_users SET VerificationToken = $1 WHERE PersonalEmail = $2';
      db.query(updateQuery, [verificationToken, personalEmail], (error, updateResult) => {
        if (error) {
          console.error('Error updating verification token:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          // Send the new verification token to the user's email
          sendTokenEmail(personalEmail, verificationToken);

          console.log('Verification token resent');
          res.json({ message: 'Verification token resent. Check your email for the new token.' });
        } catch (error) {
          console.error('Error sending verification token:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
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
    userType
  } = req.body;

  // Check if the username (company email) is already registered
  const personalEmailCheckQuery = 'SELECT * FROM ems.ems_users WHERE PersonalEmail = $1';
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
            'INSERT INTO ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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
              userType,
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
                sendTokenDashboardEmail(personalEmail, verificationToken);

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
    userType
  } = req.body;

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
            'INSERT INTO ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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
              userType,
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
                sendTokenDashboardEmail(personalEmail, verificationToken);

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
    register_dashboard
  }