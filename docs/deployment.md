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
