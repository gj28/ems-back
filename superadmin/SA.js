const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const CircularJSON = require('circular-json');
const secure = require('../token/secure');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function parameter(req, res) {
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
        FROM ems.ems_actual_data
        WHERE timestamp >= NOW() - INTERVAL '${duration}'
        AND deviceid = $1
      `;

      db.query(sql, [deviceid], (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const data = results.rows;
        const responseData = [];

        data.forEach(row => {
          const entry = {
            timestamp: row.timestamp,
          };
          validParameters.forEach(param => {
            entry[param] = parseFloat(row[param]);
          });
          responseData.push(entry);
        });

        res.json(responseData);
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
    

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

// function SumData(req, res) {
//   try {
//     const query = 'SELECT * FROM ems.sum_table ORDER BY id DESC LIMIT 1';
//     db.query(query, (error, result) => {
//       if (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).json({ message: 'Internal server error' });
//         return;
//       }
//       const latestSumData = result.rows[0];

//       res.json({ latestSumData });
//     });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

function dwSumData(req, res) {
  try {
    const query = 'SELECT * FROM ems.dwsum_table ORDER BY id DESC LIMIT 1';
    db.query(query, (error, result) => {
      if (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      const latestSumData = result.rows[0];

      res.json({ latestSumData });
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
function kwSumData(req, res) {
  try {
    const { deviceid } = req.params;

    const subquery = `
      SELECT MAX(id) as max_id, deviceid
      FROM ems.sum_kw
      WHERE deviceid = $1
      GROUP BY deviceid
    `;

    const query = `
      SELECT s.*
      FROM ems.sum_kw s
      JOIN (${subquery}) m
      ON s.id = m.max_id
      WHERE s.deviceid = $1
    `;

    db.query(query, [deviceid], (error, result) => {
      if (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      const latestSumData = result.rows;

      res.json({ latestSumData });
    });
  } catch (error) {
    console.error('Error fetching data:', error);
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
  
      const sql = `SELECT * FROM ems.api_usage WHERE created_time >= NOW() - INTERVAL '${duration}'`;
      
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
      const {
        EntryId,
        DeviceUID,
        DeviceLocation,
        DeviceName,
        CompanyEmail,
        CompanyName,
        SMS,
        email,
        type,
      } = req.body;
  
      const createDeviceQuery = `
        INSERT INTO tms_devices (
          EntryId, DeviceUID, DeviceLocation, DeviceName, CompanyEmail, CompanyName, SMS, email, type, "endDate"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + interval '1 year')
      `;
  
      const values = [
        EntryId,
        DeviceUID,
        DeviceLocation,
        DeviceName,
        CompanyEmail,
        CompanyName,
        SMS,
        email,
        type,
      ];
  
      db.query(createDeviceQuery, values, (error, result) => {
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

    // function dev(req, res) {
    //   const CompanyEmail = req.params.CompanyEmail;
    //   try {
    //     const query = 'SELECT * FROM ems.ems_devices where companyemail = $1';
    //     db.query(query, [CompanyEmail], (error, result) => {
    //       if (error) {
    //         throw new Error('Error fetching users');
    //       }
    
    //       res.status(200).json(result.rows);
    //     });
    //   } catch (error) {
    //     console.error('Error fetching devices:', error);
    //     res.status(500).json({ message: 'Internal server error' });
    //   }
    // }
    // function dev(req, res) {
    //   const CompanyEmail = req.params.CompanyEmail;
    //   try {
    //     const query = 'SELECT * FROM ems.ems_devices where companyemail = $1';
    //     db.query(query, [CompanyEmail], (error, result) => {
    //       if (error) {
    //         throw new Error('Error fetching users');
    //       }
    
    //       res.status(200).json(result.rows);
    //     });
    //   } catch (error) {
    //     console.error('Error fetching devices:', error);
    //     res.status(500).json({ message: 'Internal server error' });
    //   }
    // }


    function SumData(req, res) {
      try {
        const { deviceid } = req.params;
    
        const subquery = `
          SELECT MAX(id) as max_id, deviceid
          FROM ems.sum_kw
          WHERE deviceid = $1
          GROUP BY deviceid
        `;
    
        const query = `
          SELECT s.*
          FROM ems.sum_kw s
          JOIN (${subquery}) m
          ON s.id = m.max_id
          WHERE s.deviceid = $1
        `;
    
        db.query(query, [deviceid], (error, result) => {
          if (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          const latestSumData = result.rows;
    
          res.json({ latestSumData });
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
    
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

    function deleteUser(req, res) {
      const { userid } = req.params;
    
      const checkQuery = 'SELECT * FROM ems.ems_users WHERE userid = $1';
    
      db.query(checkQuery, [userid], (checkError, checkResult) => {
        if (checkError) {
          console.error(`Error checking user existence:`, checkError);
          return res.status(500).json({ message: 'Error checking user existence' });
        }
    
        if (!checkResult || checkResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        const userToArchive = checkResult.rows[0];
        const deleteQuery = 'DELETE FROM ems.ems_users WHERE userid = $1';
    
        db.query(deleteQuery, [userid], (deleteError, deleteResult) => {
          if (deleteError) {
            console.error(`Error deleting user:`, deleteError);
            return res.status(500).json({ message: 'Error deleting user' });
          }
    
          if (!deleteResult || deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
          }
    
          const archiveQuery =
            'INSERT INTO ems.ems_archived (userid, username, firstname, lastname, companyid, companyemail, contactno, usertype, personalemail, "password", designation, verificationtoken, verified, block, is_online) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)';
    
          db.query(
            archiveQuery,
            [
              userToArchive.userid,
              userToArchive.username,
              userToArchive.firstname,
              userToArchive.lastname,
              userToArchive.companyid,
              userToArchive.companyemail,
              userToArchive.contactno,
              userToArchive.usertype,
              userToArchive.personalemail,
              userToArchive.password,
              userToArchive.designation,
              userToArchive.verificationtoken,
              userToArchive.verified,
              userToArchive.block,
              userToArchive.is_online,
            ],
            (archiveError, archiveResult) => {
              if (archiveError) {
                console.error(`Error archiving user:`, archiveError);
              }
    
              const successMessage = 'User deleted and archived successfully';
              res.status(200).json({ message: successMessage });
            }
          );
        });
      });
    }
    

    function recoverUser(req, res) {
      const { userid } = req.params;
    
      const checkArchiveQuery = 'SELECT * FROM ems.ems_archive WHERE userid = $1';
    
      db.query(checkArchiveQuery, [userid], (archiveCheckError, archiveCheckResult) => {
        if (archiveCheckError) {
          console.error(`Error checking user existence in archive:`, archiveCheckError);
          return res.status(500).json({ message: 'Error checking user existence in archive' });
        }
    
        if (!archiveCheckResult || archiveCheckResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found in the archive' });
        }
    
        const userToRecover = archiveCheckResult.rows[0];
    
        const deleteFromArchiveQuery = 'DELETE FROM ems.ems_archive WHERE userid = $1';
    
        db.query(deleteFromArchiveQuery, [userid], (deleteFromArchiveError, deleteFromArchiveResult) => {
          if (deleteFromArchiveError) {
            console.error(`Error deleting user from archive:`, deleteFromArchiveError);
            return res.status(500).json({ message: 'Error deleting user from archive' });
          }
    
          if (!deleteFromArchiveResult || deleteFromArchiveResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found in the archive' });
          }
    
          const recoverQuery =
            'INSERT INTO ems.ems_users (userid, username, firstname, lastname, companyid, companyemail, contactno, usertype, personalemail, "password", designation, verificationtoken, verified, block, is_online) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)';
    
          db.query(
            recoverQuery,
            [
              userToRecover.userid,
              userToRecover.username,
              userToRecover.firstname,
              userToRecover.lastname,
              userToRecover.companyid,
              userToRecover.companyemail,
              userToRecover.contactno,
              userToRecover.usertype,
              userToRecover.personalemail,
              userToRecover.password,
              userToRecover.designation,
              userToRecover.verificationtoken,
              userToRecover.verified,
              userToRecover.block,
              userToRecover.is_online,
            ],
            (recoverError, recoverResult) => {
              if (recoverError) {
                console.error(`Error recovering user:`, recoverError);
                
                return res.status(500).json({ message: 'Error recovering user' });
              }
    
              const successMessage = 'User recovered and added back to the main table successfully';
              res.status(200).json({ message: successMessage });
            }
          );
        });
      });
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
  userByCompanyname,
  parameter,
  SumData,
  kwSumData,
 // dev,
  dwSumData,
  Block,  
  recoverUser,
  deleteUser,
  

};