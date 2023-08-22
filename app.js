const express = require('express');
const cors = require('cors');
const router = require('./routes');
const limitter = require('express-rate-limit');
//const mqtt_pub = require('./pub');
//const mqtt_sub = require('./sub');
const MinuteData = require('./dash/interval_min');
const hourData = require('./dash/interval_hour');
const weekData = require('./dash/interval_week');
const dayData = require('./dash/interval_day');
const MonthData = require('./dash/interval_month');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
