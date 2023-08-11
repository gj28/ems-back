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
    const emailCheckQuery = 'SELECT * FROM ems.ems.ems_users WHERE CompanyEmail = $1';
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
        const personalEmailCheckQuery = 'SELECT * FROM ems.ems.ems_users WHERE personalemail = $1';
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
                  'INSERT INTO ems.ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, personalemail, Password, Designation, VerificationToken, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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
    const query = 'SELECT * FROM ems.ems.ems_users WHERE username = $1';
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

  //working for specific user 

  // function getUserData(req, res) {
  //   try {
  //     const userId = req.params.userId;
  
  //     const userDetailsQuery = 'SELECT * FROM ems.ems.ems_users WHERE username = $1';
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

  // function getUserDetails(req, res) {
  //   try {
  //     const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header
  
  //     // Verify the token using jwtUtils.verifyToken (replace with actual function call)
  //     const decodedToken = jwtUtils.verifyToken(token);
  //     if (!decodedToken) {
  //       return res.status(401).json({ message: 'Invalid token' });
  //     }
  
  //     // Fetch user details from the database using the decoded token information
  //     const query = 'SELECT * FROM ems.ems.ems_users WHERE username = $1';
  //     db.query(query, [decodedToken.Username], (error, rows) => {
  //       if (error) {
  //         console.error(error);
  //         return res.status(500).json({ message: 'Internal server error' });
  //       }
  
  //       if (rows.length === 0) {
  //         return res.status(404).json({ message: 'User not found' });
  //       }
  
  //       const user = rows[0];
  //       res.json(user);
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // }
  
  // User details endpoint
function getUserDetails(req, res) {
  const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header

  // Verify the token
  const decodedToken = jwtUtils.verifyToken(token);
  if (!decodedToken) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Fetch user details from the database using the decoded token information
  const query = 'SELECT * FROM ems.ems_users WHERE Username = $1';
  db.query(query, [decodedToken.Username], (error, rows) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    res.json(user);
  });
}

  

 // Forgot password
 function forgotPassword(req, res) {
  const { personalEmail } = req.body;

  // Check if the email exists in the database
  const query = 'SELECT * FROM ems.ems.ems_users WHERE personalEmail = $1';
  db.query(query, [personalEmail], (error, rows) => {
    try {
      if (error) {
        throw new Error('Error during forgot password');
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate a reset token
      const resetToken = jwtUtils.generateToken({ personalEmail: personalEmail });

      // Save the reset token in the database
      const userId = rows[0].UserId;
      const insertQuery = 'INSERT INTO ems.ems_reset_tokens (UserId, token) VALUES ($1, $2)';
      db.query(insertQuery, [userId, resetToken], (error, insertResult) => {
        try {
          if (error) {
            throw new Error('Error saving reset token');
          }

          // Send the reset token to the user's email
          sendResetTokenEmail(personalEmail, resetToken);

          res.json({ message: 'Reset token sent to your email' });
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

function resendResetToken(req, res) {
  const { personalEmail } = req.body;

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM ems.ems_user WHERE PersonalEmail = $1';
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
    const updateQuery = 'UPDATE ems.ems_reset_tokens SET token = $1 WHERE UserId = $2';
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
  db.query(query, [token], (error, rows) => {
    try {
      if (error) {
        throw new Error('Error during reset password');
      }

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userId = rows[0].UserId;

      // Hash the new password
      bcrypt.hash(password, 10, (error, hashedPassword) => {
        try {
          if (error) {
            throw new Error('Error during password hashing');
          }

          // Update the password in the database
          const updateQuery = 'UPDATE ems.ems_user SET Password = $1 WHERE UserId = $2';
          db.query(updateQuery, [hashedPassword, userId], (error, updateResult) => {
            try {
              if (error) {
                throw new Error('Error updating password');
              }

              // Delete the reset token from the reset_tokens table
              const deleteQuery = 'DELETE FROM ems.ems_reset_tokens WHERE token = $!';
              db.query(deleteQuery, [token], (error, deleteResult) => {
                if (error) {
                  console.error('Error deleting reset token:', error);
                }

                res.json({ message: 'Password reset successful' });
              });
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
  const tokenCheckQuery = 'SELECT * FROM ems.ems.ems_users WHERE VerificationToken = $1';
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
      const updateQuery = 'UPDATE ems.ems.ems_users SET Verified = $1 WHERE VerificationToken = $2';
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
  const checkUserQuery = 'SELECT * FROM ems.ems.ems_users WHERE PersonalEmail = $1';
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
      const updateQuery = 'UPDATE ems.ems.ems_users SET VerificationToken = $1 WHERE PersonalEmail = $2';
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
  const personalEmailCheckQuery = 'SELECT * FROM ems.ems.ems_users WHERE PersonalEmail = $1';
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
            'INSERT INTO tms_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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
  const personalEmailCheckQuery = 'SELECT * FROM ems.ems.ems_users WHERE PersonalEmail = $1';
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
            'INSERT INTO ems.ems.ems_users (UserId, Username, FirstName, LastName, CompanyName, CompanyEmail, ContactNo, Location, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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