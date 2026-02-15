#!/bin/bash

# Deploy script for EC2
# Usage: ./deploy-ec2.sh

SERVER="ubuntu@13.61.252.25"
REMOTE_DIR="/var/www/nomo"
LOCAL_DIR="backend"
KEY_FILE="D:/downloads/pro-aws-dev1.pem"

echo "=== Deploying backend to EC2 ==="

# 1. Install dependencies on server
echo "Installing dependencies on server..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE_DIR && sudo npm install --production"

# 2. Restart backend service
echo "Restarting backend service..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$SERVER" "sudo systemctl restart nomo-backend"

echo "=== Deployment complete ==="