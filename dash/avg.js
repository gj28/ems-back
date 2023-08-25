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

function fetchAverageEntryTime() {
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
        let entryCountPerInterval = {};
        let previousTimestamp = moment(rows[0].timestamp);
        let entryCount = 0;
        let totalEntryTime = 0;

        rows.forEach((row) => {
          const currentTimestamp = moment(row.timestamp);
          const timeDiff = currentTimestamp.diff(previousTimestamp);

          if (timeDiff >= 1200000) { // If 20 minutes or more have passed
            if (entryCount > 0) {
              entryCountPerInterval[previousTimestamp.format('HH:mm')] = totalEntryTime / entryCount;
            }

            previousTimestamp = currentTimestamp;
            entryCount = 0;
            totalEntryTime = 0;
          } else {
            entryCount++;
            totalEntryTime += timeDiff;
          }
        });

        // Insert average entry times into interval_day table
        for (const interval in entryCountPerInterval) {
          const averageEntryTime = entryCountPerInterval[interval];
          const insertQuery = `
            INSERT INTO ems.interval_day (deviceuid, "timestamp", voltage, "current", kva, kw, pf, freq)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          const values = [
            interval,
            moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
            averageEntryTime,
            averageEntryTime,
            averageEntryTime,
            averageEntryTime,
            averageEntryTime,
            averageEntryTime
          ];

          db.query(insertQuery, values, (insertError) => {
            if (insertError) {
              console.error('Error inserting data: ', insertError);
            }
          });
        }

        console.log('Inserted average entry times into interval_day table.');
      } else {
        console.log('No data found for the specified time range.');
      }
    });
  });
}

// Call the function immediately
fetchAverageEntryTime();
setInterval(fetchAverageEntryTime, 24 * 60 * 60 * 1000);
