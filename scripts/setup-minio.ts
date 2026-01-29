#!/usr/bin/env tsx
/**
 * MinIO S3 Bucket Setup Script
 *
 * Creates the default bucket and policies for PDF storage.
 * Run after starting MinIO container.
 *
 * Usage:
 *   npm run setup:minio
 *
 * Environment variables:
 *   MINIO_ENDPOINT - MinIO endpoint (default: localhost:9000)
 *   MINIO_REGION - Region (default: us-east-1)
 *   MINIO_ACCESS_KEY - Access key (default: minioadmin)
 *   MINIO_SECRET_KEY - Secret key (default: minioadmin)
 *   MINIO_BUCKET - Bucket name (default: reports)
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3'

const config = {
  endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucket: process.env.MINIO_BUCKET || 'reports',
}

const client = new S3Client({
  endpoint: `http://${config.endpoint}`,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
})

async function setupMinio() {
  console.log('🪣 Setting up MinIO bucket...')
  console.log(`   Endpoint: http://${config.endpoint}`)
  console.log(`   Bucket: ${config.bucket}\n`)

  // Check if bucket exists
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
    console.log(`✅ Bucket "${config.bucket}" already exists`)
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      // Create bucket
      console.log(`Creating bucket "${config.bucket}"...`)
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }))
      console.log(`✅ Bucket "${config.bucket}" created`)
    } else {
      console.error('Error checking bucket:', error)
      throw error
    }
  }

  // Set bucket policy for public read (optional, adjust as needed)
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${config.bucket}/*`],
      },
    ],
  }

  try {
    await client.send(new PutBucketPolicyCommand({
      Bucket: config.bucket,
      Policy: JSON.stringify(bucketPolicy),
    }))
    console.log(`✅ Bucket policy set (public read)`)
  } catch (error: any) {
    console.warn('Warning: Could not set bucket policy:', error.message)
    console.log('   (Policy may require admin credentials)')
  }

  console.log('\n✨ MinIO setup complete!')
  console.log(`\nConsole: http://${config.endpoint.split(':')[0]}:9001`)
  console.log(`   API: http://${config.endpoint}`)
}

setupMinio().catch(error => {
  console.error('Setup failed:', error)
  process.exit(1)
})
