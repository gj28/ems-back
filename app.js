const express = require('express');
const cors = require('cors');
const router = require('./routes');
const limitter = require('express-rate-limit');
const fs = require('fs');
const bodyParser = require('body-parser');
const audit_logs = require('./graph/graphlogs');
const SA = require('./superadmin/SA');
const kwsum=require('./graph/maxdemand');

//const { checkState } = require('./SMS/smsController');
// const mqtt_sub = require('./sub');
// const mqtt_pub = require('./pub');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(audit_logs.log);

// // Log middleware
// app.use((req, res, next) => {
//   const { method, url, body } = req;
//   const timestamp = new Date().toISOString();
//   const entity = body.userType || 'User';
//   const entityName = body.companyName || 'SenseLive';
//   const user = req.body.Username || req.body.companyEmail || 'N/A'; 
//   const userType = req.body.designation || 'N/A'; 
//   const type = body.type || 'N/A';
//   const status = res.statusCode >= 200 && res.statusCode < 400 ? 'successful' : 'failure';
//   const details = '...';

//   const logMessage = `${timestamp} | Entity Type: ${entity} | Entity Name: ${entityName} | User: ${user} (${userType}) | Type: ${url} | Status: ${status} | Details: ${details} | ${method}`;

//   const formattedLogMessage = `
// ==========================================================================================================================================
// ${logMessage}
// ------------------------------------------------------------------------------------------------------------------------------------------
//   `;

//   fs.appendFile('log.txt', formattedLogMessage, (err) => {
//     if (err) {
//       console.error('Error writing to log file:', err);
//     }
//   });

//   next();
// });

// Use the router for handling routes
app.use(router);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
//setInterval(checkState,  1000);