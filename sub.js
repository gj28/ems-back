const mqtt = require('mqtt');

const broker = 'mqtt://broker.emqx.io';
const topic = 'ems/SL02202329';

const mqttClient = mqtt.connect(broker);

mqttClient.on('connect', () => {
  console.log(`Connected to MQTT broker. Subscribing to topic: ${topic}`);
  mqttClient.subscribe(topic);
});

mqttClient.on('message', (receivedTopic, message) => {
  if (receivedTopic === topic) {
    const data = JSON.parse(message.toString());

    console.log('Received data:');
    console.log(data);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT error:', error);
});
