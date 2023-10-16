const db = require('./db'); 


function RequestCounts() {
  const currentTime = new Date().toISOString();

  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
  const startTime = fifteenMinutesAgo.toISOString();

  const countQuery = {
    text: 'SELECT COUNT(*) FROM ems.info_twi WHERE created_time >= $1 AND created_time < $2',
    values: [startTime, currentTime],
  };

  db.query(countQuery, (error, result) => {
    if (error) {
      console.error('Error counting requests:', error);
    } else {
      const requestCount = result.rows[0].count;

      const insertQuery = {
        text: 'INSERT INTO ems.info_twi_log (timestamp, request_count) VALUES ($1, $2)',
        values: [currentTime, requestCount],
      };

      db.query(insertQuery, (insertError, insertResult) => {
        if (insertError) {
          console.error('Error inserting request count:', insertError);
        } else {
          //console.log(`Request count (${requestCount}) inserted into request_counts table.`);
        }
      });
    }
  });
}

setInterval(RequestCounts,15 * 60 * 1000);
