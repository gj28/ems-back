const { Pool } = require('pg');

const dbConfig = {
  host: 'ec2-3-108-57-100.ap-south-1.compute.amazonaws.com',
  user: 'gaurav',
  password: 'gaurav123',
  database: 'postgres',
};

const pool = new Pool(dbConfig);

// Define the function to fetch and store the last month's sum and today's sum
function storeLastMonthAndDaySum() {
    try {
      // Calculate the date one month ago from the current date
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Calculate the date for the start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      // Create a query to fetch the sum of KWH and KVA for the last one month
      const monthSumQuery = `
        SELECT
          SUM(kwh) AS total_kwh_month,
          SUM(kva) AS total_kva_month
        FROM ems.ems_actual_data
        WHERE timestamp >= $1;`;
  
      // Execute the query to fetch the month sum
      pool.query(monthSumQuery, [oneMonthAgo], (monthError, monthResult) => {
        if (monthError) {
          console.error('Error fetching last month sum:', monthError);
          return;
        }
  
        // Extract the month sum values from the query result
        const { total_kwh_month, total_kva_month } = monthResult.rows[0];
  
        // Create a query to fetch the sum of KWH and KVA for today
        const daySumQuery = `
          SELECT
            SUM(kwh) AS total_kwh_day,
            SUM(kva) AS total_kva_day
          FROM ems.ems_actual_data
          WHERE timestamp >= $1;`;

        // Execute the query to fetch the day sum
        pool.query(daySumQuery, [today], (dayError, dayResult) => {
          if (dayError) {
            console.error('Error fetching today\'s sum:', dayError);
            return;
          }

          // Extract the day sum values from the query result
          const { total_kwh_day, total_kva_day } = dayResult.rows[0];

          // Create a query to insert the sum values into the sum_table
          const insertQuery = `
            INSERT INTO ems.sum_table (total_kwh_month, total_kva_month, total_kwh_day, total_kva_day, calculation_date)
            VALUES ($1, $2, $3, $4, $5);`;

          // Get the current date for the calculation date
          const currentDate = new Date();

          // Execute the insert query
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

// Run the storeLastMonthAndDaySum function immediately when the script starts
storeLastMonthAndDaySum();

// Run the storeLastMonthAndDaySum function every 24 hours (1 day)
setInterval(storeLastMonthAndDaySum, 24 * 60 * 60 * 1000);
