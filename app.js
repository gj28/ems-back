const express = require('express');
const cors = require('cors');
const router = require('./routes');
const limitter = require('express-rate-limit');
//const mqtt_pub = require('./pub');
//const mqtt_sub = require('./sub');
// const MinuteData = require('./dash/month');
// const MonthsData = require('./dash/Interval');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
