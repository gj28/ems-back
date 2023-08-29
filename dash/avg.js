const { Client } = require('pg');
const moment = require('moment-timezone');

const pgConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
  port: 5432,
};

const db = new Client(pgConfig);

db.connect();

function fetchMinMaxAvgEntryTime() {
  const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
  const startOfPreviousDay = moment().tz('Asia/Kolkata').subtract(1, 'days').format('YYYY-MM-DD');

  const selectQuery = `
    SELECT "timestamp"
    FROM ems.ems_actual_data
    WHERE "timestamp" >= $1 AND "timestamp" <= $2
    ORDER BY "timestamp" ASC
  `;

  const deleteQuery = `
    DELETE FROM ems.ems_actual_data
    WHERE "timestamp" < $1
  `;

  db.query(deleteQuery, [startOfPreviousDay], (deleteError, deleteResult) => {
    if (deleteError) {
      console.error('Error deleting old data: ', deleteError);
      return;
    }

    console.log(`Deleted ${deleteResult.rowCount} rows of old data.`);

    db.query(selectQuery, [startOfPreviousDay, currentDate], (error, result) => {
      if (error) {
        console.error('Error fetching data: ', error);
        return;
      }

      const rows = result.rows;

      if (rows.length > 0) {
        let entryStatsPerInterval = {};
        let previousTimestamp = moment(rows[0].timestamp);
        let entryCount = 0;
        let totalEntryTime = 0;
        let minEntryTime = Number.MAX_SAFE_INTEGER;
        let maxEntryTime = Number.MIN_SAFE_INTEGER;

        rows.forEach((row) => {
          const currentTimestamp = moment(row.timestamp);
          const timeDiff = currentTimestamp.diff(previousTimestamp);

          if (timeDiff >= 1200000) { // If 20 minutes or more have passed
            if (entryCount > 0) {
              entryStatsPerInterval[previousTimestamp.format('HH:mm')] = {
                average: totalEntryTime / entryCount,
                min: minEntryTime,
                max: maxEntryTime
              };
            }

            previousTimestamp = currentTimestamp;
            entryCount = 0;
            totalEntryTime = 0;
            minEntryTime = Number.MAX_SAFE_INTEGER;
            maxEntryTime = Number.MIN_SAFE_INTEGER;
          } else {
            entryCount++;
            totalEntryTime += timeDiff;
            minEntryTime = Math.min(minEntryTime, timeDiff);
            maxEntryTime = Math.max(maxEntryTime, timeDiff);
          }
        });

        // Insert statistics into interval_day table
        for (const interval in entryStatsPerInterval) {
          const stats = entryStatsPerInterval[interval];
          const insertQuery = `
            INSERT INTO ems.interval_day (deviceuid, "timestamp", voltage, "current", kva, kw, pf, freq)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          const values = [
            interval,
            moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
            stats.average,
            stats.min,
            stats.max,
            stats.average, // Placeholder value, replace with actual value
            stats.average, // Placeholder value, replace with actual value
            stats.average  // Placeholder value, replace with actual value
          ];

          db.query(insertQuery, values, (insertError) => {
            if (insertError) {
              console.error('Error inserting data: ', insertError);
            }
          });
        }

        console.log('Inserted entry time statistics into interval_day table.');
      } else {
        console.log('No data found for the specified time range.');
      }
    });
  });
}

// Call the function immediately
fetchMinMaxAvgEntryTime();
setInterval(fetchMinMaxAvgEntryTime, 24 * 60 * 60 * 1000);

