const db = require('./db');


function logExecution(functionName, tenantId, status, message) {
    const createdTime = new Date().toISOString(); 
    const entity_type = 'SenseLive';
    const entity_id = tenantId; 
    const transport = 'ENABLED'; 
    const db_storage = 'ENABLED'; 
    const re_exec = 'ENABLED'; 
    const js_exec = 'ENABLED';
    const email_exec = 'ENABLED';
    const sms_exec = 'ENABLED'; 
    const alarm_exec = 'ENABLED';
  
    const query = `
      INSERT INTO ems.tmp_api_usage (created_time, tenant_id, entity_type, entity_id, transport, db_storage, re_exec, js_exec, email_exec, sms_exec, alarm_exec, status, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
  
    db.query(query, [
      createdTime,
      tenantId,
      entity_type,
      entity_id,
      transport,
      db_storage,
      re_exec,
      js_exec,
      email_exec,
      sms_exec,
      alarm_exec,
      status,
      message,
    ], (error, results) => {
      if (error) {
        console.error(`Error logging execution of function '${functionName}':`, error);
      } else {
        console.log(`Function '${functionName}' executed and logged successfully.`);
      }
    });
  }

  function RequestCounts() {
    const currentTime = new Date().toISOString();
  
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    const startTime = fifteenMinutesAgo.toISOString();
  
    const countQuery = {
      text: 'SELECT COUNT(*) FROM ems.tmp_api_usage WHERE created_time >= $1 AND created_time <= $2',
      values: [startTime, currentTime],
    };
  
    db.query(countQuery, (error, result) => {
      if (error) {
        console.error('Error counting requests:', error);
      } else {
        const requestCount = result.rows[0].count;
  
        const insertQuery = {
          text: 'INSERT INTO ems.log_table (timestamp, count) VALUES ($1, $2)',
          values: [currentTime, requestCount],
        };
  
        db.query(insertQuery, (insertError, insertResult) => {
          if (insertError) {
            console.error('Error inserting request count:', insertError);
          } else {
            console.log(`Request count (${requestCount}) inserted into log_table.`);
          }
        });
      }
    });
  }
  
  setInterval(RequestCounts, 15 * 60 * 1000);
  
  module.exports = { logExecution };
  