const db = require('./db');

function userInfo() {
  let totalUsers, activeUsers, inactiveUsers;

  const userCountQuery = 'SELECT COUNT(*) as total_users FROM ems.ems_users';
  const activeUserCountQuery = 'SELECT COUNT(*) as active_users FROM ems.ems_users WHERE is_online = 1';
  const inactiveUserCountQuery = 'SELECT COUNT(*) as inactive_users FROM ems.ems_users WHERE is_online = 0';

  db.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }

    const deleteStatisticsQuery = 'DELETE FROM ems.user_info';
    client.query(deleteStatisticsQuery, (err) => {
      if (err) {
        console.error('Error deleting old user statistics:', err);
        release();
        return;
      }
      client.query(userCountQuery, (err, userCountResult) => {
        if (err) {
          console.error('Error calculating total users:', err);
          release();
          return;
        }
        totalUsers = userCountResult.rows[0].total_users;

        client.query(activeUserCountQuery, (err, activeUserCountResult) => {
          if (err) {
            console.error('Error calculating active users:', err);
            release();
            return;
          }

          activeUsers = activeUserCountResult.rows[0].active_users;

          client.query(inactiveUserCountQuery, (err, inactiveUserCountResult) => {
            if (err) {
              console.error('Error calculating inactive users:', err);
              release();
              return;
            }

            inactiveUsers = inactiveUserCountResult.rows[0].inactive_users;

            const insertStatisticsQuery = 'INSERT INTO ems.user_info (all_users, active_users, inactive_users) VALUES ($1, $2, $3)';
            client.query(insertStatisticsQuery, [totalUsers, activeUsers, inactiveUsers], (err) => {
              if (err) {
                console.error('Error inserting user statistics:', err);
              } else {
                //console.log('Inserted successfully.');
              }
              release();
            });
          });
        });
      });
    });
  });
}

setInterval(userInfo, 10000);