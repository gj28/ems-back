
const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');


function userDevices(req, res) {
  const companyEmail = req.params.companyEmail;
  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE CompanyEmail = $1';

  db.query(userCheckQuery, [companyEmail], (error, userCheckResult) => {
    if (error) {
      console.error('Error during user check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (userCheckResult.length === 0) {
        console.log('User not found!');
        return res.status(400).json({ message: 'User not found!' });
      }

      const devicesQuery = 'SELECT * from ems.ems_devices WHERE CompanyEmail = $1';

      db.query(devicesQuery, [companyEmail], (error, devicesResult) => {
        if (error) {
          console.error('Error fetching devices:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const devices = devicesResult.rows; // Extract the devices array

        res.json({ devices });
        console.log(devices);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function editDevice(req, res) {
  const deviceId = req.params.deviceId;
  const { DeviceLocation, DeviceName}  = req.body; 
  const deviceCheckQuery = 'SELECT * FROM ems.ems_devices WHERE deviceuid = $1';

  db.query(deviceCheckQuery, [deviceId], (error, deivceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deivceCheckResult.length === 0) {
        console.log('User not found!');
        return res.status(400).json({ message: 'Device not found!' });
      }

      const devicesQuery = 'UPDATE ems.ems_devices SET DeviceLocation = $1, DeviceName = $2 WHERE deviceuid = $3';

      db.query(devicesQuery, [DeviceLocation, DeviceName, deviceId], (error, devices) => {
        if (error) {
          console.error('Error fetching devices:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }


        res.json({ message: 'Device Updated SuccessFully' });
        console.log(devices);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function companyDetails(req, res) {
  const UserId = req.params.UserId;
  const { Designation, ContactNo, Location}  = req.body; 
  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE UserId = $1';

  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    if (error) {
      console.error('Error during UserId check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        return res.status(400).json({ message: 'User not found!' });
      }

      const userQuery = 'UPDATE ems.ems_users SET Designation = $1, ContactNo = $2, Location = $3 WHERE UserId = $4';

      db.query(userQuery, [Designation, ContactNo, Location, UserId],(error, details) => {
        if (error) {
          console.error('Error fetching company details:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.json({ message: 'Company details Updated SuccessFully' });
        console.log(details);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function personalDetails(req, res) {
  const UserId = req.params.UserId;
  const {FirstName, LastName}  = req.body; 
  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE UserId = $1';

  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    if (error) {
      console.error('Error during UserId check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        return res.status(400).json({ message: 'User not found!' });
      }

      const userdetailQuery = 'UPDATE ems.ems_users SET FirstName = $1, LastName = $2 WHERE UserId = $3';

      db.query(userdetailQuery, [FirstName, LastName, UserId],(error, details) => {
        if (error) {
          console.error('Error fetching devices:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.json({ message: 'Personal details Updated SuccessFully' });
        console.log(details);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function updatePassword(req, res) {
  const UserId = req.params.UserId;
  const { Password } = req.body;

  // Check if the user exists in the database
  const userCheckQuery = 'SELECT * FROM ems.ems_users WHERE UserId = $1';
  db.query(userCheckQuery, [UserId], (error, useridCheckResult) => {
    try {
      if (error) {
        console.error('Error during UserId check:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (useridCheckResult.length === 0) {
        console.log('User not found!');
        return res.status(400).json({ message: 'User not found!' });
      }

      // Hash the new password
      const hashedPassword = bcrypt.hashSync(Password, 10);

      // Update the user's password in the database
      const updatePasswordQuery = 'UPDATE ems.ems_users SET Password = $1 WHERE UserId = $2';
      db.query(updatePasswordQuery, [hashedPassword, UserId], (error, result) => {
        if (error) {
          console.error('Error updating password:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.json({ message: 'Password updated successfully' });
        console.log(result);
      });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


 function fetchDeviceTrigger(req, res){
   const deviceId = req.params.deviceId;
   const deviceTriggerQuery = 'select * from tms_trigger where DeviceUID = $1';
     try {
       db.query(deviceTriggerQuery, [deviceId], (error, devicetriggerkResult) => {
         if (error) {
           console.error('Error during device check:', error);
           return res.status(500).json({ message: 'Internal server error' });
         }

         res.status(200).json(devicetriggerkResult);
       });
     } catch (error) {
       console.error('Error in device check:', error);
       res.status(500).json({ message: 'Internal server error' });
     }
 }

function fetchAllDeviceTrigger(req, res){
  const CompanyEmail = req.params.CompanyEmail;
  const deviceTriggerQuery = 'select * from tms_trigger where CompanyEmail = $1';

    try {
      db.query(deviceTriggerQuery, [CompanyEmail], (error, triggers) => {
        if (error) {
          console.error('Error during device check:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(200).json({triggers});
      });
    } catch (error) {
      console.error('Error in device check:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

function editDeviceTrigger(req, res) {
  const deviceId = req.params.deviceId;
  const { TriggerValue, CompanyEmail } = req.body;
  const deviceCheckQuery = 'SELECT * FROM tms_trigger WHERE DeviceUID = $1';

  db.query(deviceCheckQuery, [deviceId], (error, deviceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deviceCheckResult.length === 0) {
        const insertTriggerQuery = 'INSERT INTO tms_trigger (DeviceUID, TriggerValue, CompanyEmail) VALUES ($1,$2,$3)';

        db.query(insertTriggerQuery, [deviceId, TriggerValue, CompanyEmail], (error, insertResult) => {
          if (error) {
            console.error('Error while inserting device:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          return res.json({ message: 'Device added successfully!' });
        });
      } else {
        const updateDeviceTriggerQuery = 'UPDATE tms_trigger SET TriggerValue = $1, CompanyEmail = $2 WHERE DeviceUID = $3';

        db.query(updateDeviceTriggerQuery, [TriggerValue, CompanyEmail, deviceId], (error, updateResult) => {
          if (error) {
            console.error('Error updating device trigger:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          return res.json({ message: 'Device updated successfully' });
        });
      }
    } catch (error) {
      console.error('Error in device check:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function getDataByTimeInterval(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const timeInterval = req.query.interval;
    if (!timeInterval) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    let duration;
    let tableName;

    switch (timeInterval) {
        case '30sec':
          duration = 'INTERVAL 30 SECOND';
          tableName = 'interval_min';
          break;
        case '1min':
          duration = 'INTERVAL 1 MINUTE';
          tableName = 'interval_min';
          break;
        case '2min':
          duration = 'INTERVAL 2 MINUTE';
          tableName = 'interval_hour';
          break;
        case '5min':
          duration = 'INTERVAL 5 MINUTE';
          tableName = 'interval_hour';
          break;
        case '10min':
          duration = 'INTERVAL 10 MINUTE';
          tableName = 'interval_hour';
          break;
        case '30min':
          duration = 'INTERVAL 30 MINUTE';
          tableName = 'interval_hour';
          break;
        case '1hour':
          duration = 'INTERVAL 1 HOUR';
          tableName = 'interval_hour';
          break;
        case '2hour':
          duration = 'INTERVAL 2 HOUR';
          tableName = 'interval_day';
          break;
        case '10hour':
          duration = 'INTERVAL 10 HOUR';
          tableName = 'interval_day';
          break;
        case '12hour':
          duration = 'INTERVAL 12 HOUR';
          tableName = 'interval_day';
          break;
        case '1day':
          duration = 'INTERVAL 1 DAY';
          tableName = 'interval_day';
          break;
        case '7day':
          duration = 'INTERVAL 7 DAY';
          tableName = 'interval_week';
          break;
        case '30day':
          duration = 'INTERVAL 30 DAY';
          tableName = 'interval_month';
          break;
      default:
        return res.status(400).json({ message: 'Invalid time interval' });
    }

    const sql = `SELECT * FROM ${tableName} WHERE DeviceUID = $1 AND TimeStamp >= DATE_SUB(NOW(), ${duration})`;
    db.query(sql, [deviceId], (error, results) => {
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

  const sql = `SELECT Status, COUNT(*) as count FROM tms_trigger_logs WHERE DeviceUID = $1 AND TimeStamp >= DATE_SUB(NOW(), ${duration}) GROUP BY Status`;
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

    const sql = `SELECT Status, COUNT(*) as count FROM tms_trigger_logs WHERE DeviceUID = $1 AND TimeStamp >= $2 AND TimeStamp <= $3 GROUP BY Status`;
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

    const liveStatusQuery = 'SELECT * FROM tms_trigger_logs WHERE DeviceUID = $1 ORDER BY TimeStamp DESC LIMIT 1';
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

    // Validate the deviceId parameter if necessary

    const userDetailsQuery = 'SELECT * FROM ems.ems_users WHERE UserId = $1';
    db.query(userDetailsQuery, [userId], (error, userDetail) => {
      if (error) {
        console.error('Error fetching User:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (userDetail.length === 0) {
        // Handle the case when no device details are found
        return res.status(404).json({ message: 'User details not found' });
      }

      res.status(200).json(userDetail);
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

    const insertQuery = 'INSERT INTO tms_notifications (sender, receiver, message, timestamp, isRead) VALUES ($1, $2, $3, $4, $5)';
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

    const updateQuery = 'UPDATE tms_notifications SET isRead = 1 WHERE msgid = ?';
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

    const deleteQuery = 'DELETE FROM tms_notifications WHERE msgid = ?';
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

    const countQuery = 'SELECT COUNT(*) AS unreadCount FROM tms_notifications WHERE receiver = ? AND isRead = 0';
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

    const messagesQuery = 'SELECT * FROM tms_notifications WHERE receiver = ? ORDER BY timestamp desc';
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
    db.query(query, [CompanyEmail], (error, users) => {
      if (error) {
        throw new Error('Error fetching users');
      }

      res.status(200).json(users);
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function addDeviceTrigger(req, res) {
  const { DeviceUID, TriggerValue, CompanyEmail } = req.body;
    try {
        const insertTriggerQuery = 'INSERT INTO tms_trigger (DeviceUID, TriggerValue, CompanyEmail) VALUES ($1,$2,$3)';

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