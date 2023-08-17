const { Client } = require('pg');
const moment = require('moment-timezone');

// PostgreSQL configuration
const pgConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
  port: 5432,
};

const pgClient = new Client(pgConfig);

pgClient.connect();

function MinuteData() {
  const currentTimestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss');
  const startOfLastMinute = moment().tz('Asia/Kolkata').subtract(1, 'minutes').format('YYYY-MM-DDTHH:mm:ss');

  const selectQuery = `
    SELECT "deviceuid", "voltage", "current", "kva", "kw", "pf", "freq", "timestamp"
    FROM ems.ems_actual_data
    WHERE "timestamp" >= $1 AND "timestamp" <= $2
    ORDER BY "timestamp" DESC
  `;

  const deleteQuery = `
    DELETE FROM ems."1_minute"
    WHERE "timestamp" < $1
  `;

  pgClient.query(deleteQuery, [startOfLastMinute], (error, deleteResult) => {
    if (error) {
      console.error('Error deleting old data: ', error);
    } else {
      console.log(`Deleted ${deleteResult.rowCount} rows of old data from 1_minute table.`);
    }

    pgClient.query(selectQuery, [startOfLastMinute, currentTimestamp], (error, result) => {
      if (error) {
        console.error('Error fetching data: ', error);
        return;
      }

      const rows = result.rows;

      if (rows.length > 0) {
        const insertQuery = `
          INSERT INTO ems."1_minute" ("deviceuid", "voltage", "current", "kva", "kw", "pf", "freq", "timestamp")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        rows.forEach((row) => {
          const values = [
            row.deviceuid,
            row.voltage,
            row.current,
            row.kva,
            row.kw,
            row.pf,
            row.freq,
            row.timestamp,
          ];

          pgClient.query(insertQuery, values, (error) => {
            if (error) {
              console.error('Error inserting data: ', error);
            }
          });
        });

        console.log(`Inserted ${rows.length} rows of data into 1_minute table.`);
      } else {
        console.log('No data found for the last 1 minute.');
      }
    });
  });
}

// Call the function immediately
MinuteData();
setInterval(MinuteData, 60000); // 1 minute in MS
