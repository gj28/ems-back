const twilio = require('twilio');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

const accountSid = 'ACb8754fe2a8a8139f772c8681da354639';
const authToken = '42fdd26013e50a0b3c5495f3bd26825e';
const twilioPhoneNumber = '+18148134128';
const twilioClient = twilio(accountSid, authToken);

const previousDeviceStates = {};

function insertInfo(createdTime, type, subject, message, recipient, messageId) {
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }

    const isRead = Math.random() < 0.5 ? 0 : 1;

    const sql =
      'INSERT INTO ems.info_twi (created_time, type, subject, message, recipient, message_id, isRead) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    const values = [createdTime, type, subject, message, recipient, messageId, isRead];

    client.query(sql, values, (queryErr) => {
      done(); // Release the client back to the pool.
      if (queryErr) {
        console.error('Error inserting data into the database:', queryErr);
      } else {
        // Data inserted into the database successfully.
      }
    });
  });
}

function checkState() {
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }

    client.query('SELECT entryid, deviceuid, devicename, phone_number, email, status FROM ems.ems_devices', (queryErr, queryResults) => {
      done(); // Release the client back to the pool.

      if (queryErr) {
        console.error('Error fetching data from the database:', queryErr);
        return;
      }

      const devices = queryResults.rows;

      devices.forEach((device) => {
        const deviceId = device.entryid;
        const previousState = previousDeviceStates[deviceId] || { status: 'unknown' };
        const currentState = {
          status: device.status,
        };

        if (previousState.status !== currentState.status) {
          previousDeviceStates[deviceId] = currentState;

          let message;
          if (currentState.status === 'online') {
            message = `${device.devicename} is online.`;
          } else if (currentState.status === 'offline') {
            message = `${device.devicename} is offline.`;
          } else if (currentState.status === 'heating') {
            message = `${device.devicename} is heating.`;
          } else {
            message = `${device.devicename} has an unknown status: ${currentState.status}`;
          }

          sendSMS(device.phone_number, message);
          sendEmail(device.email, renderEmailTemplate(devices), 'Device Status Update', message);
        }
      });
    });
  });
}

function sendSMS(to, body) {
  const subject = 'Device Status Update';

  const messageId = uuid.v4();
  twilioClient.messages
    .create({
      body: body,
      to: to,
      from: twilioPhoneNumber,
    })
    .then(() => {
      console.log('SMS sent successfully:', body);
      insertInfo(new Date(), 'SMS', subject, body, to, messageId);
    })
    .catch((err) => {
      console.error('Error sending SMS:', err);
    });
}


function sendEmail(to, body, time, message) {
  const subject = 'Device Status Update';

  const messageId = uuid.v4();
  const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'donotreplysenselive@gmail.com',
      pass: 'qpcaneirrhrhqspt',
    },
  });

  const mailOptions = {
    from: 'your_email_address',
    to: to,
    subject: subject,
    html: body,
  };

  emailTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', info.response);
      insertInfo(new Date(), 'Email', subject, message, to, messageId);
    }
  });
}

function renderEmailTemplate(devices) {
  const templateFilePath = path.join(__dirname, 'views', 'device-status.ejs');
  const template = fs.readFileSync(templateFilePath, 'utf-8');

  return ejs.render(template, { devices });
}

module.exports = { checkState, renderEmailTemplate };
