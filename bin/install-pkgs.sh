#!/bin/bash

export $(cat /home/ec2-user/.env)
(cd /home/ec2-user/application-server && exec /home/ec2-user/.nvm/versions/node/v8.12.0/bin/npm ci)
(cd /home/ec2-user/application-server && exec /home/ec2-user/.nvm/versions/node/v8.12.0/bin/knex migrate:latest --knexfile ./db/knexfile.js)
(cd /home/ec2-user/application-server && exec /home/ec2-user/.nvm/versions/node/v8.12.0/bin/knex seed:run --knexfile ./db/knexfile.js)
