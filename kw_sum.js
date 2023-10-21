const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

function storeLastMonthSum(deviceid) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const sumQuery = `
    SELECT
      deviceid,
      SUM(kw) AS total_kw,
      SUM(kvar) AS total_kvar
    FROM ems.ems_actual_data
    WHERE deviceid = $1 AND "timestamp" >= $2
    GROUP BY deviceid;`;

  return pool
    .query(sumQuery, [deviceid, oneMonthAgo])
    .then((result) => {
      const { deviceid, total_kw, total_kvar } = result.rows[0];

      const insertQuery = `
        INSERT INTO ems.sum_kw (deviceid, total_kw, total_kvar, calculation_date)
        VALUES ($1, $2, $3, $4);`;

      const currentDate = new Date();

      return pool.query(insertQuery, [deviceid, total_kw, total_kvar, currentDate]);
    })
    .catch((error) => {
      console.error('Error fetching and storing last month sum:', error);
    });
}

function fetchAndStoreAllDeviceSum() {
  const uniqueDeviceQuery = `
    SELECT DISTINCT deviceid FROM ems.ems_actual_data;`;

  pool
    .query(uniqueDeviceQuery)
    .then((result) => {
      const deviceIds = result.rows.map((row) => row.deviceid);

      deviceIds.forEach((deviceid) => storeLastMonthSum(deviceid));
    })
    .catch((error) => {
      console.error('Error fetching unique deviceids:', error);
    });
}

fetchAndStoreAllDeviceSum();

setInterval(fetchAndStoreAllDeviceSum, 24 * 60 * 60 * 1000);
