
const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const { logExecution } = require('../api_usage');





function userDevices(req, res) {
  const companyEmail = req.params.companyEmail;
  
  // Generate a UUID for tenant_id
  const tenantId = uuidv4();
  
  // Log the start of the function execution
  logExecution('userDevices', tenantId, 'INFO', `Fetching devices for ${companyEmail}`);

  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE CompanyEmail = $1';

  db.query(userCheckQuery, [companyEmail], (error, userCheckResult) => {
    if (error) {
      console.error('Error during user check:', error);
      // Log the error
      logExecution('userDevices', tenantId, 'ERROR', 'Error during user check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (userCheckResult.length === 0) {
        console.log('User not found!');
        // Log the end of the function execution with an error message
        logExecution('userDevices', tenantId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      const devicesQuery = 'SELECT * from ems.ems_devices WHERE CompanyEmail = $1';

      db.query(devicesQuery, [companyEmail], (error, devicesResult) => {
        if (error) {
          console.error('Error fetching devices:', error);
          // Log the error
          logExecution('userDevices', tenantId, 'ERROR', 'Error fetching devices');
          return res.status(500).json({ message: 'Internal server error' });
        }

        const devices = devicesResult.rows; // Extract the devices array

        // Log the end of the function execution with a success message
        logExecution('userDevices', tenantId, 'INFO', `Devices fetched successfully for ${companyEmail}`);
        
        res.json({ devices });
        console.log(devices);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      // Log the error
      logExecution('userDevices', tenantId, 'ERROR', 'Error fetching user');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}



function editDevice(req, res) {
  const deviceId = req.params.deviceId;
  const { DeviceLocation, DeviceName } = req.body;
  
  // Generate a UUID for tenant_id
  const tenantId = uuidv4();
  
  // Log the start of the function execution
  logExecution('editDevice', tenantId, 'INFO', `Editing device ${deviceId}`);

  const deviceCheckQuery = 'SELECT * FROM ems.ems_devices WHERE deviceuid = $1';

  db.query(deviceCheckQuery, [deviceId], (error, deviceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      // Log the error
      logExecution('editDevice', tenantId, 'ERROR', 'Error during device check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deviceCheckResult.length === 0) {
        console.log('Device not found!');
        // Log the end of the function execution with an error message
        logExecution('editDevice', tenantId, 'ERROR', 'Device not found');
        return res.status(400).json({ message: 'Device not found!' });
      }

      const devicesQuery = 'UPDATE ems.ems_devices SET DeviceLocation = $1, DeviceName = $2 WHERE deviceuid = $3';

      db.query(devicesQuery, [DeviceLocation, DeviceName, deviceId], (error, devices) => {
        if (error) {
          console.error('Error updating device:', error);
          // Log the error
          logExecution('editDevice', tenantId, 'ERROR', 'Error updating device');
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Log the end of the function execution with a success message
        logExecution('editDevice', tenantId, 'INFO', `Device ${deviceId} updated successfully`);
        
        res.json({ message: 'Device Updated Successfully' });
        console.log(devices);
      });
    } catch (error) {
      console.error('Error updating device:', error);
      // Log the error
      logExecution('editDevice', tenantId, 'ERROR', 'Error updating device');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function companyDetails(req, res) {
  const UserId = req.params.UserId;
  const { Designation, ContactNo, Location } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('companyDetails', tenantId, 'INFO', `Updating company details for user ${UserId}`);

  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';

  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    if (error) {
      console.error('Error during UserId check:', error);
      // Log the error
      logExecution('companyDetails', tenantId, 'ERROR', 'Error during UserId check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        // Log the end of the function execution with an error message
        logExecution('companyDetails', tenantId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      const userQuery = 'UPDATE ems.ems_users SET designation = $1, contactno = $2, location = $3 WHERE userid = $4';

      db.query(userQuery, [Designation, ContactNo, Location, UserId], (error, details) => {
        if (error) {
          console.error('Error updating company details:', error);
          // Log the error
          logExecution('companyDetails', tenantId, 'ERROR', 'Error updating company details');
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Log the end of the function execution with a success message
        logExecution('companyDetails', tenantId, 'INFO', `Company details updated successfully for user ${UserId}`);

        res.json({ message: 'Company Details Updated Successfully' });
        console.log(details);
      });
    } catch (error) {
      console.error('Error updating company details:', error);
      // Log the error
      logExecution('companyDetails', tenantId, 'ERROR', 'Error updating company details');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}



function personalDetails(req, res) {
  const UserId = req.params.UserId;
  const { FirstName, LastName } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('personalDetails', tenantId, 'INFO', `Updating personal details for user ${UserId}`);

  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';

  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    if (error) {
      console.error('Error during UserId check:', error);
      // Log the error
      logExecution('personalDetails', tenantId, 'ERROR', 'Error during UserId check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        // Log the end of the function execution with an error message
        logExecution('personalDetails', tenantId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      const userdetailQuery = 'UPDATE ems.ems_users SET firstname = $1, lastname = $2 WHERE userid = $3';

      db.query(userdetailQuery, [FirstName, LastName, UserId], (error, details) => {
        if (error) {
          console.error('Error updating personal details:', error);
          // Log the error
          logExecution('personalDetails', tenantId, 'ERROR', 'Error updating personal details');
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Log the end of the function execution with a success message
        logExecution('personalDetails', tenantId, 'INFO', `Personal details updated successfully for user ${UserId}`);

        res.json({ message: 'Personal Details Updated Successfully' });
        console.log(details);
      });
    } catch (error) {
      console.error('Error updating personal details:', error);
      // Log the error
      logExecution('personalDetails', tenantId, 'ERROR', 'Error updating personal details');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}



function updatePassword(req, res) {
  const UserId = req.params.UserId;
  const { Password } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('updatePassword', tenantId, 'INFO', `Updating password for user ${UserId}`);

  // Check if the user exists in the database
  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';
  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    try {
      if (error) {
        console.error('Error during UserId check:', error);
        // Log the error
        logExecution('updatePassword', tenantId, 'ERROR', 'Error during UserId check');
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        // Log the end of the function execution with an error message
        logExecution('updatePassword', tenantId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      // Hash the new password
      const hashedPassword = bcrypt.hashSync(Password, 10);

      // Update the user's password in the database
      const updatePasswordQuery = 'UPDATE ems.ems_users SET password = $1 WHERE userid = $2';
      db.query(updatePasswordQuery, [hashedPassword, UserId], (error, result) => {
        if (error) {
          console.error('Error updating password:', error);
          // Log the error
          logExecution('updatePassword', tenantId, 'ERROR', 'Error updating password');
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Log the end of the function execution with a success message
        logExecution('updatePassword', tenantId, 'INFO', `Password updated successfully for user ${UserId}`);

        res.json({ message: 'Password updated successfully' });
        console.log(result);
      });
    } catch (error) {
      console.error('Error updating password:', error);
      // Log the error
      logExecution('updatePassword', tenantId, 'ERROR', 'Error updating password');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}



function fetchDeviceTrigger(req, res) {
  const deviceId = req.params.deviceId;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('fetchDeviceTrigger', tenantId, 'INFO', `Fetching triggers for device ${deviceId}`);

  const deviceTriggerQuery = 'SELECT * FROM ems_trigger WHERE DeviceUID = $1';

  try {
    db.query(deviceTriggerQuery, [deviceId], (error, deviceTriggerResult) => {
      if (error) {
        console.error('Error during device check:', error);
        // Log the error
        logExecution('fetchDeviceTrigger', tenantId, 'ERROR', 'Error during device check');
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Log the end of the function execution
      logExecution('fetchDeviceTrigger', tenantId, 'INFO', `Fetched triggers for device ${deviceId}`);

      res.status(200).json(deviceTriggerResult);
    });
  } catch (error) {
    console.error('Error in device check:', error);
    // Log the error
    logExecution('fetchDeviceTrigger', tenantId, 'ERROR', 'Error in device check');
    res.status(500).json({ message: 'Internal server error' });
  }
}


function fetchAllDeviceTrigger(req, res) {
  const CompanyEmail = req.params.CompanyEmail;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('fetchAllDeviceTrigger', tenantId, 'INFO', `Fetching all triggers for CompanyEmail ${CompanyEmail}`);

  const deviceTriggerQuery = 'SELECT * FROM ems_trigger WHERE CompanyEmail = $1';

  try {
    db.query(deviceTriggerQuery, [CompanyEmail], (error, triggers) => {
      if (error) {
        console.error('Error during device check:', error);
        // Log the error
        logExecution('fetchAllDeviceTrigger', tenantId, 'ERROR', 'Error during device check');
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Log the end of the function execution
      logExecution('fetchAllDeviceTrigger', tenantId, 'INFO', `Fetched all triggers for CompanyEmail ${CompanyEmail}`);

      res.status(200).json({ triggers });
    });
  } catch (error) {
    console.error('Error in device check:', error);
    // Log the error
    logExecution('fetchAllDeviceTrigger', tenantId, 'ERROR', 'Error in device check');
    res.status(500).json({ message: 'Internal server error' });
  }
}


function editDeviceTrigger(req, res) {
  const deviceId = req.params.deviceId;
  const { TriggerValue, CompanyEmail } = req.body;

  // Generate a UUID for tenant_id
  const tenantId = uuidv4();

  // Log the start of the function execution
  logExecution('editDeviceTrigger', tenantId, 'INFO', `Editing device trigger for DeviceUID ${deviceId}`);

  const deviceCheckQuery = 'SELECT * FROM ems_trigger WHERE DeviceUID = $1';

  db.query(deviceCheckQuery, [deviceId], (error, deviceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      // Log the error
      logExecution('editDeviceTrigger', tenantId, 'ERROR', 'Error during device check');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deviceCheckResult.length === 0) {
        const insertTriggerQuery = 'INSERT INTO ems_trigger (DeviceUID, TriggerValue, CompanyEmail) VALUES ($1,$2,$3)';

        db.query(insertTriggerQuery, [deviceId, TriggerValue, CompanyEmail], (error, insertResult) => {
          if (error) {
            console.error('Error while inserting device:', error);
            // Log the error
            logExecution('editDeviceTrigger', tenantId, 'ERROR', 'Error while inserting device');
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Log the end of the function execution
          logExecution('editDeviceTrigger', tenantId, 'INFO', 'Device added successfully');

          return res.json({ message: 'Device added successfully!' });
        });
      } else {
        const updateDeviceTriggerQuery = 'UPDATE ems_trigger SET TriggerValue = $1, CompanyEmail = $2 WHERE DeviceUID = $3';

        db.query(updateDeviceTriggerQuery, [TriggerValue, CompanyEmail, deviceId], (error, updateResult) => {
          if (error) {
            console.error('Error updating device trigger:', error);
            // Log the error
            logExecution('editDeviceTrigger', tenantId, 'ERROR', 'Error updating device trigger');
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Log the end of the function execution
          logExecution('editDeviceTrigger', tenantId, 'INFO', 'Device updated successfully');

          return res.json({ message: 'Device updated successfully' });
        });
      }
    } catch (error) {
      console.error('Error in device check:', error);
      // Log the error
      logExecution('editDeviceTrigger', tenantId, 'ERROR', 'Error in device check');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function getDataByTimeInterval(req, res) {
  try {
    const deviceId = req.params.deviceuid;
    const timeInterval = req.query.interval;
    const averageField = req.query.averageField;

    // Define mapping for time intervals to duration and table name
    const intervalMapping = {
      '30sec': { duration: 30 * 1000, tableName: 'interval_min' },
      '1min': { duration: 60 * 1000, tableName: 'interval_min' },
      // Add other intervals here
    };

    // Validate the selected time interval
    const intervalInfo = intervalMapping[timeInterval];
    if (!intervalInfo) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    const { duration, tableName } = intervalInfo;

    const now = new Date();
    const startTime = new Date(now - duration);

    const sql = `SELECT * FROM ems.${tableName} WHERE deviceuid = $1 AND "timestamp" >= $2`;
    db.query(sql, [deviceId, startTime.toISOString()], (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const dataRows = results.rows;

      if (averageField) {
        // Calculate average values within each time interval
        const aggregatedData = {};

        dataRows.forEach(row => {
          const timestamp = new Date(row.timestamp).getTime();
          const intervalStart = Math.floor(timestamp / duration) * duration;
          const intervalEnd = intervalStart + duration;

          if (!aggregatedData[intervalStart]) {
            aggregatedData[intervalStart] = {
              count: 0,
              totalValue: 0,
            };
          }

          if (timestamp >= intervalStart && timestamp < intervalEnd) {
            aggregatedData[intervalStart].count++;
            aggregatedData[intervalStart].totalValue += row[averageField];
          }
        });

        // Prepare aggregated response data
        const aggregatedResponseData = [];

        for (const intervalStart in aggregatedData) {
          const intervalAverage =
            aggregatedData[intervalStart].totalValue / aggregatedData[intervalStart].count;
          aggregatedResponseData.push({
            intervalStart: new Date(parseInt(intervalStart)).toISOString(),
            average: intervalAverage,
          });
        }

        res.json(aggregatedResponseData);
      } else {
        // Return raw data within the time range
        const responseData = {
          data: dataRows,
        };

        res.json(responseData);
      }
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

       

function getDataByTimeIntervalStatus(req, res) {
  const deviceId = req.params.deviceId;
  const timeInterval = req.query.interval;
  if (!timeInterval) {
    return res.status(400).json({ message: 'Invalid time interval' });
  }

  let duration;
  switch (timeInterval) {
    case '30sec':
      duration = 'INTERVAL 30 SECOND';
      break;
    case '1min':
      duration = 'INTERVAL 1 MINUTE';
      break;
    case '2min':
      duration = 'INTERVAL 2 MINUTE';
      break;
    case '5min':
      duration = 'INTERVAL 5 MINUTE';
      break;
    case '10min':
      duration = 'INTERVAL 10 MINUTE';
      break;
    case '30min':
      duration = 'INTERVAL 30 MINUTE';
      break;
    case '1hour':
      duration = 'INTERVAL 1 HOUR';
      break;
    case '2hour':
      duration = 'INTERVAL 2 HOUR';
      break;
    case '10hour':
      duration = 'INTERVAL 10 HOUR';
      break;
    case '12hour':
      duration = 'INTERVAL 12 HOUR';
      break;
    case '1day':
      duration = 'INTERVAL 1 DAY';
      break;
    case '7day':
      duration = 'INTERVAL 7 DAY';
      break;
    case '30day':
      duration = 'INTERVAL 30 DAY';
      break;
    default:
      return res.status(400).json({ message: 'Invalid time interval' });
  }

  const sql = `SELECT Status, COUNT(*) as count FROM ems_trigger_logs WHERE DeviceUID = $1 AND TimeStamp >= DATE_SUB(NOW(), ${duration}) GROUP BY Status`;
  db.query(sql, [deviceId], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      // Calculate total count
      const totalCount = results.reduce((total, entry) => total + entry.count, 0);

      // Calculate percentage for each status
      const dataWithPercentage = results.map((entry) => ({
        status: entry.Status,
        count: entry.count,
        percentage: (entry.count / totalCount) * 100
      }));

      res.json({ dataStatus: dataWithPercentage });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function getDataByCustomDate(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const startDate = req.query.start;
    const endDate = req.query.end;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const sql = `SELECT * FROM actual_data WHERE DeviceUID = $1 AND TimeStamp >= $2 AND TimeStamp <= $3`;
    db.query(sql, [deviceId, startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z'], (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.json({ data: results });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getDataByCustomDateStatus(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const startDate = req.query.start;
    const endDate = req.query.end;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const sql = `SELECT Status, COUNT(*) as count FROM ems_trigger_logs WHERE DeviceUID = $1 AND TimeStamp >= $2 AND TimeStamp <= $3 GROUP BY Status`;
    db.query(sql, [deviceId, startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z'], (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Calculate total count
      const totalCount = results.reduce((total, entry) => total + entry.count, 0);

      // Calculate percentage for each status
      const dataWithPercentage = results.map((entry) => ({
        status: entry.Status,
        count: entry.count,
        percentage: (entry.count / totalCount) * 100
      }));

      res.json({ dataStatus: dataWithPercentage });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function getDeviceDetails(req, res) {
  try {
    const deviceId = req.params.deviceId;

    // Validate the deviceId parameter if necessary

    const deviceDetailsQuery = 'SELECT * FROM ems.ems_devices WHERE DeviceUID = $1';
    db.query(deviceDetailsQuery, [deviceId], (error, deviceDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (deviceDetail.length === 0) {
        // Handle the case when no device details are found
        return res.status(404).json({ message: 'Device details not found' });
      }

      res.status(200).json(deviceDetail);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function getLiveStatusDetails(req, res) {
  try {
    const deviceId = req.params.deviceId;

    // Validate the deviceId parameter if necessary

    const liveStatusQuery = 'SELECT * FROM ems_trigger_logs WHERE DeviceUID = $1 ORDER BY TimeStamp DESC LIMIT 1';
    db.query(liveStatusQuery, [deviceId], (error, liveStatus) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (liveStatus.length === 0) {
        // Handle the case when no live status details are found
        return res.status(404).json({ message: 'Live status details not found' });
      }

      res.status(200).json(liveStatus);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getUserData(req, res) {
  try {
    const userId = req.params.userId;

    const userDetailsQuery = 'SELECT * FROM ems.ems_users WHERE UserId = $1';
    db.query(userDetailsQuery, [userId], (error, userDetail) => {
      if (error) {
        console.error('Error fetching User:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (userDetail.rows.length === 0) {
        return res.status(404).json({ message: 'User details not found' });
      }

      const userData = userDetail.rows[0];
      res.status(200).json(userData);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



function insertNewMessage(req, res) {
  try {
    const { sender, receiver, message } = req.body;
    const timestamp = new Date().toISOString();
    const isRead = 0; // Assuming the initial value for isRead is 0 (false)

    const insertQuery = 'INSERT INTO ems_notifications (sender, receiver, message, timestamp, isRead) VALUES ($1, $2, $3, $4, $5)';
    db.query(insertQuery, [sender, receiver, message, timestamp, isRead], (error, result) => {
      if (error) {
        console.error('Error inserting new message:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const insertedMessage = {
        sender,
        receiver,
        message,
        timestamp,
        isRead
      };

      res.status(201).json({message : 'Message Send SuccessFully'});
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function markMessageAsRead(req, res) {
  try {
    const messageId = req.params.messageId;

    const updateQuery = 'UPDATE ems_notifications SET isRead = 1 WHERE msgid = ?';
    db.query(updateQuery, [messageId], (error, result) => {
      if (error) {
        console.error('Error updating message status:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Message not found' });
      }

      res.status(200).json({ message: 'Message marked as read' });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function deleteMessage(req, res) {
  try {
    const messageId = req.params.messageId;

    const deleteQuery = 'DELETE FROM ems_notifications WHERE msgid = ?';
    db.query(deleteQuery, [messageId], (error, result) => {
      if (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Message not found' });
      }

      res.status(200).json({ message: 'Message deleted' });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function countUnreadMessages(req, res) {
  try {
    const receiver = req.params.receiver;

    const countQuery = 'SELECT COUNT(*) AS unreadCount FROM ems_notifications WHERE receiver = ? AND isRead = 0';
    db.query(countQuery, [receiver], (error, result) => {
      if (error) {
        console.error('Error counting unread messages:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const unreadCount = result[0].unreadCount;

      res.status(200).json({ unreadCount });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getUserMessages(req, res) {
  try {
    const receiver = req.params.receiver;

    const messagesQuery = 'SELECT * FROM ems_notifications WHERE receiver = ? ORDER BY timestamp desc';
    db.query(messagesQuery, [receiver], (error, messages) => {
      if (error) {
        console.error('Error fetching user messages:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.status(200).json(messages);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function fetchCompanyUser(req, res) {
  const CompanyEmail = req.params.CompanyEmail;
  try {
    const query = 'SELECT * FROM ems.ems_users where CompanyEmail = $1';
    db.query(query, [CompanyEmail], (error, result) => {
      if (error) {
        throw new Error('Error fetching user');
      }
      if (result.rows.length === 1) {
        const user = result.rows[0];
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



function addDeviceTrigger(req, res) {
  const { DeviceUID, TriggerValue, CompanyEmail } = req.body;
    try {
        const insertTriggerQuery = 'INSERT INTO ems_trigger (DeviceUID, TriggerValue, CompanyEmail) VALUES ($1,$2,$3)';

        db.query(insertTriggerQuery, [DeviceUID, TriggerValue, CompanyEmail], (error, insertResult) => {
          if (error) {
            console.error('Error while inserting device:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          return res.json({ message: 'Device Trigger added successfully!' });
        });

    } catch (error) {
      console.error('Error in device check:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

function addDevice(req, res) {
  const { DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName } = req.body;
  try {
    const checkDeviceQuery = 'SELECT * FROM ems.ems_devices WHERE DeviceUID = $1';
    const insertDeviceQuery = 'INSERT INTO ems.ems_devices (DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName) VALUES ($1,$2,$3,$4,$5)';

    db.query(checkDeviceQuery, [DeviceUID], (error, checkResult) => {
      if (error) {
        console.error('Error while checking device:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({ message: 'Device already added' });
      }

      db.query(insertDeviceQuery, [DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName], (insertError, insertResult) => {
        if (insertError) {
          console.error('Error while inserting device:', insertError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        return res.json({ message: 'Device added successfully!' });
      });
    });
  } catch (error) {
    console.error('Error in device check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports = {
	userDevices,
  editDevice,
  fetchDeviceTrigger,
  fetchAllDeviceTrigger,
  companyDetails,
  personalDetails,
  updatePassword,
  editDeviceTrigger,
  getDataByTimeInterval,
  getDataByCustomDate,
  getDataByTimeIntervalStatus,
  getDataByCustomDateStatus,
  getDeviceDetails,
  getLiveStatusDetails,
  getUserData,
  insertNewMessage,
  markMessageAsRead,
  deleteMessage,
  countUnreadMessages,
  getUserMessages,
  fetchCompanyUser,
  addDeviceTrigger,
  addDevice
};