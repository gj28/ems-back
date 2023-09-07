const db = require('./db');

function DeviceIP(limit, callback) {
  const selectQuery = `
    WITH ranked_devices AS (
      SELECT
        deviceuid,
        ip_address,
        "timestamp",
        ROW_NUMBER() OVER (PARTITION BY deviceuid ORDER BY "timestamp" DESC) AS rank
      FROM
        ems.ems_actual_data
    )
    SELECT
      deviceuid,
      ip_address,
      "timestamp"
    FROM
      ranked_devices
    WHERE
      rank = 1
    LIMIT $1
  `;

  db.query(selectQuery, [limit], (error, result) => {
    if (error) {
      console.error('Error fetching device data:', error);
      callback(error, null);
    } else {
      const devices = result.rows;
      callback(null, devices);
    }
  });
}

const limit = 9;

function runCode() {
  DeviceIP(limit, (error, devices) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Latest Device Data:');
      devices.forEach(device => {
        console.log(`Device ID: ${device.deviceuid}, IP Address: ${device.ip_address}, Timestamp: ${device.timestamp}`);
      });
    }
    setTimeout(runCode, 5000); 
  });
}

runCode();



// const db = require('./db');

// function DeviceIP(limit, callback) {
//   const selectQuery = `
//     WITH ranked_devices AS (
//       SELECT
//         deviceuid,
//         ip_address,
//         "timestamp",
//         ROW_NUMBER() OVER (PARTITION BY deviceuid ORDER BY "timestamp" DESC) AS rank
//       FROM
//         ems.ems_actual_data
//     )
//     SELECT
//       deviceuid,
//       ip_address,
//       "timestamp"
//     FROM
//       ranked_devices
//     WHERE
//       rank = 1
//     LIMIT $1
//   `;

//   db.query(selectQuery, [limit], (error, result) => {
//     if (error) {
//       console.error('Error fetching device data:', error);
//       callback(error, null);
//     } else {
//       const devices = result.rows;
//       callback(null, devices);
//     }
//   });
// }

// const limit = 9;
// DeviceIP(limit, (error, devices) => {
//   if (error) {
//     console.error('Error:', error);
//   } else {
//     console.log('Latest Device Data:');
//     devices.forEach(device => {
//       console.log(`Device ID: ${device.deviceuid}, IP Address: ${device.ip_address}, Timestamp: ${device.timestamp}`);
//     });
//   }
// });
