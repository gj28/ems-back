const mqtt = require('mqtt');
require('dotenv').config();
const { Client } = require('pg');

const broker = 'ws://dashboard.senselive.in:9001';

const options = {
  username: 'Sense2023', // Replace with your MQTT broker username
  password: 'sense123', // Replace with your MQTT broker password
};
const dbConfig = {
  host: process.env.pub_host,
  user: process.env.pub_user,
  password: process.env.pub_password,
  database: process.env.pub_database,
  port: process.env.pub_port,
};

const pgClient = new Client(dbConfig);

pgClient.connect();

const mqttClient = mqtt.connect(broker,options);

const deviceIds = ['SL02202327', 'SL02202333', 'SL02202343', 'SL02202329'];

const lastPublishedTableIDs = {};

function fetchDataAndPublish(deviceId) {
  const query = {
    text: 'SELECT * FROM public.energy_database WHERE device_uid = $1 ORDER BY id DESC LIMIT 1',
    values: [deviceId],
  };

  pgClient.query(query)
    .then((result) => {
      const data = result.rows[0];
      if (data) {
        const topic = `ems_live/${deviceId}`;
        const message = JSON.stringify(data);

        if (data.id !== lastPublishedTableIDs[deviceId]) {
          mqttClient.publish(topic, message, (err) => {
            if (err) {
              console.error('MQTT publish error:', err);
            } else {
              console.log(`Published data to topic: ${topic}`);
              lastPublishedTableIDs[deviceId] = data.id;
            }
          });
        } else {
          //console.log(`No new data for ${deviceId} or same table ID. Skipping publish.`);
        }
      } else {
        //console.log(`No data found for device: ${deviceId}`);
      }
    })
    .catch((error) => {
      console.error(`PostgreSQL query error for ${deviceId}:`, error);
    });
}

deviceIds.forEach((deviceId) => fetchDataAndPublish(deviceId));

setInterval(() => {
  deviceIds.forEach((deviceId) => fetchDataAndPublish(deviceId));
}, 10000);

process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing connections...');
  mqttClient.end();
  pgClient.end(() => {
    process.exit();
  });
});
