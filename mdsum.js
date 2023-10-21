const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

function storeLastMonthSum() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const sumQuery = `
    SELECT
      SUM(max_kw) AS total_kw,
      SUM(max_kvar) AS total_kvar,
      SUM(max_kva) AS total_kva

    FROM ems.ems_actual_data
    WHERE timestamp >= $1;`;

  return pool
    .query(sumQuery, [oneMonthAgo])
    .then((result) => {
      const { total_kw, total_kva,total_kvar } = result.rows[0];

      const insertQuery = `
        INSERT INTO ems.dwsum_table (total_kw, total_kvar,total_kva, calculation_date)
        VALUES ($1, $2, $3, $4);`;

      const currentDate = new Date();

      return pool.query(insertQuery, [total_kw, total_kvar,total_kva, currentDate]);
    })
    .catch((error) => {
      console.error('Error fetching and storing last month sum:', error);
    });
}

storeLastMonthSum();

setInterval(storeLastMonthSum, 24 * 60 * 60 * 1000);
