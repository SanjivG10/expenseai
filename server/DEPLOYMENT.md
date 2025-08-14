# ExpenseAI Server Deployment Guide

## Prerequisites

### EC2 Instance Setup

1. **Ubuntu/Amazon Linux 2 EC2 instance** with sufficient resources
2. **Node.js 18+** installed on the EC2 instance
3. **Yarn** package manager installed
4. **PM2** process manager installed globally
5. **Git** configured on the EC2 instance

### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name       | Description                                   | Example                                  |
| ----------------- | --------------------------------------------- | ---------------------------------------- |
| `EC2_HOST`        | EC2 instance public IP or domain              | `203.0.113.1` or `api.expenseai.com`     |
| `EC2_USERNAME`    | SSH username (usually `ubuntu` or `ec2-user`) | `ubuntu`                                 |
| `EC2_PRIVATE_KEY` | Private SSH key for EC2 access                | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `EC2_PORT`        | SSH port (optional, defaults to 22)           | `22`                                     |
| `APP_PORT`        | Application port (optional, defaults to 8000) | `8000`                                   |

## EC2 Instance Initial Setup

### 1. Connect to your EC2 instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Install dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Install PM2 globally
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command above
```

### 3. Clone your repository

```bash
# Clone to the home directory
cd ~
git clone https://github.com/your-username/your-repo.git expenseai
cd expenseai
```

### 4. Configure environment variables

```bash
cd server
cp .env.example .env
nano .env  # Edit with your production values
```

### 5. Setup PM2 for auto-restart on reboot

```bash
# After first deployment, save PM2 configuration
pm2 save
```

## Deployment Methods

### Method 1: Automatic GitHub Actions (Recommended)

The deployment will automatically trigger when you:

- Push to the `main` branch with changes in the `server/` directory
- Manually trigger via "Actions" tab → "Deploy to EC2" → "Run workflow"

### Method 2: Manual Deployment

If you need to deploy manually:

```bash
# On your EC2 instance
cd ~/expenseai/server
./deploy.sh
```

## Deployment Process

The GitHub Action performs these steps:

1. **Build & Test** (on GitHub runners):
   - Checkout code
   - Setup Node.js 18
   - Install dependencies
   - Build TypeScript
   - Run tests

2. **Deploy** (on EC2 instance):
   - Pull latest code
   - Install dependencies
   - Build application
   - Restart PM2 process
   - Health check

## Managing the Application

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs expenseai

# Restart application
pm2 restart expenseai

# Stop application
pm2 stop expenseai

# Monitor application
pm2 monit
```

### Log Files

Application logs are stored in:

- Combined: `~/expenseai/server/logs/combined.log`
- Output: `~/expenseai/server/logs/out.log`
- Error: `~/expenseai/server/logs/error.log`

### Health Check

Verify the application is running:

```bash
curl http://localhost:3000/health
```

## Security Considerations

### Firewall Setup

```bash
# Allow SSH (22) and application port (3000)
sudo ufw allow 22
sudo ufw allow 3000
sudo ufw enable
```

### Environment Variables

- Never commit `.env` files to git
- Use strong, unique values for JWT secrets and database passwords
- Regularly rotate API keys and secrets

### SSL/TLS (Recommended)

Consider using a reverse proxy like Nginx with SSL certificates:

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

## Monitoring

### Log Monitoring

```bash
# View real-time logs
pm2 logs expenseai --follow

# View specific log file
tail -f ~/expenseai/server/logs/combined.log
```

### Resource Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# System resources
htop
df -h
```

## Troubleshooting

### Common Issues

1. **Deployment fails with permission errors**
   - Ensure the SSH key has correct permissions: `chmod 600 ~/.ssh/your-key.pem`
   - Verify the EC2_USERNAME matches your instance user

2. **Application won't start**
   - Check logs: `pm2 logs expenseai`
   - Verify environment variables: `cat .env`
   - Ensure all dependencies installed: `yarn install`

3. **Health check fails**
   - Verify application is listening on correct port
   - Check firewall settings
   - Review application logs for startup errors

### Emergency Procedures

**Rollback to previous version:**

```bash
cd ~/expenseai
git log --oneline -10  # Find previous commit hash
git checkout <previous-commit-hash>
cd server
./deploy.sh --skip-tests
```

**Manual restart:**

```bash
pm2 restart expenseai
```

## Backup Strategy

### Database Backups

If using a database, ensure regular backups are configured.

### Application Backups

```bash
# Create backup before deployment
tar -czf ~/backup-$(date +%Y%m%d).tar.gz ~/expenseai
```

## Support

For deployment issues:

1. Check the GitHub Actions logs
2. Review PM2 logs: `pm2 logs expenseai`
3. Verify EC2 instance health
4. Check application logs in the `logs/` directory
