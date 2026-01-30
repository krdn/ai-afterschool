#!/usr/bin/env tsx
import { db } from '@/lib/db'

async function checkColumns() {
  try {
    const result = await db.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('Teacher', 'Student')
      AND column_name LIKE '%team%'
      ORDER BY table_name, column_name
    ` as any[]

    console.log('Team-related columns:')
    console.table(result)

    // Also check if RLS is enabled
    const rlsStatus = await db.$queryRaw`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE tablename IN ('Student', 'Teacher')
      ORDER BY tablename
    ` as any[]

    console.log('\nRLS status:')
    console.table(rlsStatus)

    // Check existing policies
    const policies = await db.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename IN ('Student', 'Teacher')
      ORDER BY tablename, policyname
    ` as any[]

    console.log('\nExisting RLS policies:')
    console.table(policies)
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

checkColumns()
