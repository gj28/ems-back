const bcrypt = require('bcrypt');
// const bcrypt = require('bcrypt');
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
const { logExecution } = require('../graph/graph');


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


function getDataByCustomDate(req, res) {
  try {
    const deviceid = req.params.deviceid;
    const parameter = req.params.parameter;
    const startDate = new Date(req.query.start);
    const endDate = new Date(req.query.end);

    if (!startDate.getTime() || !endDate.getTime()) {
      return res.status(400).json({ message: 'Invalid date parameters' });
    }

    const parameterList = parameter.split(',').map(param => param.trim());

    const parameterExistsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ems_actual_data'
      AND column_name = ANY($1::text[])
    `;

    db.query(parameterExistsQuery, [parameterList], (paramError, paramResult) => {
      if (paramError) {
        console.error('Error checking parameters:', paramError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const existingParams = paramResult.rows.map(row => row.column_name);
      const missingParams = parameterList.filter(param => !existingParams.includes(param));

      if (missingParams.length > 0) {
        console.error('Parameters do not exist:', missingParams);
        return res.status(400).json({ message: 'The following parameters do not exist: ' + missingParams.join(', ') });
      }
      const sql = `
        SELECT "timestamp", ${parameterList.join(', ')}
        FROM ems.ems_actual_data
        WHERE timestamp BETWEEN $1 AND $2
        AND deviceid = $3`;

      db.query(sql, [startDate, endDate, deviceid], (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = results.rows.map(row => ({
          name: parameterList,
          data: row
        }));

        res.json(data);
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getDeviceDetails(req, res) {
  try {
    const Company = req.params.company;

    // Validate the deviceId parameter if necessary

    const deviceDetailsQuery = 'SELECT * FROM ems.ems_devices WHERE company = $1';
    db.query(deviceDetailsQuery, [Company], (error, deviceDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (deviceDetail.length === 0) {
        // Handle the case when no device details are found
        return res.status(404).json({ message: 'Device details not found' });
      }

      res.status(200).json(deviceDetail.rows);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getUserData(req, res) {
  try {
    const userId = req.params.userId;

    const userDetailsQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';
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
    const query = 'SELECT * FROM ems.ems_users where companyemail = $1';
    db.query(query, [CompanyEmail], (error, result) => {
      if (error) {
        throw new Error('Error fetching users');
      }

      res.status(200).json(result.rows);
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function addDevice(req, res) {
  const { entryid, deviceid, devicelocation, metername, shift, company, virtualgroup } = req.body;
  try {
    const checkDeviceQuery = 'SELECT * FROM ems.ems_devices WHERE entryid = $1';
    const insertDeviceQuery = 'INSERT INTO ems.ems_devices (entryid, timestamp, deviceid, devicelocation, metername, shift, company, virtualgroup) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)';

    db.query(checkDeviceQuery, [entryid], (error, checkResult) => {
      if (error) {
        console.error('Error while checking device:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (checkResult.length > 0) {
        return res.status(400).json({ message: 'Device already added' });
      }

      db.query(insertDeviceQuery, [entryid, deviceid, devicelocation, metername, shift, company, virtualgroup], (insertError, insertResult) => {
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




function temp(req, res) {
  const userId = req.params.userId;
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];

  const fetchInternInfoQuery = 'SELECT * FROM power_data WHERE deviceid = ? AND date = ?';

  db.query(fetchInternInfoQuery, [userId, formattedDate], (queryError, queryResult) => {
    if (queryError) {
      console.error(queryError);
      return res.status(500).json({ message: 'Internal server error while fetching  information' });
    }

    if (queryResult.length === 0) {
      return res.status(200).json({ message: 'No data for today' });
    }
    const internInfo = {
      userId: queryResult[0].UserId,
      inTime: queryResult[0].InTime,
      outTime: queryResult[0].OutTime,
      totalHours: queryResult[0].TotalHours,
      attendance: queryResult[0].Attendence,
      date: queryResult[0].Date,
    };

    return res.status(200).json({ message: 'Information for today', internInfo });
  });
}


function filter(req, res) {
  try {
    const CompanyName = req.params.CompanyName;
    const Userid = req.query.Userid;
    const timeInterval = req.params.interval;

    if (!timeInterval) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    Filterfeeder(CompanyName, Userid, (feederError, feederResult) => {
      if (feederError) {
        console.error('Error fetching data from feeder:', feederError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let duration;
      switch (timeInterval) {
        case '15min':
          duration = 15 * 60 * 1000; // 15 minutes in milliseconds
          break;
        case '30min':
          duration = 30 * 60 * 1000; // 30 minutes in milliseconds
          break;
        case '1hour':
          duration = 60 * 60 * 1000; // 1 hour in milliseconds
          break;
        case '7day':
          duration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          break;
        case '30day':
          duration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          break;
        case '1year':
          duration = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
          break;
        default:
          return res.status(400).json({ message: 'Invalid time interval' });
      }
      
      const filteredData = feederResult.filter(entry => {
        const entryTimestamp = new Date(entry.timestamp).getTime();
        const currentTime = new Date().getTime();
        return entryTimestamp >= currentTime - duration;
      });

      console.log('Filtered Data:', filteredData);

      res.json(filteredData);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function Filterfeeder(CompanyName, Userid, callback) {
  try {
    let query;

    if (Userid) {
      query = 'SELECT * FROM ems.ems_energy_usage WHERE group_name = $1 and virtual_group = $2';
      db.query(query, [CompanyName, Userid], handleQueryResponse(callback));
    } else {
      query = 'SELECT * FROM ems.ems_energy_usage where group_name = $1';
      db.query(query, [CompanyName], handleQueryResponse(callback));
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    callback(error, null); // Pass the error to the callback
  }
}

function handleQueryResponse(callback) {
  return (error, result) => {
    if (error) {
      console.error('Error fetching data:', error);
      return callback(error, null); // Pass the error to the callback
    }

    callback(null, result.rows);
  };
}



  

//feeder

// function feeder(req, res) {
//   const CompanyName = req.params.CompanyName;
//   const Userid = req.query.Userid;
//   const DeviceId = req.query.DeviceId;

//   try {
//     let query;

//     if (Userid && DeviceId) {
//       query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2 and deviceid = $3';
//       db.query(query, [CompanyName, Userid, DeviceId], handleResponse(res));
//     } else if (Userid) {
//       query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2';
//       db.query(query, [CompanyName, Userid], handleResponse(res));
//     } else if (DeviceId) {
//       query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and deviceid = $2';
//       db.query(query, [CompanyName, DeviceId], handleResponse(res));
//     } else {
//       query = 'SELECT * FROM ems.ems_devices WHERE company = $1';
//       db.query(query, [CompanyName], handleResponse(res));
//     }
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

function feeder(req, res) {
  try {
    const CompanyName = req.params.CompanyName;
    const Userid = req.query.Userid;
    const DeviceIds = req.query.DeviceId;
    const Shift = req.query.Shift;
    const TimeInterval = req.query.TimeInterval;

    if (!CompanyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let query;
    let parameters;

    if (Userid && DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2 and deviceid = ANY($3::varchar[])';
      parameters = [CompanyName, Userid, DeviceIds];
    } else if (Userid) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2';
      parameters = [CompanyName, Userid];
    } else if (DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and deviceid = ANY($2::varchar[])';
      parameters = [CompanyName, DeviceIds];
    } else if (Shift) {  
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and shift = $2';
      parameters = [CompanyName, Shift];
    } else {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1';
      parameters = [CompanyName];
    }

    db.query(query, parameters, (error, devicesResult) => {
      if (error) {
        console.error('Error fetching devices:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const devices = devicesResult.rows;

      if (devices.length === 0) {
        return res.status(404).json({ message: 'No devices found for the given company name' });
      }

      const deviceIds = devices.map(device => device.deviceid);

      let duration;
      switch (TimeInterval) {
        case '15min':
          duration = '15 minutes';
          break;
        case '30min':
          duration = '30 minutes';
          break;
        case '1hour':
          duration = '1 hour';
          break;
        case '12hour':
          duration = '12 hours';
          break;
        case '1day':
          duration = '1 day';
          break;
        case '7day':
          duration = '7 days';
          break;
        case '30day':
          duration = '30 days';
          break;
        case '1year':
          duration = '1 year';
          break;
        default:
          return res.status(400).json({ message: 'Invalid time interval' });
      }

      console.log('deviceIds:', deviceIds);
      console.log('duration:', duration);


      const dataQuery = `
        SELECT device_uid, "date_time", "kvah","kvarh","kwh","imp_kvarh","exp_kvarh"
        FROM ems.ems_live
        WHERE date_time >= NOW() - INTERVAL '${duration}'
        AND device_uid = ANY($1::varchar[])
      `;

      const dataQueryParameters = [deviceIds];

      db.query(dataQuery, dataQueryParameters, (dataError, dataResults) => {
        if (dataError) {
          console.error('Error fetching data:', dataError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = {};
        console.log('Data results:', dataResults.rows);
        dataResults.rows.forEach(row => {
          const deviceUid = row.device_uid;

          if (!data[deviceUid]) {
            data[deviceUid] = {
              company: CompanyName,
              device: deviceUid,
              data: []
            };
          }

          data[deviceUid].data.push({
            kvah: row.kvah,
            kwh: row.kwh,
            imp_kvarh: row.imp_kvarh,
            exp_kvarh: row.exp_kvarh,
            kvarh: row.kvarh,
            date_time: row.date_time
          });
          console.log('Processed data:', data);
        });

        res.json(Object.values(data));
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function feederParametrised(req, res) {
  try {
    const CompanyName = req.params.CompanyName;
    const Userid = req.query.Userid;
    const DeviceIds = req.query.DeviceId;
    const Shift = req.query.Shift;
    const TimeInterval = req.query.TimeInterval;

    if (!CompanyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let query;
    let parameters;

    if (Userid && DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2 and deviceid = ANY($3::varchar[])';
      parameters = [CompanyName, Userid, DeviceIds];
    } else if (Userid) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2';
      parameters = [CompanyName, Userid];
    } else if (DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and deviceid = ANY($2::varchar[])';
      parameters = [CompanyName, DeviceIds];
    } else if (Shift) {  
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and shift = $2';
      parameters = [CompanyName, Shift];
    } else {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1';
      parameters = [CompanyName];
    }

    db.query(query, parameters, (error, devicesResult) => {
      if (error) {
        console.error('Error fetching devices:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const devices = devicesResult.rows;

      if (devices.length === 0) {
        return res.status(404).json({ message: 'No devices found for the given company name' });
      }

      const deviceIds = devices.map(device => device.deviceid);

      let duration;
      switch (TimeInterval) {
        case '15min':
          duration = '15 minutes';
          break;
        case '30min':
          duration = '30 minutes';
          break;
        case '1hour':
          duration = '1 hour';
          break;
        case '12hour':
          duration = '12 hours';
          break;
        case '1day':
          duration = '1 day';
          break;
        case '7day':
          duration = '7 days';
          break;
        case '30day':
          duration = '30 days';
          break;
        case '1year':
          duration = '1 year';
          break;
        default:
          return res.status(400).json({ message: 'Invalid time interval' });
      }

      const dataQuery = `
        SELECT device_uid, "date_time", "kva","kw","kvar","voltage_l","voltage_n","current"
        FROM ems.ems_live
        WHERE date_time >= NOW() - INTERVAL '${duration}'
        AND device_uid = ANY($1::varchar[])
      `;

      const dataQueryParameters = [deviceIds];

      db.query(dataQuery, dataQueryParameters, (dataError, dataResults) => {
        if (dataError) {
          console.error('Error fetching data:', dataError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = {};

        dataResults.rows.forEach(row => {
          const deviceUid = row.device_uid;

          if (!data[deviceUid]) {
            data[deviceUid] = {
              company: CompanyName,
              device: deviceUid,
              data: []
            };
          }

          data[deviceUid].data.push({
            kva: row.kva,
            kw: row.kw,
            kvar: row.kvar,
            voltage_l: row.voltage_l,
            voltage_n: row.voltage_n,
            current: row.current,
            date_time: row.date_time
          });
        });

        res.json(Object.values(data));
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function feederHarmonic(req, res) {
  try {
    const CompanyName = req.params.CompanyName;
    const Userid = req.query.Userid;
    const DeviceIds = req.query.DeviceId;
    const Shift = req.query.Shift;
    const TimeInterval = req.query.TimeInterval;

    if (!CompanyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let query;
    let parameters;

    if (Userid && DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2 and deviceid = ANY($3::varchar[])';
      parameters = [CompanyName, Userid, DeviceIds];
    } else if (Userid) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and virtualgroup = $2';
      parameters = [CompanyName, Userid];
    } else if (DeviceIds) {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and deviceid = ANY($2::varchar[])';
      parameters = [CompanyName, DeviceIds];
    } else if (Shift) {  
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1 and shift = $2';
      parameters = [CompanyName, Shift];
    } else {
      query = 'SELECT * FROM ems.ems_devices WHERE company = $1';
      parameters = [CompanyName];
    }
    db.query(query, parameters, (error, devicesResult) => {
      if (error) {
        console.error('Error fetching devices:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const devices = devicesResult.rows;

      if (devices.length === 0) {
        return res.status(404).json({ message: 'No devices found for the given company name' });
      }

      const deviceIds = devices.map(device => device.deviceid);

      let duration;
      switch (TimeInterval) {
        case '15min':
          duration = '15 minutes';
          break;
        case '30min':
          duration = '30 minutes';
          break;
        case '1hour':
          duration = '1 hour';
          break;
        case '12hour':
          duration = '12 hours';
          break;
        case '1day':
          duration = '1 day';
          break;
        case '7day':
          duration = '7 days';
          break;
        case '30day':
          duration = '30 days';
          break;
        case '1year':
          duration = '1 year';
          break;
        default:
          return res.status(400).json({ message: 'Invalid time interval' });
      }

      const dataQuery = `
        SELECT device_uid, "date_time", "thd_v1n","thd_v2n","thd_v3n","thd_v12","thd_v23","thd_v31","thd_i1","thd_i2","thd_i3"
        FROM ems.ems_live
        WHERE date_time >= NOW() - INTERVAL '${duration}'
        AND device_uid = ANY($1::varchar[])
      `;

      const dataQueryParameters = [deviceIds];

      db.query(dataQuery, dataQueryParameters, (dataError, dataResults) => {
        if (dataError) {
          console.error('Error fetching data:', dataError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = {};

        dataResults.rows.forEach(row => {
          const deviceUid = row.device_uid;

          if (!data[deviceUid]) {
            data[deviceUid] = {
              company: CompanyName,
              device: deviceUid,
              data: []
            };
          }

          data[deviceUid].data.push({
            thd_v1n: row.thd_v1n,
            thd_v2n: row.thd_v2n,
            thd_v3n: row.thd_v3n,
            thd_v12: row.thd_v12,
            thd_v23: row.thd_v23,
            thd_v31: row.thd_v31,
            thd_i1: row.thd_i1,
            thd_i2: row.thd_i2,
            thd_i3: row.thd_i3,
            date_time: row.date_time
          });
        });

        res.json(Object.values(data));
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function getdata(req, res) {
  const meters = req.params.meters;

  const fetchInfoQuery = 'SELECT * FROM ems.active WHERE meters = $1 ORDER BY id DESC LIMIT 1';

  db.query(fetchInfoQuery, [meters], (queryError, queryResult) => {
    if (queryError) {
      console.error(queryError);
      return res.status(500).json({ message: 'Internal server error while fetching information' });
    }

    if (queryResult.rows.length === 0) {
      return res.status(200).json({ message: 'No data for today' });
    }

    const Info = {
      kwh: queryResult.rows[0].kwh,
      kvarh: queryResult.rows[0].kvarh,
      pf: queryResult.rows[0].pf,
      kva: queryResult.rows[0].kva,
      kw: queryResult.rows[0].kw,
      kvr: queryResult.rows[0].kvr,
      current: queryResult.rows[0].current,
      voltage_l: queryResult.rows[0].voltage_l,
    };

    return res.status(200).json({ message: 'Data for today', Info });
  });
}



function parametersFilter(req, res) {
  try {
    const deviceid = req.params.deviceid;
    const parameter = req.params.parameter;
    const timeInterval = req.params.interval;

    if (!deviceid || !parameter || !timeInterval) {
      return res.status(400).json({ message: 'Invalid device ID, parameter, or time interval' });
    }

    let duration;
    switch (timeInterval) {
      case '15min':
        duration = '15 minutes';
        break;
        case '30min':
        duration = '30 minutes';
        break;
      case '1hour':
        duration = '1 hours';
        break;
      case '12hour':
        duration = '12 hours';
        break;
      case '1day':
        duration = '1 day';
        break;
      case '7day':
        duration = '7 days';
        break;
      case '30day':
        duration = '30 days';
        break;
      case '1year':
        duration = '1 year';
        break;
      default:
        return res.status(400).json({ message: 'Invalid time interval' });
      }

    const parameterList = parameter.split(',').map(param => param.trim());

    const parameterExistsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ems_live'
      AND column_name = ANY($1::text[])
    `;

    db.query(parameterExistsQuery, [parameterList], (paramError, paramResult) => {
      if (paramError) {
        console.error('Error checking parameters:', paramError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const existingParameters = paramResult.rows.map(row => row.column_name);

      const validParameters = parameterList.filter(param => existingParameters.includes(param));
      const invalidParameters = parameterList.filter(param => !existingParameters.includes(param));

      if (invalidParameters.length > 0) {
        console.error('Invalid parameters:', invalidParameters);
        return res.status(400).json({ message: 'Invalid parameters' });
      }

      const parameterColumns = validParameters.map(param => `"${param.trim().toLowerCase()}"`).join(', ');

      const sql = `
        SELECT "date_time", ${parameterColumns}
        FROM ems.ems_live
        WHERE date_time >= NOW() - INTERVAL '${duration}'
        AND device_uid = $1`;

      db.query(sql, [deviceid], (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = results.rows.map(row => ({
          name: validParameters,
          data: row
        }));

        res.json(data);
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function piechart(req, res) {
  try {
    const timeInterval = req.params.interval;
    const companyName = req.params.companyName;

    if (!timeInterval || !companyName) {
      return res.status(400).json({ message: 'Invalid time interval or company name' });
    }

    let duration;
    switch (timeInterval) {
      case '1hour':
        duration = '1 hours';
        break;
      case '12hour':
        duration = '12 hours';
        break;
      case 'day':
        duration = '1 day';
        break;
      case 'week':
        duration = '7 days';
        break;
      case 'month':
        duration = '30 days';
        break;
      default:
        return res.status(400).json({ message: 'Invalid time interval' });
    }

    // Fetch device IDs associated with the company
    const deviceIdsQuery = `
      SELECT deviceid
      FROM ems.ems_devices
      WHERE company = $1
    `;

    db.query(deviceIdsQuery, [companyName], (deviceIdsError, deviceIdsResult) => {
      if (deviceIdsError) {
        console.error('Error fetching device IDs for company:', deviceIdsError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const deviceIds = deviceIdsResult.rows.map(row => row.deviceid);

      if (deviceIds.length === 0) {
        return res.status(404).json({ message: 'No devices found for the given company name' });
      }
      const sql = `
        SELECT device_uid, SUM("kvah") as total_kvah
        FROM ems.ems_live
        WHERE date_time >= NOW() - INTERVAL '${duration}'
        AND device_uid = ANY($1::varchar[])
        GROUP BY device_uid
      `;

      const queryParameters = [deviceIds];

      db.query(sql, queryParameters, (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = results.rows.map(row => ({
          company: companyName,
          device: row.device_uid,
          data: { kvah: row.total_kvah }
        }));

        res.json(data);
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// function piechart(req, res) {
//   try {
//     const timeInterval = req.params.interval;
//     const companyName = req.params.companyName; // Assuming company name is part of the URL parameters

//     if (!timeInterval || !companyName) {
//       return res.status(400).json({ message: 'Invalid time interval or company name' });
//     }

//     let duration;
//     switch (timeInterval) {
//       case '15min':
//         duration = '15 minutes';
//         break;
//       case '30min':
//         duration = '30 minutes';
//         break;
//       case '1hour':
//         duration = '1 hours';
//         break;
//       case '12hour':
//         duration = '12 hours';
//         break;
//       case '1day':
//         duration = '1 day';
//         break;
//       case '7day':
//         duration = '7 days';
//         break;
//       case '30day':
//         duration = '30 days';
//         break;
//       case '1year':
//         duration = '1 year';
//         break;
//       default:
//         return res.status(400).json({ message: 'Invalid time interval' });
//     }

//     // Fetch device IDs associated with the company
//     const deviceIdsQuery = `
//       SELECT deviceid
//       FROM ems.ems_devices
//       WHERE company = $1
//     `;

//     db.query(deviceIdsQuery, [companyName], (deviceIdsError, deviceIdsResult) => {
//       if (deviceIdsError) {
//         console.error('Error fetching device IDs for company:', deviceIdsError);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       const deviceIds = deviceIdsResult.rows.map(row => row.deviceid);

//       // Check if there are device IDs to avoid an empty array causing issues
//       if (deviceIds.length === 0) {
//         return res.status(404).json({ message: 'No devices found for the given company name' });
//       }

//       // Fetch all kvah values for the selected device IDs within the specified time interval
//       const sql = `
//         SELECT device_uid, "date_time", "kvah"
//         FROM ems.ems_live
//         WHERE date_time >= NOW() - INTERVAL '${duration}'
//         AND device_uid = ANY($1::varchar[])
//       `;

//       const queryParameters = [deviceIds];

//       db.query(sql, queryParameters, (error, results) => {
//         if (error) {
//           console.error('Error fetching data:', error);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         const data = results.rows.map(row => ({
//           company: companyName,
//           device: row.device_uid,
//           data: { kvah: row.kvah, date_time: row.date_time }
//         }));

//         res.json(data);
//       });
//     });
//   } catch (error) {
//     console.error('An error occurred:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }


function addDeviceTrigger(req, res) {
  const { DeviceUID, TriggerValue, CompanyEmail } = req.body;
    try {
        const insertTriggerQuery = 'INSERT INTO ems.ems_trigger (deviceid, triggervalue, companyemail) VALUES ($1,$2,$3)';

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


//userdetails

function getUserDetails(req, res) {
  try {
    const userId = req.params.userId;
    const userDetailsQuery = 'SELECT * FROM ems.ems_user_profile WHERE userid = $1';
    db.query(userDetailsQuery, [userId], (error, userDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (userDetail.length === 0) {
        return res.status(404).json({ message: 'user details not found' });
      }
      res.status(200).json(userDetail.rows);
     });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}




function edituser(req, res) {
  const userId = req.params.userId;
  const { name, designation, mobile, plants, privileges } = req.body;

  const edituserQuery = `UPDATE ems.ems_user_profile SET name = $1, designation = $2, mobile =$3 , plants = $4, privileges = $5 WHERE userid = $6`;

  db.query(edituserQuery,[name, designation, mobile, plants, privileges, userId],
    (updateError, updateResult) => {
      if (updateError) {
        console.error(updateError);                
        return res.status(401).json({ message: 'Error Updating user' });
      }
      return res.status(200).json({ message: 'User Updated Successfully' });
    });
}

function deleteuser(req, res) {
  
  const userId = req.params.userId;
  const checkuserId =`SELECT * FROM ems.ems_user_profile WHERE userid =?`;
  const deleteQuery = 'DELETE FROM ems.ems_user_profile WHERE userid = ?';
  try {
    db.query(checkuserId, [userId], (checkError, checkResult)=>{
      if(checkError) {
        console.log(checkError);
        return res.status(401).json({message: 'error during checking user id'})
      }
      if(checkResult.length === 0 ){
        return res.status(404).json({ message: 'no user found'})
      }
      db.query(deleteQuery, [userId] ,(error, result) => {
        if (error) {
          return res.status(401).json({ message: 'error during deleting' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'user not found' });
        }

        res.status(200).json({ message: 'user deleted' });
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  
}




//feeder configuration
function getFeederDetails(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const feederDetailsQuery = 'SELECT * FROM ems.ems_devices WHERE device_uid = $1';
    db.query(feederDetailsQuery, [deviceId], (error, feederDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (feederDetail.length === 0) {
        return res.status(404).json({ message: 'Feeder details not found' });
      }

      res.status(200).json(feederDetail.rows);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function fetchHighestKva(req, res) {
  const { companyName, interval } = req.params;

  try {
    let intervalQuery;

    switch (interval) {
      case '1hour':
        intervalQuery = '1 hour';
        break;
      case '12hour':
        intervalQuery = '12 hours';
        break;
      case 'day':
        intervalQuery = '1 day';
        break;
      case 'week':
        intervalQuery = '7 days';
        break;
      case 'month':
        intervalQuery = '30 days';
        break;
      default:
        return res.status(400).json({ message: 'Invalid interval specified' });
    }

    // Fetch all devices for the specified company
    const fetchDevicesQuery = `
      SELECT deviceid FROM ems.ems_devices 
      WHERE company = $1`;

    db.query(fetchDevicesQuery, [companyName], (fetchDevicesError, fetchDevicesResult) => {
      if (fetchDevicesError) {
        console.error('Error while fetching devices:', fetchDevicesError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!fetchDevicesResult || fetchDevicesResult.rows.length === 0) {
        return res.status(404).json({ message: 'No devices found for the specified company' });
      }

      // Use map to extract deviceid values
      const deviceIds = fetchDevicesResult.rows.map(row => row.deviceid);

      console.log('Device IDs:', deviceIds);

      // Fetch the top 4 highest kva values for each device within the specified interval
      const fetchHighestKvaQuery = `
        SELECT device_uid, array_agg(kva) AS kva_values, array_agg(date_time) AS timestamp_values
        FROM (
          SELECT device_uid, kva, date_time,
                 ROW_NUMBER() OVER (PARTITION BY device_uid ORDER BY kva DESC) AS rank
          FROM ems.ems_live
          WHERE device_uid = ANY ($1)
            AND date_time >= NOW() - INTERVAL '${intervalQuery}'
        ) AS subquery
        WHERE rank <= 4
        GROUP BY device_uid
        ORDER BY device_uid;
      `;

      const queryParams = [deviceIds];

      console.log('Query:', fetchHighestKvaQuery);
      console.log('Params:', queryParams);

      db.query(fetchHighestKvaQuery, queryParams, (fetchError, fetchResult) => {
        if (fetchError) {
          console.error('Error while fetching highest kva:', fetchError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (!fetchResult || fetchResult.rows.length === 0) {
          return res.status(404).json({ message: 'No data found for the specified interval or devices' });
        }

        const highestKvaByDevice = {};
        fetchResult.rows.forEach(row => {
          const deviceId = row.device_uid;
          const kvaValues = row.kva_values;
          const timestampValues = row.timestamp_values;

          // Convert the kva values to an array of integers
          const kvaArray = kvaValues.map(value => parseInt(value, 10));

          highestKvaByDevice[deviceId] = { kva: kvaArray, timestamp: timestampValues };
        });

        return res.json(highestKvaByDevice);
      });
    });
  } catch (error) {
    console.error('Error in fetching highest kva by company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



function fetchLowestPF(req, res) {
  const { companyName, interval } = req.params;

  try {
    let intervalQuery;

    switch (interval) {
      case '1hour':
        intervalQuery = '1 hour';
        break;
      case '12hour':
        intervalQuery = '12 hours';
        break;
      case 'day':
        intervalQuery = '1 day';
        break;
      case 'week':
        intervalQuery = '7 days';
        break;
      case 'month':
        intervalQuery = '30 days';
        break;
      default:
        return res.status(400).json({ message: 'Invalid interval specified' });
    }

    // Fetch all devices for the specified company
    const fetchDevicesQuery = `
      SELECT deviceid FROM ems.ems_devices 
      WHERE company = $1`;

    db.query(fetchDevicesQuery, [companyName], (fetchDevicesError, fetchDevicesResult) => {
      if (fetchDevicesError) {
        console.error('Error while fetching devices:', fetchDevicesError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!fetchDevicesResult || fetchDevicesResult.rows.length === 0) {
        return res.status(404).json({ message: 'No devices found for the specified company' });
      }

      // Use map to extract deviceid values
      const deviceIds = fetchDevicesResult.rows.map(row => row.deviceid);

      console.log('Device IDs:', deviceIds);

      // Fetch the lowest 4 PF values for each device within the specified interval
      const fetchLowestPFQuery = `
        SELECT device_uid, array_agg(pf) AS pf_values, array_agg(date_time) AS timestamp_values
        FROM (
          SELECT device_uid, pf, date_time,
                 ROW_NUMBER() OVER (PARTITION BY device_uid ORDER BY pf ASC) AS rank
          FROM ems.ems_live
          WHERE device_uid = ANY ($1)
            AND date_time >= NOW() - INTERVAL '${intervalQuery}'
            AND pf > 0 
        ) AS subquery
        WHERE rank <= 4
        GROUP BY device_uid
        ORDER BY device_uid;
      `;

      const queryParams = [deviceIds];

      console.log('Query:', fetchLowestPFQuery);
      console.log('Params:', queryParams);

      db.query(fetchLowestPFQuery, queryParams, (fetchError, fetchResult) => {
        if (fetchError) {
          console.error('Error while fetching lowest PF:', fetchError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (!fetchResult || fetchResult.rows.length === 0) {
          return res.status(404).json({ message: 'No data found for the specified interval or devices' });
        }

        const lowestPFByDevice = {};
        fetchResult.rows.forEach(row => {
          const deviceId = row.device_uid;
          const pfValues = row.pf_values;
          const timestampValues = row.timestamp_values;

          // Convert the pf values to an array of floats
          const pfArray = pfValues.map(value => parseFloat(value));

          lowestPFByDevice[deviceId] = { pf: pfArray, timestamp: timestampValues };
        });

        return res.json(lowestPFByDevice);
      });
    });
  } catch (error) {
    console.error('Error in fetching lowest PF by company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



function Intervalfeeder(req, res) {
  const { deviceId, interval } = req.params;

  try {
    let intervalQuery;

    switch (interval) {
      case '1hour':
        intervalQuery = '1 hours';
        break;
      case '12hour':
        intervalQuery = '12 hours';
        break;
      case 'day':
        intervalQuery = '1 day';
        break;
      case 'week':
        intervalQuery = '7 days';
        break;
      case 'month':
        intervalQuery = '30 days';
        break;
      default:
        return res.status(400).json({ message: 'Invalid interval specified' });
    }
    const parameters = ['kvah', 'kwh', 'kvar', 'kvarh'];

    const selectClause = parameters.map(param => `${param} AS ${param}`).join(', ');

    // Fetch the first values for the specified interval
    const fetchFirstValuesQuery = `
      SELECT ${selectClause} FROM ems.ems_live 
      WHERE device_uid = $1 AND date_time >= NOW() - INTERVAL '${intervalQuery}' 
      ORDER BY date_time ASC LIMIT 1`;

    // Fetch the last values for the specified interval
    const fetchLastValuesQuery = `
      SELECT ${selectClause} FROM ems.ems_live 
      WHERE device_uid = $1 AND date_time <= NOW() 
      ORDER BY date_time DESC LIMIT 1`;
      
    db.query(fetchFirstValuesQuery, [deviceId], (fetchFirstError, fetchFirstResult) => {
      if (fetchFirstError) {
        console.error('Error while fetching the first values:', fetchFirstError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      //console.log('Fetch First Result:', fetchFirstResult);

      if (!fetchFirstResult || fetchFirstResult.rows.length === 0) {
        return res.status(404).json({ message: 'No data found for the specified interval' });
      }

      db.query(fetchLastValuesQuery, [deviceId], (fetchLastError, fetchLastResult) => {
        if (fetchLastError) {
          console.error('Error while fetching the last values:', fetchLastError);
          return res.status(500).json({ message: 'Internal server error' });
        }

       // console.log('Fetch Last Result:', fetchLastResult);

        if (!fetchLastResult || fetchLastResult.rows.length === 0) {
          return res.status(404).json({ message: 'No data found for the specified interval' });
        }

        // Calculate the differences for each parameter
        const parameterDifferences = {};
        parameters.forEach(param => {
          const firstValue = fetchFirstResult.rows[0][param];
          const lastValue = fetchLastResult.rows[0][param];
          const difference = firstValue - lastValue;
          parameterDifferences[param] = difference;
        });

        return res.json(parameterDifferences);
      });
    });
  } catch (error) {
    console.error('Error in device retrieval:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
// function Intervalfeeder(req, res) {
//   const { deviceId, interval } = req.params;

//   try {
//     let intervalQuery;

//     switch (interval) {
//       case 'min':
//         intervalQuery = '5 MINUTE';
//         break;
//       case 'hour':
//         intervalQuery = '1 HOUR';
//         break;
//       case 'day':
//         intervalQuery = '1 DAY';
//         break;
//       case 'week':
//         intervalQuery = '1 WEEK';
//         break;
//       case 'month':
//         intervalQuery = '1 MONTH';
//         break;
//       case 'year':
//         intervalQuery = '1 YEAR';
//         break;
//       default:
//         return res.status(400).json({ message: 'Invalid interval specified' });
//     }

//     const parameters = ['kvah', 'kwh', 'kvar', 'kvarh'];

//     const selectClause = parameters.map(param => `${param} AS ${param}`).join(', ');

//     // Fetch the first values for the specified interval
//     const fetchFirstValuesQuery = `
//       SELECT ${selectClause} FROM ems.ems_live 
//       WHERE device_uid = $1 AND date_time >= NOW() - INTERVAL '${intervalQuery}' 
//       ORDER BY date_time ASC LIMIT 1`;

//     // Fetch the second values for the specified interval
//     const fetchSecondValuesQuery = `
//       SELECT ${selectClause} FROM ems.ems_live 
//       WHERE device_uid = $1 AND date_time >= NOW() - INTERVAL '${intervalQuery}' * 2
//       ORDER BY date_time ASC LIMIT 1`;

//     // Fetch the third values for the specified interval
//     const fetchThirdValuesQuery = `
//       SELECT ${selectClause} FROM ems.ems_live 
//       WHERE device_uid = $1 AND date_time >= NOW() - INTERVAL '${intervalQuery}' * 2
//       ORDER BY date_time ASC LIMIT 1 OFFSET 1`;

//     db.query(fetchFirstValuesQuery, [deviceId], (fetchFirstError, fetchFirstResult) => {
//       if (fetchFirstError) {
//         console.error('Error while fetching the first values:', fetchFirstError);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       if (!fetchFirstResult || fetchFirstResult.rows.length === 0) {
//         return res.status(404).json({ message: 'No data found for the specified interval' });
//       }

//       db.query(fetchSecondValuesQuery, [deviceId], (fetchSecondError, fetchSecondResult) => {
//         if (fetchSecondError) {
//           console.error('Error while fetching the second values:', fetchSecondError);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         if (!fetchSecondResult || fetchSecondResult.rows.length === 0) {
//           return res.status(404).json({ message: 'No data found for the specified interval' });
//         }

//         db.query(fetchThirdValuesQuery, [deviceId], (fetchThirdError, fetchThirdResult) => {
//           if (fetchThirdError) {
//             console.error('Error while fetching the third values:', fetchThirdError);
//             return res.status(500).json({ message: 'Internal server error' });
//           }

//           if (!fetchThirdResult || fetchThirdResult.rows.length === 0) {
//             return res.status(404).json({ message: 'No data found for the specified interval' });
//           }

//           // Calculate the differences for each parameter
//           const firstSecondDifferences = {};
//           const secondThirdDifferences = {};

//           parameters.forEach(param => {
//             const firstValue = fetchFirstResult.rows[0][param];
//             const secondValue = fetchSecondResult.rows[0][param];
//             const thirdValue = fetchThirdResult.rows[0][param];

//             const firstSecondDifference = secondValue - firstValue;
//             const secondThirdDifference = thirdValue - secondValue;

//             firstSecondDifferences[param] = firstSecondDifference;
//             secondThirdDifferences[param] = secondThirdDifference;
//           });

//           return res.json({ firstSecondDifferences, secondThirdDifferences });
//         });
//       });
//     });
//   } catch (error) {
//     console.error('Error in device retrieval:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }


// function feederBargraph(req, res) {
//   const { companyName, interval } = req.params;

//   try {
//     let intervalQuery;

//     switch (interval) {
//       case 'min':
//         intervalQuery = '5 MINUTE';
//         break;
//       case 'hour':
//         intervalQuery = '1 HOUR';
//         break;
//       case 'day':
//         intervalQuery = '1 DAY';
//         break;
//       case 'week':
//         intervalQuery = '1 WEEK';
//         break;
//       case 'month':
//         intervalQuery = '1 MONTH';
//         break;
//       case 'year':
//         intervalQuery = '1 YEAR';
//         break;
//       default:
//         return res.status(400).json({ message: 'Invalid interval specified' });
//     }

//     // Step 1: Retrieve device IDs for the specified company name
//     const fetchDeviceIdsQuery = `
//       SELECT deviceid FROM ems.ems_devices 
//       WHERE company = $1`;

//     db.query(fetchDeviceIdsQuery, [companyName], (fetchDeviceIdsError, fetchDeviceIdsResult) => {
//       if (fetchDeviceIdsError) {
//         console.error('Error while fetching device IDs:', fetchDeviceIdsError);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       if (!fetchDeviceIdsResult || fetchDeviceIdsResult.rows.length === 0) {
//         return res.status(404).json({ message: 'No devices found for the specified company name' });
//       }

//       // Extract device IDs from the result
//       const deviceIds = fetchDeviceIdsResult.rows.map(row => row.deviceid);

//       const parameters = ['kvah', 'kwh', 'kvar', 'kvarh'];

//       // Step 2: Fetch the first and last values for the specified week and device IDs
//       const fetchValuesQuery = `
//         SELECT device_uid, 
//                ${parameters.map(param => `MIN(CASE WHEN date_time >= NOW() - INTERVAL '${intervalQuery}' THEN ${param} END) AS ${param}_first, 
//                                           MAX(${param}) AS ${param}_last`).join(', ')} 
//         FROM ems.ems_live 
//         WHERE device_uid IN (${deviceIds.map((id, index) => `$${index + 1}`).join(', ')}) 
//         GROUP BY device_uid`;

//       // Step 3: Execute the query
//       const queryParameters = [...deviceIds];
//       db.query(fetchValuesQuery, queryParameters, (fetchError, fetchResult) => {
//         if (fetchError) {
//           console.error('Error while fetching data:', fetchError);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         if (!fetchResult || fetchResult.rows.length === 0) {
//           return res.status(404).json({ message: 'No data found for the specified interval and devices' });
//         }

//         // Calculate differences for each device
//         const devicesData = [];
//         fetchResult.rows.forEach(row => {
//           const deviceUid = row.device_uid;
//           const parameterDifferences = {};
//           parameters.forEach(param => {
//             const difference = row[`${param}_last`] - row[`${param}_first`];
//             parameterDifferences[param] = difference;
//           });
//           devicesData.push({ deviceUid, parameterDifferences });
//         });

//         return res.json(devicesData);
//       });
//     });
//   } catch (error) {
//     console.error('Error in device retrieval:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

// function feederBargraph(req, res) {
//   const { companyName, interval } = req.params;

//   try {
//     let intervalQuery;

//     switch (interval) {
//       case 'min':
//         intervalQuery = '5 MINUTE';
//         break;
//       case 'hour':
//         intervalQuery = '1 HOUR';
//         break;
//       case 'day':
//         intervalQuery = '1 DAY';
//         break;
//       case 'week':
//         intervalQuery = '1 WEEK';
//         break;
//       case 'month':
//         intervalQuery = '1 MONTH';
//         break;
//       case 'year':
//         intervalQuery = '1 YEAR';
//         break;
//       default:
//         return res.status(400).json({ message: 'Invalid interval specified' });
//     }

//     // Fetch device IDs for the specified company name
//     const fetchDeviceIdsQuery = `
//       SELECT deviceid FROM ems.ems_devices 
//       WHERE company = $1`;

//     db.query(fetchDeviceIdsQuery, [companyName], (fetchIdsError, fetchIdsResult) => {
//       if (fetchIdsError) {
//         console.error('Error while fetching device IDs:', fetchIdsError);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       const deviceIds = fetchIdsResult.rows.map(row => row.deviceid);

//       if (deviceIds.length === 0) {
//         return res.status(404).json({ message: 'No devices found for the specified company' });
//       }

//       const parameters = ['kvah', 'kwh'];
//       const selectClause = parameters.map(param => `${param} AS ${param}`).join(', ');

//       const fetchValuesQuery = `
//         SELECT device_uid, ${selectClause} FROM ems.ems_live 
//         WHERE device_uid IN (${deviceIds.map((id, index) => `$${index + 1}`).join(', ')})
//         AND date_time >= NOW() - INTERVAL '${intervalQuery}' 
//         ORDER BY device_uid, date_time ASC`;

//       db.query(fetchValuesQuery, deviceIds, (fetchValuesError, fetchValuesResult) => {
//         if (fetchValuesError) {
//           console.error('Error while fetching values:', fetchValuesError);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         if (!fetchValuesResult || fetchValuesResult.rows.length === 0) {
//           return res.status(404).json({ message: 'No data found for the specified interval and company' });
//         }

//         // Process the fetched values as needed
//         const deviceData = {};

//         fetchValuesResult.rows.forEach(row => {
//           const deviceId = row.device_uid;

//           if (!deviceData[deviceId]) {
//             deviceData[deviceId] = {
//               firstValue: {},
//               lastValue: {},
//             };
//           }

//           parameters.forEach(param => {
//             deviceData[deviceId].firstValue[param] = row[param];
//             // Note: You may want to update this for the last value based on your requirements
//           });

//           // Update lastValue for each parameter
//           parameters.forEach(param => {
//             deviceData[deviceId].lastValue[param] = row[param];
//           });
//         });

//         return res.json(deviceData);
//       });
//     });
//   } catch (error) {
//     console.error('Error in device retrieval:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

// function feederBargraph(req, res) {
//   const { companyName, interval } = req.params;

//   try {
//     let duration;

//     switch (interval) {
//       case '1hour':
//         duration = '1 hours';
//         break;
//       case '12hour':
//         duration = '12 hours';
//         break;
//       case 'day':
//         duration = '1 day';
//         break;
//       case 'week':
//         duration = '7 days';
//         break;
//       case 'month':
//         duration = '30 days';
//         break;
//       default:
//         return res.status(400).json({ message: 'Invalid interval specified' });
//     }

//     // Fetch device IDs for the specified company name
//     const fetchDeviceIdsQuery = `
//       SELECT deviceid FROM ems.ems_devices 
//       WHERE company = $1`;

//     db.query(fetchDeviceIdsQuery, [companyName], (fetchIdsError, fetchIdsResult) => {
//       if (fetchIdsError) {
//         console.error('Error while fetching device IDs:', fetchIdsError);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       const deviceIds = fetchIdsResult.rows.map(row => row.deviceid);

//       if (deviceIds.length === 0) {
//         return res.status(404).json({ message: 'No devices found for the specified company' });
//       }

//       const parameters = ['kvah', 'kwh'];
//       const selectClause = parameters.map(param => `${param} AS ${param}`).join(', ');

//       const fetchValuesQuery = `
//         SELECT device_uid, ${selectClause}, date_time FROM ems.ems_live 
//         WHERE device_uid IN (${deviceIds.map((id, index) => `$${index + 1}`).join(', ')})
//         AND date_time >= NOW() - INTERVAL '${duration}' 
//         ORDER BY device_uid, date_time ASC`;

//       db.query(fetchValuesQuery, deviceIds, (fetchValuesError, fetchValuesResult) => {
//         if (fetchValuesError) {
//           console.error('Error while fetching values:', fetchValuesError);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         if (!fetchValuesResult || fetchValuesResult.rows.length === 0) {
//           return res.status(404).json({ message: 'No data found for the specified interval and company' });
//         }

//         // Process the fetched values as needed
//         const deviceData = {};

//         fetchValuesResult.rows.forEach(row => {
//           const deviceId = row.device_uid;

//           if (!deviceData[deviceId]) {
//             deviceData[deviceId] = {
//               values: [],
//             };
//           }

//           parameters.forEach(param => {
//             deviceData[deviceId].values.push({
//               [param]: row[param],
//               date_time: row.date_time,
//             });
//           });
//         });


// // Adjust the structure to set firstValue and lastValue for each device
// Object.keys(deviceData).forEach(deviceId => {
//   const values = deviceData[deviceId].values;

//   if (values.length > 0) {
//     let aggregatedValues = [];

//     if (interval === '1hour') {
//       // 10 datapoints of 10 minutes each
//       for (let i = 0; i < values.length; i += 10) {
//         const startIdx = i;
//         const endIdx = Math.min(i + 9, values.length - 1);
//         const startValue = values[startIdx];
//         const endValue = values[endIdx];
//         aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
//       }
//     } else if (interval === '12hour') {
//       // 12 datapoints of 1 hour each
//       for (let i = 0; i < values.length; i += Math.floor(values.length / 12)) {
//         const startIdx = i;
//         const endIdx = Math.min(i + Math.floor(values.length / 12) - 1, values.length - 1);
//         const startValue = values[startIdx];
//         const endValue = values[endIdx];
//         aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
//       }
//     } else if (interval === 'day') {
//       // 24 datapoints of 1 hour each
//       for (let i = 0; i < values.length; i += Math.floor(values.length / 24)) {
//         const startIdx = i;
//         const endIdx = Math.min(i + Math.floor(values.length / 24) - 1, values.length - 1);
//         const startValue = values[startIdx];
//         const endValue = values[endIdx];
//         aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
//       }
//     } else if (interval === 'week') {
//       // 7 datapoints of 1 day each
//       for (let i = 0; i < values.length; i += Math.ceil(values.length / 7)) {
//         const startIdx = i;
//         const endIdx = Math.min(i + Math.ceil(values.length / 7) - 1, values.length - 1);
//         const startValue = values[startIdx];
//         const endValue = values[endIdx];
//         aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
//       }
//     } else if (interval === 'month') {
//       // 6 datapoints of 5 days each
//       for (let i = 0; i < values.length; i += Math.ceil(values.length / 6)) {
//         const startIdx = i;
//         const endIdx = Math.min(i + Math.ceil(values.length / 6) - 1, values.length - 1);
//         const startValue = values[startIdx];
//         const endValue = values[endIdx];
//         aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
//       }
//     }

//     deviceData[deviceId].aggregatedValues = aggregatedValues;
//   }

//   delete deviceData[deviceId].values;
// });

//         return res.json(deviceData);
//       });
//     });
//   } catch (error) {
//     console.error('Error in device retrieval:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

// function calculateAggregatedValue(startValue, endValue) {
//   // Handle null values by replacing them with 0
//   const startKvah = startValue.kvah || 0;
//   const endKvah = endValue.kvah || 0;
//   const startKwh = startValue.kwh || 0;
//   const endKwh = endValue.kwh || 0;

//   return {
//     kvah: Math.abs( startKvah - endKvah), // Use Math.abs to consider -ve values as +ve
//     kwh: Math.abs( startKwh - endKwh), // Use Math.abs to consider -ve values as +ve
//     date_time: endValue.date_time, // You might want to use the end time as the timestamp
//   };
// }


function feederBargraph(req, res) {
  const { deviceId, interval } = req.params;

  try {
    let duration;

    switch (interval) {
      case '1hour':
        duration = '1 hours';
        break;
      case '12hour':
        duration = '12 hours';
        break;
      case 'day':
        duration = '1 day';
        break;
      case 'week':
        duration = '7 days';
        break;
      case 'month':
        duration = '30 days';
        break;
      default:
        return res.status(400).json({ message: 'Invalid interval specified' });
    }

    // Check if the device ID is available in ems_devices
    const checkDeviceQuery = `
      SELECT deviceid FROM ems.ems_devices 
      WHERE deviceid = $1`;

    db.query(checkDeviceQuery, [deviceId], (checkDeviceError, checkDeviceResult) => {
      if (checkDeviceError) {
        console.error('Error while checking device ID:', checkDeviceError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (checkDeviceResult.rows.length === 0) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Continue fetching device values
      const parameters = ['kvah', 'kwh', 'kva']; // Include 'kva' in the parameters
      const selectClause = parameters.map(param => `${param} AS ${param}`).join(', ');

      const fetchValuesQuery = `
        SELECT device_uid, ${selectClause}, date_time FROM ems.ems_live 
        WHERE device_uid = $1
        AND date_time >= NOW() - INTERVAL '${duration}' 
        ORDER BY device_uid, date_time ASC`;

      db.query(fetchValuesQuery, [deviceId], (fetchValuesError, fetchValuesResult) => {
        if (fetchValuesError) {
          console.error('Error while fetching values:', fetchValuesError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (!fetchValuesResult || fetchValuesResult.rows.length === 0) {
          return res.status(404).json({ message: 'No data found for the specified interval and device' });
        }

        // Process the fetched values as needed
        const deviceData = {};

        fetchValuesResult.rows.forEach(row => {
          if (!deviceData[deviceId]) {
            deviceData[deviceId] = {
              values: [],
            };
          }

          parameters.forEach(param => {
            deviceData[deviceId].values.push({
              [param]: row[param],
              date_time: row.date_time,
            });
          });
        });

        // Adjust the structure to set firstValue and lastValue for the device
        const values = deviceData[deviceId].values;

        if (values.length > 0) {
          let aggregatedValues = [];

          // Adjust aggregation logic based on the interval
          if (interval === '1hour') {
            // 10 datapoints of 10 minutes each
            for (let i = 0; i < values.length; i += 10) {
              const startIdx = i;
              const endIdx = Math.min(i + 9, values.length - 1);
              const startValue = values[startIdx];
              const endValue = values[endIdx];
              aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
            }
          } else if (interval === '12hour') {
            // 12 datapoints of 1 hour each
            for (let i = 0; i < values.length; i += Math.floor(values.length / 12)) {
              const startIdx = i;
              const endIdx = Math.min(i + Math.floor(values.length / 12) - 1, values.length - 1);
              const startValue = values[startIdx];
              const endValue = values[endIdx];
              aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
            }
          } else if (interval === 'day') {
            // 24 datapoints of 1 hour each
            for (let i = 0; I < values.length; i += Math.floor(values.length / 24)) {
              const startIdx = i;
              const endIdx = Math.min(i + Math.floor(values.length / 24) - 1, values.length - 1);
              const startValue = values[startIdx];
              const endValue = values[endIdx];
              aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
            }
          } else if (interval === 'week') {
            // 7 datapoints of 1 day each
            for (let i = 0; i < values.length; i += Math.ceil(values.length / 7)) {
              const startIdx = i;
              const endIdx = Math.min(i + Math.ceil(values.length / 7) - 1, values.length - 1);
              const startValue = values[startIdx];
              const endValue = values[endIdx];
              aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
            }
          } else if (interval === 'month') {
            // 6 datapoints of 5 days each
            for (let i = 0; i < values.length; i += Math.ceil(values.length / 6)) {
              const startIdx = i;
              const endIdx = Math.min(i + Math.ceil(values.length / 6) - 1, values.length - 1);
              const startValue = values[startIdx];
              const endValue = values[endIdx];
              aggregatedValues.push(calculateAggregatedValue(startValue, endValue));
            }
          }

          deviceData[deviceId].aggregatedValues = aggregatedValues;
        }

        delete deviceData[deviceId].values;

        return res.json(deviceData);
      });
    });
  } catch (error) {
    console.error('Error in device retrieval:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function calculateAggregatedValue(startValue, endValue) {
  // Handle null values by replacing them with 0
  const startKvah = startValue.kvah || 0;
  const endKvah = endValue.kvah || 0;
  const startKwh = startValue.kwh || 0;
  const endKwh = endValue.kwh || 0;
  const startKva = startValue.kva || 0;
  const endKva = endValue.kva || 0;

  return {
    kvah: Math.abs(startKvah - endKvah), // Use Math.abs to consider -ve values as +ve
    kwh: Math.abs(startKwh - endKwh), // Use Math.abs to consider -ve values as +ve
    kva: Math.abs(startKva - endKva), // Use Math.abs to consider -ve values as +ve
    date_time: endValue.date_time, // You might want to use the end time as the timestamp
  };
}




function editfeeder(req, res) {
  const deviceId = req.params.deviceId;
  const { name, location, thresholdvalue , feeder_id, group_name} = req.body;

  const editdeviceQuery = `UPDATE ems.ems_feeder SET name = $1, location = $2, thresholdvalue =$3 , feeder_id = $4, group_name = $5 WHERE deviceuid = $6`;

  db.query(editdeviceQuery,[name, location, thresholdvalue, feeder_id, group_name, deviceId],
    (updateError, updateResult) => {
      if (updateError) {
        console.error(updateError);                
        return res.status(401).json({ message: 'Error Updating user' });
      }
      return res.status(200).json({ message: 'User Updated Successfully' });
    });
}



//alertevent
function alerteventDetails(req, res) {
  try {
    const alertId = req.params.alertId;
    const alerteventsQuery = 'SELECT * FROM ems.ems_alerts WHERE feedername = $1';
    db.query(alerteventsQuery, [alertId], (error, alerteventsDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (alerteventsDetail.length === 0) {
        return res.status(404).json({ message: 'alerts details not found' });
      }
      res.status(200).json(alerteventsDetail.rows);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}




function editalert(req, res) {
  const alertId = req.params.alertId;
  const { alertname, name, threshold, repeat, start_time, end_time } = req.body;

  // Validate timestamp values
  if (!isValidTimestamp(start_time) || !isValidTimestamp(end_time)) {
    return res.status(400).json({ message: 'Invalid timestamp format' });
  }

  const editalertQuery = `UPDATE ems.ems_alerts SET name = $1, alertname = $2, threshold = $3, repeat = $4,  start_time = $5, end_time = $6 WHERE feedername = $7`;

  db.query(
    editalertQuery,
    [alertname, name, threshold, repeat, start_time, end_time, alertId],
    (updateError, updateResult) => {
      if (updateError) {
        console.error(updateError);
        return res.status(401).json({ message: 'Error Updating user' });
      }
      return res.status(200).json({ message: 'User Updated Successfully' });
    }
  );
}

// Function to validate timestamp format
function isValidTimestamp(timestamp) {
  // Implement your timestamp validation logic here
  // Example: return true if the timestamp is in a valid format, otherwise false
  return timestamp && !isNaN(Date.parse(timestamp));
}





function fetchmaxdemand(req, res) {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const companyName = req.params.companyName; // Assuming the company name is passed as a parameter

    const query = `SELECT * FROM ems.maxdemand WHERE DATE(calculation_date) = '${currentDate}' AND company_name = '${companyName}'`;

    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ message: 'Error fetching devices', error: error.message });
        return;
      }

      const devices = result.rows;

      res.json({ devices });
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function maxdemand() {
  try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const deviceIdsQuery = `
          SELECT DISTINCT device_uid
          FROM ems.ems_live;`;

      db.query(deviceIdsQuery, (deviceIdsError, deviceIdsResult) => {
          if (deviceIdsError) {
              console.error('Error fetching unique device IDs:', deviceIdsError);
              return;
          }

          const uniqueDeviceIds = deviceIdsResult.rows;

          uniqueDeviceIds.forEach((device) => {
              const deviceID = device.device_uid;

              const deviceCompanyQuery = `
                  SELECT company
                  FROM ems.ems_devices
                  WHERE deviceid = $1;`;

              db.query(deviceCompanyQuery, [deviceID], (companyError, companyResult) => {
                  if (companyError) {
                      console.error(`Error fetching company for device ${deviceID}:`, companyError);
                      return;
                  }

                  const company = companyResult.rows[0]?.company || 'Unknown'; // Default to 'Unknown' if company is not found

                  const deviceHighestKVAQuery = `
                      SELECT
                          MAX(kva) AS highest_kva
                      FROM ems.ems_live
                      WHERE date_time >= $1 AND device_uid = $2;`;

                  db.query(deviceHighestKVAQuery, [currentDate, deviceID], (error, result) => {
                      if (error) {
                          console.error(`Error fetching highest KVA for device ${deviceID}:`, error);
                          return;
                      }

                      const highestKVA = result.rows[0]?.highest_kva || 0;

                      const latestKVAQuery = `
                          SELECT
                              kva
                          FROM ems.ems_live
                          WHERE device_uid = $1
                          ORDER BY date_time DESC
                          LIMIT 1;`;

                      db.query(latestKVAQuery, [deviceID], (latestKVAError, latestKVAResult) => {
                          if (latestKVAError) {
                              console.error(`Error fetching latest KVA for device ${deviceID}:`, latestKVAError);
                              return;
                          }

                          const latestKVA = latestKVAResult.rows[0]?.kva || 0;

                          const upsertQuery = `
                              INSERT INTO ems.maxdemand (deviceid, company_name, highest_kva, live_kva, calculation_date)
                              VALUES ($1, $2, $3, $4, $5)
                              ON CONFLICT (deviceid, calculation_date)
                              DO UPDATE SET
                                  highest_kva = GREATEST(EXCLUDED.highest_kva, $3),
                                  live_kva = $4;`;

                          db.query(upsertQuery, [deviceID, company, highestKVA, latestKVA, currentDate], (upsertError) => {
                              if (upsertError) {
                                  console.error(`Error inserting or updating KVA values for device ${deviceID}:`, upsertError);
                              } else {
                                  //console.log(`KVA values for device ${deviceID} inserted or updated successfully.`);
                              }
                          });
                      });
                  });
              });
          });
      });
  } catch (error) {
      console.error('Error inserting or updating device KVA values:', error);
  }
}


setInterval(maxdemand, 60 * 1000);

maxdemand();



// Maithili //

function getUser_Data(req, res) {
  const companyEmail = req.params.companyEmail;
  const getUserDetailsQuery = `SELECT username , firstname , lastname , companyid , companyemail , contactno , designation , verified ,  block  FROM ems.ems_users WHERE companyemail = $1`;
  
  db.query(getUserDetailsQuery, [companyEmail], (getUserDetailsError, getUserDetailsResult) => {
    if (getUserDetailsError) {
      
      return res.status(401).json({ message: 'Error while Fetching Data', error: getUserDetailsError });
    }

    if (getUserDetailsResult.rows.length === 0) {
      return res.status(404).json({ message: 'No data Found' });
    }

    res.json({ getUser_Data: getUserDetailsResult.rows });
  });
}


function delete_user(req, res) {
  const userid = req.params.userid;

  const checkUserQuery = `SELECT * FROM ems.ems_users WHERE Userid = $1`;
  db.query(checkUserQuery, [userid], (checkError, checkResult) => {
    if (checkError) {
       res.status(500).json({ message: 'Error while checking user', error: checkError });
    }

    if (checkResult.rows.length === 0) {
       res.status(404).json({ message: 'User Not Found' });
    }

    const deleteUserQuery = `DELETE FROM ems.ems_users WHERE Userid = $1`;
    db.query(deleteUserQuery, [userid], (deleteError, deleteResult) => {
      if (deleteError) {
         res.status(500).json({ message: 'Error while deleting user', error: deleteError });
      }

      if (deleteResult.rowCount === 0) {
         res.status(404).json({ message: 'User Not Found' });
      }

       res.status(200).json({ message: 'User Deleted Successfully' });
    });
  });
}


// function edit_user(req, res) {
//   const userid = req.params.userid;
//   const {
//     userName,
//     firstName,
//     lastName,
//     companyId,
//     companyEmail,
//     contactno,
//     personalEmail,
//     password,
//     designation
//   } = req.body;

//   const editUserQuery = `
//     UPDATE ems.ems_users
//     SET username = $1, firstname = $2, lastname = $3, companyid = $4, companyemail = $5, contactno = $6, personalemail = $7, password = $8, designation = $9
//     WHERE userid = $10`;

//     bcrypt.hash(password , 10 , (hashError , hashPassword) => {
//       if (hashError){
//           res.status(401).json({message: 'Error while hashing passward',hashError});
//       }
//   db.query(
//     editUserQuery,
//     [
//       userName,
//       firstName,
//       lastName,
//       companyId,
//       companyEmail,
//       contactno,
//       personalEmail,
//       hashPassword,
//       designation,
//        userid
//     ],
//     (error, result) => {
//       if (error) {
//         console.error('Error updating user:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//       }

//       if (result.rowCount === 0) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       res.json({ message: 'User updated successfully' });
//     })
//   })
// };


function getFeederData(req, res) {
  const feeder_id = req.params.feeder_id; 
  const getFeederQuery = `SELECT * FROM ems.ems_feeder WHERE feeder_id = $1`;
  
  db.query(getFeederQuery, [feeder_id], (getFeederError, getFeederResult) => {
    if (getFeederError) {
      return res.status(500).json({ message: 'Error while fetching data', error: getFeederError });
    }

    if (getFeederResult.rows.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    res.json({ getFeederData: getFeederResult.rows });
  });
}


function delete_feeder(req, res) {
  const feeder_id = req.params.feeder_id;

  const checkFeederQuery = `SELECT * FROM ems.ems_feeder WHERE feeder_id = $1`;
  db.query(checkFeederQuery, [feeder_id], (checkError, checkResult) => {
    if (checkError) {
       res.status(500).json({ message: 'Error while checking feederr', error: checkError });
    }

    if (checkResult.rows.length === 0) {
       res.status(404).json({ message: 'Feeder Not Found' });
    }
    
    const deleteFeederQuery = `DELETE FROM ems.ems_feeder WHERE feeder_id = $1`;
    db.query(deleteFeederQuery, [feeder_id], (deleteError, deleteResult) => {
      if (deleteError) {
         res.status(500).json({ message: 'Error while deleting feeder', error: deleteError });
      }

      if (deleteResult.rowCount === 0) {
         res.status(404).json({ message: 'feeder Not Found' });
      }

       res.status(200).json({ message: 'Feeder Deleted Successfully' });
    });
  });
}



function getAlerts(req, res) {
  const name = req.params.name;
  const getAlertsQuery = `SELECT * FROM ems.ems_alerts WHERE name = $1`;
  
  db.query(getAlertsQuery, [name], (getError, getResult) => {
    if (getError) {
      
      return res.status(401).json({ message: 'Error while Fetching Data', error: getError });
    }

    if (getResult.rows.length === 0) {
      return res.status(404).json({ message: 'No data Found' });
    }

    res.json({ getAlerts : getResult.rows });
  });
}


function delete_alerts(req, res) {
  const name = req.params.name;

  const checkAlertQuery = `SELECT * FROM ems.ems_alerts WHERE name = $1`;
  db.query(checkAlertQuery, [name], (checkError, checkResult) => {
    if (checkError) {
       res.status(500).json({ message: 'Error while checking Alerts', error: checkError });
    }

    if (checkResult.rows.length === 0) {
       res.status(404).json({ message: 'Alert Not Found' });
    }
    
    const deleteAlertQuery = `DELETE FROM ems.ems_alerts WHERE name = $1`;
    db.query(deleteAlertQuery, [name], (deleteError, deleteResult) => {
      if (deleteError) {
         res.status(500).json({ message: 'Error while deleting Alert', error: deleteError });
      }

      if (deleteResult.rowCount === 0) {
         res.status(404).json({ message: 'Alert Not Found' ,deleteError});
      }

       res.status(200).json({ message: 'Alert Deleted Successfully' });
    });
  });
}


function addShift(req,res){
  //const shiftCode = req.params.shiftCode;
  const { shiftCode ,shiftName, startTime, endTime, graceTime } = req.body;
  const insertShiftQuery  = `INSERT INTO ems.ems_day_shift (shift_code, shift_name, start_time, end_time, grace_time_min) VALUES($1,$2,$3,$4,$5)`;

  db.query(insertShiftQuery , [shiftCode, shiftName, startTime, endTime, graceTime] , (insertError , insertResult) =>{
    if(insertError){
      console.log(insertError);
      return res.status(402).json({message:'Error while inserting data',insertError});
    }
    res.status(200).json({message:' shift added successfully', insertResult});
  });
}

function getDay_Shift(req, res) {
  const shift_code = req.params.shift_code;
  const getDayShiftQuery = `SELECT * FROM ems.ems_day_shift WHERE shift_code = $1`;
  
  db.query(getDayShiftQuery, [shift_code], (getError, getResult) => {
    if (getError) {
      
      return res.status(401).json({ message: 'Error while Fetching Data', error: getError });
    }

    if (getResult.rows.length === 0) {
      return res.status(404).json({ message: 'No data Found' });
    }

    res.json({ getDay_Shift : getResult.rows });
  });
}


function delete_shift(req, res) {
  const shift_code = req.params.shift_code;

  const checkShiftQuery = `SELECT * FROM ems.ems_day_shift WHERE shift_code = $1`;
  db.query(checkShiftQuery, [shift_code], (checkError, checkResult) => {
    if (checkError) {
       res.status(500).json({ message: 'Error while checking shifts', error: checkError });
    }

    if (checkResult.rows.length === 0) {
       res.status(404).json({ message: 'Shift Not Found' });
    }
    
    const deleteShiftQuery = `DELETE FROM ems.ems_day_shift WHERE shift_code = $1`;
    db.query(deleteShiftQuery, [shift_code], (deleteError, deleteResult) => {
      if (deleteError) {
         res.status(500).json({ message: 'Error while deleting shift', error: deleteError });
      }

      if (deleteResult.rowCount === 0) {
         res.status(404).json({ message: 'shift Not Found' ,deleteError});
      }

       res.status(200).json({ message: 'Shift Deleted Successfully' });
    });
  });
}


// function addUserData(req,res){
//   //const shiftCode = req.params.shiftCode;
//   const checkUserNameQuery = `SELECT * FROM ems.ems_users WHERE  username = $1`;
//   const { username , firstname , lastname , companyid , companyemail , contactno , usertype , personalemail , password , designation  } = req.body;

//   const insertUserQuery  = `INSERT INTO ems.ems_users ( username , firstname , lastname , companyid , companyemail , contactno , userType , personalemail , password , designation ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;

//   db.query(checkUserNameQuery, [username] , (checkUserNameError, checkUserNameResult) => {
//     if ( checkUserNameError ){
//         return res.status(401).json({message: 'Eroor while checking username',checkUserNameError}); 
//     }
//     if ( checkUserNameResult.length != 0 ){
//        return  res.status(402).json({message : 'User already Exists'});
//     }
//   })

//   bcrypt.hash(password , 10 , (hashError , hashPassword) =>{
//     if (hashError){
//        return res.status(401).json({message: 'Error while hashing passward',hashError});
//     }

//   db.query(insertUserQuery , [username , firstname , lastname , companyid , companyemail , contactno , usertype , personalemail , hashPassword , designation] , (insertError , insertResult) =>{
//     if(insertError){
//       console.log(insertError);
//       return res.status(402).json({message:'Error while inserting data',insertError});
//     }
//     res.status(200).json({message:' user added successfully', insertResult});
//   });
//   });
// }

function editfeeders(req, res) {
  const feederid = req.params.feeder_id;
  const { name , location , deviceuid , device , group_id , virtual_group_id , group_name , virtual_group_name } = req.body;

  const deviceCheckQuery = 'SELECT * FROM ems.ems_feeder WHERE deviceuid = $1';

  db.query(deviceCheckQuery, [feederid], (error, deviceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      // Log the er
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deviceCheckResult.length === 0) {
        console.log('Device not found!');
        // Log the end of the function execution with an error message
        return res.status(400).json({ message: 'Device not found!' });
      }

      const devicesQuery = 'UPDATE ems.ems_feeder SET   name = $1 , location = $2 , deviceuid = $3 , device = $4 , group_id = $5  , virtual_group_id = $6 ,group_name = $7 , virtual_group_name = $8  WHERE  feeder_id = $9';

      db.query(devicesQuery, [name , location , deviceuid , device , group_id , virtual_group_id , group_name , virtual_group_name , feederid], (error, devices) => {
        if (error) {
          console.error('Error updating device:', error);
          // Log the error
          logExecution('editDevice', tenantId, 'ERROR', 'Error updating device');
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.json({ message: 'Device Updated Successfully' });
        console.log(devices);
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}





module.exports = {
	userDevices,
  editDevice,
  companyDetails,
  personalDetails,
  updatePassword,
  getDataByCustomDate,
  filter,
  getDeviceDetails,
  getUserData,
  getUserMessages,
  fetchCompanyUser,
  addDevice,
  temp,
  feeder,
  feederParametrised,
  feederHarmonic,
  getdata,
  parametersFilter,
  addDeviceTrigger,
  getUserDetails,
  edituser,
  deleteuser,
  getFeederDetails,
  Intervalfeeder,
  editfeeder,
  alerteventDetails,
  editalert,
  piechart,
  fetchmaxdemand,
  feederBargraph,
  fetchHighestKva,
  fetchLowestPF,
  // addUserData,
  getUser_Data,
  delete_user,
  // edit_user,
  getFeederData,
  delete_feeder,
  delete_alerts,
  getDay_Shift,
  getAlerts,
  addShift,
  delete_shift,
  editfeeders,
};

// `SELECT  name = $1 , location = $2 , deviceuid = $3 , device = $4 , group_id = $5 , virtual_group_id = $6 , group_name = $7 , virtual_group_name = $8 FROM ems.ems_users WHERE freeder_id = $9 ;`