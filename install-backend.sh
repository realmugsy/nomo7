#!/bin/bash

# Install backend dependencies on EC2
# Usage: ./install-backend.sh

SERVER="ubuntu@13.61.252.25"
REMOTE_DIR="/var/www/nomo"
KEY_FILE="D:/downloads/pro-aws-dev1.pem"

echo "=== Installing backend dependencies on EC2 ==="

# Install Node.js dependencies
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE_DIR/backend && sudo npm install --production"

echo "=== Installation complete ==="