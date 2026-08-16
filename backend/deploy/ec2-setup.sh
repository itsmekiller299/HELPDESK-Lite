#!/usr/bin/env bash
# One-time EC2 (Ubuntu) setup for the HelpDesk Lite backend.
# Run as:  sudo bash deploy/ec2-setup.sh
set -euo pipefail

echo "==> Installing Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Cloning the repository"
cd /home/ubuntu
if [ ! -d helpdesk ]; then
  git clone https://github.com/itsmekiller299/HELPDESK-Lite.git helpdesk
fi
cd helpdesk

echo "==> Installing backend dependencies"
cd backend
npm install --omit=dev

echo "==> Configure .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Edit /home/ubuntu/helpdesk/backend/.env and set:"
  echo "  JWT_SECRET, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, CORS_ORIGIN, APP_URL"
fi

echo "==> Seed the RDS database"
npm run seed

echo "==> Install systemd service"
sudo cp deploy/helpdesk-api.service /etc/systemd/system/helpdesk-api.service
sudo systemctl daemon-reload
sudo systemctl enable helpdesk-api
sudo systemctl start helpdesk-api
sudo systemctl status helpdesk-api --no-pager

echo "==> Allow traffic on port 4000 (if using ufw)"
sudo ufw allow 4000/tcp || true

echo "Done. Backend runs at http://<EC2-PUBLIC-IP>:4000"