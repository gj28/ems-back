const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

async function storeLastDaySum() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const sumQuery = `
      SELECT
        SUM(kw) AS total_kw,
        SUM(kvar) AS total_kvar
      FROM ems.ems_actual_data
      WHERE timestamp >= $1;`;

    const result = await pool.query(sumQuery, [oneDayAgo]);
    const { total_kw, total_kvar } = result.rows[0];

    const insertQuery = `
      INSERT INTO ems.sum_kw (total_kw, total_kvar, calculation_date)
      VALUES ($1, $2, $3);`;

    const currentDate = new Date();

    await pool.query(insertQuery, [total_kw, total_kvar, currentDate]);

    //console.log('Last day sum stored successfully.');
  } catch (error) {
    console.error('Error fetching and storing last day sum:', error);
  }
}

storeLastDaySum();

setInterval(storeLastDaySum, 24 * 60 * 60 * 1000);
