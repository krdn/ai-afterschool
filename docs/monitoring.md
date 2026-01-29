# Health Check & Monitoring

## Health Endpoint

**URL:** `/api/health`
**Methods:** `GET`, `HEAD`

### Response Format

```json
{
  "status": "healthy" | "unhealthy" | "degraded",
  "timestamp": "2026-01-30T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy" | "unhealthy",
      "message": "...",
      "responseTime": 15
    },
    "storage": {
      "status": "healthy" | "unhealthy",
      "message": "...",
      "responseTime": 2
    }
  },
  "uptime": 123.456,
  "version": "0.1.0"
}
```

### Status Codes

- **200 OK:** All checks passing
- **503 Service Unavailable:** One or more checks failing

### Status Values

- **healthy:** All systems operational
- **degraded:** Systems working but slow (response time > 1s)
- **unhealthy:** One or more critical checks failed

## Docker Health Checks

### Configuration

Health checks defined in `docker-compose.prod.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Container States

1. **starting:** Container just launched, in grace period
2. **healthy:** Health checks passing
3. **unhealthy:** Health checks failing (3 consecutive failures)

### Monitoring Commands

```bash
# Check container health status
docker-compose -f docker-compose.prod.yml ps

# View health check logs
docker-compose -f docker-compose.prod.yml logs app | grep -i health

# Continuous health monitoring
watch -n 5 'curl -s http://localhost:3000/api/health | jq'
```

## Deployment Integration

### Zero-Downtime Deployment

Health checks enable safe rolling deployments:

1. Deploy new container version
2. Wait for `/api/health` to return 200
3. Only then route traffic to new container
4. If health check fails, rollback to previous version

### Caddy Configuration

Caddy uses health check for upstream selection:

```caddyfile
reverse_proxy app:3000 {
    health_uri /api/health
    health_interval 30s
    health_timeout 10s
}
```

## Monitoring Integration

### Prometheus (Optional)

For metrics collection, add to health endpoint:

```typescript
// Expose metrics in Prometheus format
app.get('/metrics', async (req, res) => {
  const metrics = [
    `# HELP app_uptime_seconds Application uptime in seconds`,
    `# TYPE app_uptime_seconds gauge`,
    `app_uptime_seconds ${process.uptime()}`,
    `# HELP db_response_time_ms Database response time in milliseconds`,
    `# TYPE db_response_time_ms gauge`,
    `db_response_time_ms ${dbResponseTime}`,
  ]
  res.set('Content-Type', 'text/plain')
  res.send(metrics.join('\n'))
})
```

### Alerting Rules (Example)

```yaml
# alerting rules
groups:
  - name: app_health
    rules:
      - alert: AppUnhealthy
        expr: up{job="ai-afterschool"} == 0
        for: 5m
        annotations:
          summary: "Application health check failing"

      - alert: DatabaseSlow
        expr: db_response_time_ms > 1000
        for: 10m
        annotations:
          summary: "Database response time degraded"
```
