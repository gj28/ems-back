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

  // Insert the log data into your PostgreSQL database
  const query = `
    INSERT INTO ems.api_usage (created_time, tenant_id, entity_type, entity_id, transport, db_storage, re_exec, js_exec, email_exec, sms_exec, alarm_exec, status, message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
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
  ])
    .then(() => {
      console.log(`Function '${functionName}' executed and logged successfully.`);
    })
    .catch((error) => {
      console.error(`Error logging execution of function '${functionName}':`, error);
    });
}

module.exports = {
  logExecution,
};
