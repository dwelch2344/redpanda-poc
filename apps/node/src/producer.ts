import { Kafka, Partitioners, Producer } from 'kafkajs';
import { SchemaRegistry, SchemaType, readAVSC } from '@kafkajs/confluent-schema-registry';
import path from 'path';

const seed = (Math.random() + 1).toString(36).substring(7)

const kafka = new Kafka({
  clientId: 'producer-client',
  brokers: ['localhost:9092'],
});

const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

const runProducer = async () => {
  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
    transactionTimeout: 5000
  });
  await producer.connect();

  const schemaPath = path.join(__dirname, '..', '..', '..', 'schemas', 'user.avsc');
  const schema = readAVSC(schemaPath);
  const { id } = await registry.register({ type: SchemaType.AVRO, schema: JSON.stringify(schema) });

  for (let itr = 1; itr < 10; itr++) {
    await iterate(id, itr, producer)
    await new Promise(r => setTimeout(r, 1 * 1000))
  }

  await producer.disconnect();
};

async function iterate(schemaId: number, itr: number, producer: Producer) {
  const payload = { id: itr, name: `User ${itr} @ ${seed}` + itr, email: `user+${itr}@${seed}.com` };
  const encodedValue = await registry.encode(schemaId, payload);

  await producer.send({
    topic: 'users',
    messages: [{ value: encodedValue }],
  });

  console.log(`Sent user ${payload.email}`)
}

runProducer().catch(console.error);
