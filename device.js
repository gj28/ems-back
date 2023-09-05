const db = require('./db');

function DeviceIP(limit, callback) {
  const selectQuery = `
    SELECT DISTINCT ON (deviceuid)
      deviceuid, ip_address
    FROM
      ems.ems_actual_data
    ORDER BY
      deviceuid, "timestamp" DESC
    LIMIT $1
  `;

  db.query(selectQuery, [limit], (error, result) => {
    if (error) {
      console.error('Error fetching device IDs and IP addresses:', error);
      callback(error, null);
    } else {
      const devices = result.rows;
      callback(null, devices);
    }
  });
}

const limit = 9;
DeviceIP(limit, (error, devices) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Device IDs and IP Addresses:');
    devices.forEach(device => {
      console.log(`Device ID: ${device.deviceuid}, IP Address: ${device.ip_address}`);
    });
  }
});
