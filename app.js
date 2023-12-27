const express = require('express');
const cors = require('cors');
const router = require('./routes');
const limitter = require('express-rate-limit');
const fs = require('fs');
const bodyParser = require('body-parser');
const audit_logs = require('./graph/graphlogs');
const SA = require('./superadmin/SA');

//const { checkState } = require('./SMS/smsController');
// const mqtt_sub = require('./sub');
// const mqtt_pub = require('./pub');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(audit_logs.log);

// Use the router for handling routes
app.use(router);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
