#!/usr/bin/env tsx
/**
 * Validate environment variables before starting application
 *
 * Usage:
 *   npm run validate:env
 *   npm run validate:env -- --production
 */

const requiredVars = {
  development: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'ANTHROPIC_API_KEY',
  ],
}

const isProduction = process.argv.includes('--production')
const env = isProduction ? 'production' : 'development'
const required = requiredVars[env as keyof typeof requiredVars]

let missing: string[] = []
let invalid: string[] = []

console.log(`🔍 Validating ${env} environment...\n`)

// Check for missing variables
for (const variable of required) {
  const value = process.env[variable]
  if (!value) {
    missing.push(variable)
  } else if (value.includes('CHANGE_ME') || value === 'your-secret-key-here') {
    invalid.push(variable)
  }
}

// Print results
if (missing.length > 0) {
  console.error('❌ Missing required variables:')
  missing.forEach(v => console.error(`   - ${v}`))
  console.error('')
}

if (invalid.length > 0) {
  console.error('⚠️  Variables with placeholder values:')
  invalid.forEach(v => console.error(`   - ${v}`))
  console.error('')
}

if (missing.length === 0 && invalid.length === 0) {
  console.log('✅ All required variables are set!')
  console.log(`\nChecked ${required.length} variables`)
  process.exit(0)
} else {
  console.error('❌ Environment validation failed')
  console.error('\nFix the issues above before starting the application.')
  process.exit(1)
}
