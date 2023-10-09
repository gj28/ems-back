const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');



function alarms(req, res) {
  try {
    const query = 'SELECT * FROM ems.alarms';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function fetchAllUsers(req, res) {
  try {
    const query = 'SELECT * FROM ems.ems_users';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

  function fetchAllDevices(req, res) {
    try {
      const query = 'SELECT * FROM ems.ems_devices';
      db.query(query, (error, result) => {
        if (error) {
          console.error('Error fetching devices:', error);
          res.status(500).json({ message: 'Error fetching devices', error: error.message });
          return;
        }
        
        const devices = result.rows; // Assuming your devices are in rows
        
        res.json({ devices });
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
 
  function apilogs(req, res) {
    try {
      const timeInterval = req.params.interval;
      if (!timeInterval) {
        return res.status(400).json({ message: 'Invalid time interval' });
      }
  
      let duration;
      switch (timeInterval) {
        case '10hour':
          duration = '10 hours';
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
  
      const sql = `SELECT * FROM ems.api_usage WHERE timestamp >= NOW() - INTERVAL '${duration}'`;
      
      db.query(sql, (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ data: results.rows });
      });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  
  function userByCompanyname(req, res) {
    try {
      const company_name = req.params.company_name;
      const getDeviceByIdQuery = 'SELECT firstname, lastname, companyname, companyemail, contactno, location, usertype, personalemail FROM ems.ems_users WHERE companyname = $1';
  
      db.query(getDeviceByIdQuery, [company_name], (error, result) => {
        if (error) {
          console.error('Error fetching user:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        res.json({ user: result.rows}); // Assuming you expect a single user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  

  //DEVICES
  function addDevice(req, res) {
    try {
      const { EntryId, DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName } = req.body;
      const createDeviceQuery = 'INSERT INTO ems_devices (entryid, deviceuid, devicelocation, devicename, companyemail, companyname) VALUES (?, ?, ?, ?, ?, ?)';
  
      db.query(createDeviceQuery, [EntryId, DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName], (error, result) => {
        if (error) {
          console.error('Error adding device:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        res.json({ message: 'Device added successfully' });
      });
    } catch (error) {
      console.error('Error adding device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  function getDeviceByUID(req, res) {
    try {
      const deviceUID = req.params.deviceUID;
      const getDeviceByIdQuery = 'SELECT * FROM ems.ems_devices WHERE deviceuid = ?';
  
      db.query(getDeviceByIdQuery, [deviceUID], (error, result) => {
        if (error) {
          console.error('Error fetching device:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        if (result.length === 0) {
          return res.status(404).json({ message: 'Device not found' });
        }
  
        res.json(result[0]);
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  function updateDevice(req, res) {
    try {
      const deviceUID = req.params.deviceUID;
      const { EntryId, DeviceLocation, DeviceName, CompanyEmail, CompanyName } = req.body;
  
      // Check if EntryId is provided and not equal to the existing EntryId
      if (EntryId !== undefined && EntryId !== deviceUID) {
        return res.status(400).json({ message: 'Cannot update primary key (EntryId)' });
      }
  
      // SQL query for updating a device in PostgreSQL
      const updateDeviceQuery = `
        UPDATE ems.ems_devices
        SET devicelocation = $1, devicename = $2, companyemail = $3, companyname = $4
        WHERE deviceuid = $5
      `;
  
      const values = [DeviceLocation, DeviceName, CompanyEmail, CompanyName, deviceUID];
  
      // Execute the SQL query using the connection pool
      db.query(updateDeviceQuery, values, (error, result) => {
        if (error) {
          console.error('Error updating device:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
  
        if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Device not found' });
        }
  
        res.json({ message: 'Device updated successfully' });
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


 
function fetchCompanyDetails(req, res) {
  const CompanyEmail = req.params.CompanyEmail;
  const companyQuery = 'SELECT companyname, contactno, location, designation FROM ems.ems_users WHERE companyemail = $1';

  db.query(companyQuery, [CompanyEmail], (error, companyResult) => {
    if (error) {
      console.error('Error fetching company details:', error);
      return res.status(500).json({ message: 'Error fetching company details', error: error.message });
    }

    if (companyResult.rows.length === 0) {
      console.log('Company not found for Email:', CompanyEmail);
      return res.status(404).json({ message: 'Company not found!' });
    }

    const company = companyResult.rows[0];
    res.json({ companyDetails: company });
  });
}

  // function fetchCounts(req, res) {
  //   const CompanyEmail = req.params.CompanyEmail;
  //   const SuperAdminCountQuery = 'SELECT COUNT(*) AS standardUserCount FROM ems.ems_users WHERE companyemail = $1 AND usertype = "SuperAdmin"';
  //   const adminCountQuery = 'SELECT COUNT(*) AS adminCount FROM ems.ems_users WHERE companyemail = $1 AND usertype = "Admin"';
  //   const deviceCountQuery = 'SELECT COUNT(*) AS deviceCount FROM ems.ems_devices WHERE companyemail = $1';
  //   const userCountQuery = 'SELECT COUNT(*) AS userCount FROM ems.ems_users WHERE companyemail = $1';
  
  //   try {
  //     db.query(SuperAdminCountQuery, [CompanyEmail], (error, standardUserResult) => {
  //       if (error) {
  //         console.error('Error fetching standard user count:', error);
  //         throw new Error('Internal server error');
  //       }
  
  //       const SuperAdminCount = standardUserResult[0].SuperAdminCount;
  
  //       db.query(adminCountQuery, [CompanyEmail], (error, adminResult) => {
  //         if (error) {
  //           console.error('Error fetching admin count:', error);
  //           throw new Error('Internal server error');
  //         }
  
  //         const adminCount = adminResult[0].adminCount;
  
  //         db.query(deviceCountQuery, [CompanyEmail], (error, deviceResult) => {
  //           if (error) {
  //             console.error('Error fetching device count:', error);
  //             throw new Error('Internal server error');
  //           }
  
  //           const deviceCount = deviceResult[0].deviceCount;
  
  //           db.query(userCountQuery, [CompanyEmail], (error, userResult) => {
  //             if (error) {
  //               console.error('Error fetching user count:', error);
  //               throw new Error('Internal server error');
  //             }
  
  //             const userCount = userResult[0].userCount;
  
  //             res.json({
  //               SuperAdminCount: SuperAdminCount,
  //               adminCount: adminCount,
  //               deviceCount: deviceCount,
  //               userCount: userCount,
  //             });
  //           });
  //         });
  //       });
  //     });
  //   } catch (error) {
  //     console.error('Error occurred:', error);
  //     res.status(500).json({ message: 'Internal server error' });
  //   }
  // }
  
  
  function usermanagement(req, res) {
    const userQuery = 'SELECT userid, username, companyname, designation, personalemail, location, contactno , block FROM ems.ems_users';
  
    db.query(userQuery, (error, userResult) => {
      if (error) {
        console.error('Error fetching user details:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
  
      if (userResult.rows.length === 0) {
        console.log('Users not found!');
        return res.status(404).json({ message: 'Users not found!' });
      }
  
      const users = userResult.rows;
      res.json({ userDetails: users });
    });
  }
  

  function logExecution(functionName, tenantId, status, message) {
    const createdTime = new Date().toISOString(); 
    const entity_type = 'SenseLive';
    const entity_id = tenantId; 
    const transport = 'ENABLED'; 
    const db_storage = 'ENABLED'; 
    const re_exec = 'ENABLED'; 
    const js_exec = 'ENABLED';
    const email_exec = 'ENABLED';
    const sms_exec = 'ENABLED'; 
    const alarm_exec = 'ENABLED';
  
    const query = `
      INSERT INTO ems.api_usage (created_time, tenant_id, entity_type, entity_id, transport, db_storage, re_exec, js_exec, email_exec, sms_exec, alarm_exec, status, message)
      VALUES ($1, $2, $3, $4, $6, $7, $8, $9, $10, $11, $12, $13, $14);
    `;
  
    db.query(query, [
      createdTime,
      tenantId,
      entity_type,
      entity_id,
      transport,
      db_storage,
      re_exec,
      js_exec,
      email_exec,
      sms_exec,
      alarm_exec,
      status,
      message,
    ], (error, results) => {
      if (error) {
        console.error(`Error logging execution of function '${functionName}':`, error);
      } else {
        console.log(`Function '${functionName}' executed and logged successfully.`);
      }
    });
  }
//   
  
    function devicelogs(req, res) {
      try {
        const query = 'SELECT * FROM ems.ems_trigger';
        db.query(query, (error, rows) => {
          if (error) {
            throw new Error('Error fetching logs');
          }
          res.json({ logs: rows });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  

function userInfo(req, res) {
  try {
    const query = 'SELECT * FROM ems.user_info';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function fetchLogs(req, res) {
  try {
    const timeInterval = req.params.interval;
    if (!timeInterval) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    let duration;
    switch (timeInterval) {
      case '10hour':
        duration = '10 hours';
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

    const sql = `SELECT * FROM ems.logs WHERE timestamp >= NOW() - INTERVAL '${duration}'`;
    
    db.query(sql, (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json({ data: results.rows });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function companyinfo(req, res) {
  try {
    const query = 'SELECT * FROM ems.company_info';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
    
  
  
function allnotification(req, res) {
  try {
    const query = 'SELECT * FROM ems.info_twi';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function unreadnotification(req, res) {
  try {
    const query = 'SELECT * FROM ems.info_twi where isread=0';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      const logs = result.rows;
      
      res.json({ logs });
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
//     function extractIPv4(ipv6MappedAddress) {
//       const parts = ipv6MappedAddress.split(':');
//       return parts[parts.length - 1];
//     }
    
//     function log(req, res, next) {
//       const { method, url, body, ip } = req;
//       const timestamp = new Date().toISOString();
//       const entity = body.userType || 'User';
//       const entityName = body.companyName || 'SenseLive';
//       const user = req.body.Username || req.body.companyEmail || 'N/A';
//       const userType = req.body.designation || 'std';
//       const type = method; 
//       const status = res.statusCode >= 200 && res.statusCode < 400 ? 'successful' : 'failure';
//       const details = `URL: ${url}`;
      
//       const ipv4Address = extractIPv4(ip);
    
//       const logMessage = `${timestamp} | IP: ${ipv4Address} | Entity Type: ${entity} | Entity Name: ${entityName} | User: ${user} (${userType}) | Type: ${type} | Status: ${status} | Details: ${details}`;
    
//       db.query('INSERT INTO tmp.logs (timestamp, ip, entity_type, entity_name, username, user_type, request_type, status, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//         [timestamp, ipv4Address, entity, entityName, user, userType, type, status, details],
//         function (error, results) {
//           if (error) {
//             console.error('Error writing to database:', error);
//           } else {
//             //console.log('Log data inserted into the database');
//           }
//           next();
//         });
//     }
    
//     function fetchLogs(req, res) {
//       try {
//         const query = 'SELECT * FROM logs';
//         db.query(query, (error, rows) => {
//           if (error) {
//             throw new Error('Error fetching logs');
//           }
//           res.json({ logs: rows });
//         });
//       } catch (error) {
//         console.error('Error fetching logs:', error);
//         res.status(500).json({ message: 'Internal server error' });
//       }
//     }
//     function graph1(req, res) {
//       try {
//         const query = 'SELECT * FROM tmp';
//         db.query(query, (error, rows) => {
//           if (error) {
//             throw new Error('Error fetching logs');
//           }
//           res.json({ logs: rows });
//         });
//       } catch (error) {
//         console.error('Error fetching logs:', error);
//         res.status(500).json({ message: 'Internal server error' });
//       }
//     }
//     function graph2(req, res) {
//       try {
//         const query = 'SELECT * FROM transport';
//         db.query(query, (error, rows) => {
//           if (error) {
//             throw new Error('Error fetching logs');
//           }
//           res.json({ logs: rows });
//         });
//       } catch (error) {
//         console.error('Error fetching logs:', error);
//         res.status(500).json({ message: 'Internal server error' });
//       }
//     }
//     function graph3(req, res) {
//       try {
//         const query = 'SELECT * FROM transport';
//         db.query(query, (error, rows) => {
//           if (error) {
//             throw new Error('Error fetching logs');
//           }
//           res.json({ logs: rows });
//         });
//       } catch (error) {
//         console.error('Error fetching logs:', error);
//         res.status(500).json({ message: 'Internal server error' });
//       }
//     }
    
//     function graph4(req, res) {
//       try {
//         const query = 'SELECT Date, TransportValues FROM transport';
//         db.query(query, (error, rows) => {
//           if (error) {
//             throw new Error('Error fetching logs');
//           }
    
//           // Transform rows into the desired format
//           const formattedData = rows.map(row => ({
//             x: new Date(row.Date).toISOString(), // Convert the Date to an ISO 8601 timestamp
//             y: parseInt(row.TransportValues, 10) // Parse the TransportValues as an integer
//           }));
    
//           // Send the formatted data as the response
//           res.json({ data: formattedData });
//         });
//       } catch (error) {
//         console.error('Error fetching logs:', error);
//         res.status(500).json({ message: 'Internal server error' });
//       }
//     }
    
    
    

// //device_info table

// const maxEntriesToKeep = 10;
// const batchSize = 50; // Number of data sets to process before deleting old entries
// let processedDataSets = 0;

// function DeviceIP(limit, callback) {
//   const selectQuery = `
//     SELECT
//       deviceuid,
//       ip_address,
//       status,
//       timestamp
//     FROM
//       actual_data
//     ORDER BY
//       timestamp DESC
//     LIMIT ?
//   `;

//   db.query(selectQuery, [limit], (error, results) => {
//     if (error) {
//       console.error('Error fetching device data:', error);
//       callback(error, null);
//     } else {
//       const devices = results;
//       callback(null, devices);
//     }
//   });
// }

// function DeviceInfo(device) {
//   const insertQuery = `
//     INSERT INTO device_info (deviceuid, ip_address, status, timestamp, company_name, company_location)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;

//   const { deviceuid, ip_address, status, timestamp } = device;
//   const statusToInsert = status || 'offline';
//   const company_name = "Senselive";
//   const company_location = "Nagpur";

//   db.query(insertQuery, [deviceuid, ip_address, statusToInsert, timestamp, company_name, company_location], (error, result) => {
//     if (error) {
//       console.error('Error inserting device data:', error);
//     } else {
//       // Update the device object with default values
//       device.status = statusToInsert;
//       device.company_name = company_name;
//       device.company_location = company_location;

//       processedDataSets++; // Increment the processed data sets count

//       if (processedDataSets % batchSize === 0) {
//         // When we reach a multiple of batchSize, delete old entries
//         deleteOldDeviceInfo(maxEntriesToKeep);
//       }

//       // Update ems_trigger with the same device data
//       updateemsTrigger(device);
//     }
//   });
// }

// function deleteOldDeviceInfo(maxEntries) {
//   const selectIdsQuery = `
//     SELECT id
//     FROM device_info
//     ORDER BY timestamp DESC
//     LIMIT ?
//   `;

//   db.query(selectIdsQuery, [maxEntries], (error, results) => {
//     if (error) {
//       console.error('Error selecting IDs to keep:', error);
//     } else {
//       const idsToKeep = results.map((result) => result.id);

//       if (idsToKeep.length > 0) {
//         const deleteQuery = `
//           DELETE FROM device_info
//           WHERE id NOT IN (${idsToKeep.join(',')})
//         `;

//         db.query(deleteQuery, (deleteError, deleteResult) => {
//           if (deleteError) {
//             console.error('Error deleting old device data:', deleteError);
//           } else {
//             //console.log('Deleted old device data from device_info table');
//           }
//         });
//       }
//     }
//   });
// }

// function updateemsTrigger(device) {
//   const updateQuery = `
//     UPDATE ems_trigger
//     SET
//       ip_address = ?,
//       status = ?,
//       timestamp = ?,
//       company_name = ?,
//       company_location = ?
//     WHERE deviceuid = ?
//   `;

//   const {
//     ip_address,
//     status,
//     timestamp,
//     company_name,
//     company_location,
//     deviceuid
//   } = device;

//   db.query(
//     updateQuery,
//     [ip_address, status, timestamp, company_name, company_location, deviceuid],
//     (error, result) => {
//       if (error) {
//         console.error('Error updating ems_trigger:', error);
//       } else {
//         //console.log(`Updated ems_trigger for device with deviceuid: ${deviceuid}`);
//       }
//     }
//   );
// }

// const limit = 9;

// function runCode() {
//   DeviceIP(limit, (error, devices) => {
//     if (error) {
//       console.error('Error:', error);
//     } else {
//       devices.forEach((device) => {
//         DeviceInfo(device);
//       });
//     }
//     setTimeout(runCode, 10000);
//   });
// }

// runCode();
    
    function deleteDevice(req, res) {
      try {
        const deviceUID = req.params.deviceUID;
        const deleteDeviceQuery = 'DELETE FROM ems.ems_devices WHERE deviceuid = $1';
    
        db.query(deleteDeviceQuery, [deviceUID], (error, result) => {
          if (error) {
            console.error('Error deleting device:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }
    
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Device not found' });
          }
    
          res.json({ message: 'Device deleted successfully' });
        });
      } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }

    function removeUser(req, res) {
      const userId = req.params.userId; 
      const getUserQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';
      db.query(getUserQuery, [userId], (error, userResult) => {
        if (error) {
          console.error('Error during user retrieval:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
    
        try {
          if (userResult.length === 0) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
          }
          const deleteUserQuery = 'DELETE FROM ems.ems_users WHERE userid = $1';
          db.query(deleteUserQuery, [userId], (error, deleteResult) => {
            if (error) {
              console.error('Error during user deletion:', error);
              return res.status(500).json({ message: 'Internal server error' });
            }
    
            try {
              console.log('User deleted successfully');
              res.json({ message: 'User deleted successfully' });
            } catch (error) {
              console.error('Error responding to user deletion:', error);
              res.status(500).json({ message: 'Internal server error' });
            }
          });
        } catch (error) {
          console.error('Error during user removal:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    }
    function companyinfo(req, res) {
      try {
        const query = 'SELECT * FROM ems.company_info';
        db.query(query, (error, result) => {
          if (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          
          const logs = result.rows;
          
          res.json({ logs });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
   

    function DeviceTriggerlogs(req, res) {
      try {
        const { deviceId, triggerValue } = req.body;
    
        // Check if trigger condition is met (e.g., triggerValue > someThreshold)
        if (triggerValue > someThreshold) {
          // Insert a log into the database
          const logEntry = {
            device_id: deviceId,
            trigger_value: triggerValue,
            timestamp: new Date(),
          };
    
          const sql = 'INSERT INTO logs (device_id, trigger_value, timestamp) VALUES ($1, $2, $3)';
    
          pool.query(sql, [logEntry.device_id, logEntry.trigger_value, logEntry.timestamp], (error, result) => {
            if (error) {
              console.error('Error inserting log:', error);
              res.status(500).json({ message: 'Internal server error' });
            } else {
              console.log('Log inserted successfully.');
              res.status(200).json({ message: 'Log inserted successfully.' });
            }
          });
        } else {
          res.status(200).json({ message: 'Trigger condition not met.' });
        }
      } catch (error) {
        console.error('Error handling device trigger:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    function graph4(req, res) {
      try {
        const query = 'SELECT * FROM ems.graph1';
        db.query(query, (error, result) => {
          if (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          
          const logs = result.rows;
          
          res.json({ logs });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }

    function graph3(req, res) {
      try {
        const query = 'SELECT * FROM ems.graph1';
        db.query(query, (error, result) => {
          if (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          
          const logs = result.rows;
          
          res.json({ logs });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }

    function graph2(req, res) {
      try {
        const query = 'SELECT * FROM ems.graph1';
        db.query(query, (error, result) => {
          if (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          
          const logs = result.rows;
          
          res.json({ logs });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }

    function graph1(req, res) {
      try {
        const query = 'SELECT * FROM ems.graph1';
        db.query(query, (error, result) => {
          if (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          
          const logs = result.rows;
          
          res.json({ logs });
        });
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
module.exports = {
  fetchAllUsers,
  fetchAllDevices,
  fetchCompanyDetails,
  addDevice,
  getDeviceByUID,
  updateDevice,
  //fetchCounts,
  usermanagement,
  logExecution,
  apilogs,
  devicelogs,
  userInfo,
 companyinfo,
  alarms,
  allnotification,
  unreadnotification,
  // log, 
  fetchLogs,
  deleteDevice,
   removeUser,
  graph1,
  graph2,
  graph3,
  graph4,
  userByCompanyname
};