#!/bin/bash

SERVER_IP=77.42.44.201

echo "🚀 Deploying to Hetzner..."

ssh root@$SERVER_IP << 'EOF'
  set -e
  cd ~/floently-finnish

  echo "🧹 Cleaning repo..."
  git reset --hard
  git clean -fd

  echo "📥 Pulling latest code..."
  git pull origin main

  echo "🛑 Stopping containers..."
  docker-compose down

  echo "🔨 Rebuilding and starting..."
  docker-compose up -d --build

  echo "✅ Deployment complete"
EOF
