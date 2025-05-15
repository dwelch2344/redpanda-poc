import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';


const [, , groupId] = process.argv

console.log({ groupId })

const kafka = new Kafka({
  clientId: 'consumer-client',
  brokers: ['localhost:9092'],
});

const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

const runConsumer = async () => {
  const consumer = kafka.consumer({ groupId: 'user-group-' + groupId });
  await consumer.connect();
  // await consumer.subscribe({ topic: 'users', fromBeginning: true });
  await consumer.subscribe({ topic: 'users', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value) {
        const decoded = await registry.decode(message.value);
        console.log('Received message:', decoded);
      }
    },
  });
};

runConsumer().catch(console.error);
