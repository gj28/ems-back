const mqtt = require('mqtt');
const { Client } = require('pg');

const broker = 'mqtt://broker.emqx.io';

const dbConfig = {
  host: '64.227.181.131',
  user: 'postgres',
  password: 'iotsenselive',
  database: 'senselive_db',
  port: 12440,
};

const pgClient = new Client(dbConfig);

pgClient.connect();

const mqttClient = mqtt.connect(broker);

const deviceId = 'SL02202329,';

const query = {
  text: 'SELECT * FROM public.energy_database WHERE device_uid = $1',
  values: [deviceId],
};

pgClient.query(query)
  .then((result) => {
    const data = result.rows[0];
    const topic = `ems/${deviceId}`;
    const message = JSON.stringify(data);

    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.error('MQTT publish error:', err);
      } else {
        console.log(`Published data to topic: ${topic}`);
      }
      mqttClient.end();
      pgClient.end();
    });
  })
  .catch((error) => {
    console.error('PostgreSQL query error:', error);
    pgClient.end();
  });
