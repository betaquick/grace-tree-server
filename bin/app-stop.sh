#!/bin/bash


/home/ec2-user/.nvm/versions/node/v14.16.0/bin/pm2 stop gracetree_server || true
/home/ec2-user/.nvm/versions/node/v14.16.0/bin/pm2 flush gracetree_server || true
