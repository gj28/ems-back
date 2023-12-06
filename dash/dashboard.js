
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

function feeder(req, res) {
  const CompanyName = req.params.CompanyName;
  const Userid = req.query.Userid;

  try {
    let query;

    if (Userid) {
      query = 'SELECT * FROM ems.ems_energy_usage WHERE group_name = $1 and virtual_group = $2';
      db.query(query, [CompanyName, Userid], handleResponse(res));
    } else {
      query = 'SELECT * FROM ems.ems_energy_usage where group_name = $1';
      db.query(query, [CompanyName], handleResponse(res));
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function handleResponse(res) {
  return (error, result) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    res.status(200).json(result.rows);
  };
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
      WHERE table_name = 'active'
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
        SELECT "timestamp", ${parameterColumns}
        FROM ems.active
        WHERE timestamp >= NOW() - INTERVAL '${duration}'
        AND deviceid = $1`;

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

      res.status(200).json(userDetail);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).jsonno({ message: 'Internal server error' });
  }
}



//feeder configuration


function getFeederDetails(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const feederDetailsQuery = 'SELECT * FROM ems.ems_feeder WHERE deviceuid = $1';
    db.query(feederDetailsQuery, [deviceId], (error, feederDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (feederDetail.length === 0) {
        return res.status(404).json({ message: 'Feeder details not found' });
      }

      res.status(200).json(feederDetail);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

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

      res.status(200).json(alerteventsDetail);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
  getdata,
  parametersFilter,
  getUserDetails,
  getFeederDetails,
  alerteventDetails,
};