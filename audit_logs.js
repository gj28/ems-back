const db = require('./db'); 

function log(req, res, next) {
  const { method, url, body, ip } = req;
  const timestamp = new Date().toISOString();
  const entity = body.userType || 'User';
  const entityName = body.companyName || 'SenseLive';
  const user = req.body.Username || req.body.companyEmail || 'N/A';
  const userType = req.body.designation || 'STD';
  const type = method;
  const status = res.statusCode >= 200 && res.statusCode < 400 ? 'successful' : 'failure';
  const details = `URL: ${url}`;

  const logQuery = {
    text: 'INSERT INTO ems.logs (timestamp, ip, entity_type, entity_name, username, user_type, request_type, status, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    values: [timestamp, ip, entity, entityName, user, userType, type, status, details],
  };

  db.query(logQuery, (error, result) => {
    if (error) {
      console.error('Error writing to database:', error);
    } else {
      console.log('Log data inserted into the database');
    }
    next();
  });
}

function fetchLogs(req, res) {
  const query = 'SELECT * FROM ems.logs';
  
  db.query(query, (error, result) => {
    if (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const rows = result.rows; 

    res.json(rows);
  });
}


module.exports = {log,fetchLogs};
