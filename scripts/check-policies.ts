#!/usr/bin/env tsx
import { db } from '@/lib/db'

async function checkPolicies() {
  try {
    const policies = await db.$queryRaw`
      SELECT
        tablename,
        policyname,
        permissive,
        cmd
      FROM pg_policies
      WHERE tablename IN ('Student', 'Teacher')
      ORDER BY tablename, policyname
    ` as any[]

    console.log('Existing RLS policies:')
    console.log(`Found ${policies.length} policies`)
    for (const p of policies) {
      console.log(`\n${p.tablename}.${p.policyname}:`)
      console.log(`  Roles: ${p.roles}`)
      console.log(`  Command: ${p.cmd}`)
      console.log(`  Qualifier: ${p.qual}`)
    }

    if (policies.length === 0) {
      console.log('No policies found. Need to create policies.')
    } else if (policies.length >= 4) {
      console.log('\n✅ All 4 required policies are in place')
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

checkPolicies()
