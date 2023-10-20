const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

function storeLastMonthAndDaySum() {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const monthSumQuery = `
        SELECT
          SUM(kwh) AS total_kwh_month,
          SUM(kva) AS total_kva_month
        FROM ems.ems_actual_data
        WHERE timestamp >= $1;`;
  
      pool.query(monthSumQuery, [oneMonthAgo], (monthError, monthResult) => {
        if (monthError) {
          console.error('Error fetching last month sum:', monthError);
          return;
        }
  
        const { total_kwh_month, total_kva_month } = monthResult.rows[0];
  
        const daySumQuery = `
          SELECT
            SUM(kwh) AS total_kwh_day,
            SUM(kva) AS total_kva_day
          FROM ems.ems_actual_data
          WHERE timestamp >= $1;`;


        pool.query(daySumQuery, [today], (dayError, dayResult) => {
          if (dayError) {
            console.error('Error fetching today\'s sum:', dayError);
            return;
          }
          const { total_kwh_day, total_kva_day } = dayResult.rows[0];

          const insertQuery = `
            INSERT INTO ems.sum_table (total_kwh_month, total_kva_month, total_kwh_day, total_kva_day, calculation_date)
            VALUES ($1, $2, $3, $4, $5);`;

          const currentDate = new Date();

          pool.query(insertQuery, [total_kwh_month, total_kva_month, total_kwh_day, total_kva_day, currentDate], (insertError) => {
            if (insertError) {
              console.error('Error inserting into sum_table:', insertError);
            }
          });
        });
      });
    } catch (error) {
      console.error('Error fetching and storing last month and today\'s sum:', error);
    }
}

storeLastMonthAndDaySum();

setInterval(storeLastMonthAndDaySum, 24 * 60 * 60 * 1000);
