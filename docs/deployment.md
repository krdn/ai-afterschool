# Deployment Guide

## SSL/TLS Configuration with Caddy

Caddy automatically handles SSL certificates using Let's Encrypt.

### Production Deployment

1. **Set domain in environment:**
   ```bash
   # .env.production
   APP_DOMAIN=your-domain.com
   CADDY_EMAIL=admin@your-domain.com
   ```

2. **Ensure DNS points to server:**
   - A record: `your-domain.com` -> server IP
   - A record: `www.your-domain.com` -> server IP

3. **Start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Caddy will:**
   - Detect domain from APP_DOMAIN
   - Request SSL certificate from Let's Encrypt
   - Configure HTTPS automatically
   - Redirect HTTP to HTTPS

### Verification

```bash
# Check SSL certificate
curl -I https://your-domain.com

# Should show:
# HTTP/2 200
# server: Caddy

# Check certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Local Development

For local development, Caddy runs on port 80 without SSL:

```bash
# Access app on http://localhost
docker-compose -f docker-compose.prod.yml up -d
```

### Troubleshooting

**Certificate issuance fails:**
- Verify DNS A record points to server
- Check port 80/443 are accessible from internet
- Check Caddy logs: `docker-compose logs caddy`
- Ensure domain is not using a proxy that blocks Let's Encrypt

**HTTP redirect not working:**
- Verify Caddyfile has redirect block
- Check APP_DOMAIN environment variable is set

**Health check failing:**
- Ensure app container is healthy
- Verify `/api/health` endpoint is accessible

## Zero-Downtime Deployment

### Manual Deployment

```bash
# Deploy latest version
./scripts/deploy.sh

# Deploy specific version
./scripts/deploy.sh --tag=v1.1.0

# Deploy without confirmation
./scripts/deploy.sh --force
```

### What Happens During Deployment

1. **Pre-deployment checks**
   - Verify docker-compose file exists
   - Check Docker is running
   - Validate environment

2. **Backup**
   - Save current image tag for rollback

3. **Build**
   - Build new Docker image
   - Tag with version

4. **Deploy**
   - Pull latest base images (postgres, minio, caddy)
   - Start new containers
   - Wait for health check

5. **Success**
   - Cleanup old images
   - Remove backup tag

6. **Failure → Auto-rollback**
   - Restore previous image tag
   - Restart containers with backup
   - Verify health

### Rolling Back

```bash
# Rollback to previous version
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh --tag=v1.0.0
```

### CI/CD Integration

For automated deployment via GitHub Actions, see `.github/workflows/deploy.yml`.

Required secrets:
- `SERVER_HOST` - Server IP/hostname
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key

### Environment Variables

The deployment script supports these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPOSE_FILE` | `docker-compose.prod.yml` | Path to docker-compose file |
| `HEALTH_CHECK_TIMEOUT` | `60` | Seconds to wait for health check |
| `HEALTH_CHECK_URL` | `http://localhost:3000/api/health` | Health check endpoint |

Example:
```bash
HEALTH_CHECK_TIMEOUT=120 ./scripts/deploy.sh
```
