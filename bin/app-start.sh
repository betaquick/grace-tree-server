#!/bin/bash

export HOST=0.0.0.0
export PORT=3001
export SESSION_SECRET='grace.tree.server.io.main.site.ASDEREDDSF@ECxSz/Q'
export $(cat /home/ec2-user/.env)
(cd /home/ec2-user/application-server && exec /home/ec2-user/.nvm/versions/node/v14.16.0/bin/pm2 start server.js --name gracetree_server)
