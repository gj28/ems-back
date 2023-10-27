const db = require('../db');

function updateDeviceInfo() {
  const activeDeviceCountQuery = 'SELECT COUNT(*) as active_device_count FROM ems.ems_devices WHERE status IN ($1, $2)';
  const inactiveDeviceCountQuery = 'SELECT COUNT(*) as inactive_device_count FROM ems.ems_devices WHERE status = $1';
  const totalDeviceCountQuery = 'SELECT COUNT(*) as total_device_count FROM ems.ems_devices';

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting a database connection:', err);
      return;
    }

    // Start a transaction to ensure data consistency
    connection.beginTransaction((err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        connection.release();
        return;
      }

      // Delete old data from the dev_info table
      const deleteStatisticsQuery = 'DELETE FROM dev_info';
      connection.query(deleteStatisticsQuery, (err) => {
        if (err) {
          console.error('Error deleting old device statistics:', err);
          connection.rollback(() => {
            console.error('Transaction rolled back.');
            connection.release();
          });
          return;
        }

        // Fetch active device count
        connection.query(activeDeviceCountQuery, ['online', 'heating'], (err, activeDeviceCountResult) => {
          if (err) {
            console.error('Error calculating active device count:', err);
            connection.rollback(() => {
              console.error('Transaction rolled back.');
              connection.release();
            });
            return;
          }

          const activeDeviceCount = activeDeviceCountResult[0].active_device_count;

          // Fetch inactive device count
          connection.query(inactiveDeviceCountQuery, ['offline'], (err, inactiveDeviceCountResult) => {
            if (err) {
              console.error('Error calculating inactive device count:', err);
              connection.rollback(() => {
                console.error('Transaction rolled back.');
                connection.release();
              });
              return;
            }

            const inactiveDeviceCount = inactiveDeviceCountResult[0].inactive_device_count;

            // Fetch total device count
            connection.query(totalDeviceCountQuery, (err, totalDeviceCountResult) => {
              if (err) {
                console.error('Error calculating total device count:', err);
                connection.rollback(() => {
                  console.error('Transaction rolled back.');
                  connection.release();
                });
                return;
              }

              const totalDeviceCount = totalDeviceCountResult[0].total_device_count;

              // Insert the calculated statistics into the dev_info table
              const insertDeviceInfoQuery = 'INSERT INTO dev_info (all_devices, active_devices, inactive_devices) VALUES (?, ?, ?)';
              connection.query(insertDeviceInfoQuery, [totalDeviceCount, activeDeviceCount, inactiveDeviceCount], (err) => {
                if (err) {
                  console.error('Error inserting device info:', err);
                  connection.rollback(() => {
                    console.error('Transaction rolled back.');
                    connection.release();
                  });
                } else {
                  connection.commit((err) => {
                    if (err) {
                      console.error('Error committing transaction:', err);
                      connection.rollback(() => {
                        console.error('Transaction rolled back.');
                        connection.release();
                      });
                    } else {
                      //console.log('Device info updated successfully.');
                      connection.release();
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  });
}

// Call the function periodically (e.g., every 10 seconds)
setInterval(updateDeviceInfo, 10000);
