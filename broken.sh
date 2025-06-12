#!/bin/bash
docker compose up -d

cd apps/node
npm i
npx ts-node src/producer.ts
# wait for finish

cd -
