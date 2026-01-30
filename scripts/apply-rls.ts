#!/usr/bin/env tsx
/**
 * Apply PostgreSQL RLS (Row-Level Security) policies
 * This script enables RLS on Student and Teacher tables
 * and creates team-based access control policies
 */

import { db } from '@/lib/db'

async function applyRLS() {
  console.log('Applying RLS policies...')

  try {
    // Enable RLS
    await db.$executeRaw`ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY`
    console.log('✓ Enabled RLS on Student')

    await db.$executeRaw`ALTER TABLE "Teacher" ENABLE ROW LEVEL SECURITY`
    console.log('✓ Enabled RLS on Teacher')

    // Student table policies
    try {
      await db.$executeRaw`
        CREATE POLICY "Student_director_all_access"
        ON "Student"
        FOR ALL
        USING (current_setting('rls.teacher_role', TRUE) = 'DIRECTOR')
      `
      console.log('✓ Created Student_director_all_access policy')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('✓ Student_director_all_access policy already exists')
      } else {
        throw e
      }
    }

    try {
      await db.$executeRaw`
        CREATE POLICY "Student_team_isolation"
        ON "Student"
        FOR ALL
        USING (
          current_setting('rls.teacher_role', TRUE) = 'TEAM_LEADER' AND
          "teamId" = current_setting('rls.team_id', TRUE)
        )
      `
      console.log('✓ Created Student_team_isolation policy')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('✓ Student_team_isolation policy already exists')
      } else {
        throw e
      }
    }

    // Teacher table policies
    try {
      await db.$executeRaw`
        CREATE POLICY "Teacher_director_all_access"
        ON "Teacher"
        FOR ALL
        USING (current_setting('rls.teacher_role', TRUE) = 'DIRECTOR')
      `
      console.log('✓ Created Teacher_director_all_access policy')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('✓ Teacher_director_all_access policy already exists')
      } else {
        throw e
      }
    }

    try {
      await db.$executeRaw`
        CREATE POLICY "Teacher_team_isolation"
        ON "Teacher"
        FOR ALL
        USING (
          current_setting('rls.teacher_role', TRUE) = 'TEAM_LEADER' AND
          "teamId" = current_setting('rls.team_id', TRUE)
        )
      `
      console.log('✓ Created Teacher_team_isolation policy')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('✓ Teacher_team_isolation policy already exists')
      } else {
        throw e
      }
    }

    console.log('\n✅ RLS policies applied successfully!')
  } catch (error: any) {
    console.error('Error applying RLS policies:', error.message)

    // Check if policies already exist
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some policies may already exist - checking current state...')

      // Verify policies
      const policies = await db.$queryRaw`
        SELECT * FROM pg_policies
        WHERE tablename IN ('Student', 'Teacher')
        ORDER BY tablename, policyname
      ` as any[]

      console.log('\n📋 Current RLS policies:')
      for (const policy of policies) {
        console.log(`  - ${policy.tablename}.${policy.policyname}`)
      }

      if (policies.length >= 4) {
        console.log('\n✅ All required policies are in place')
        return
      }
    }

    throw error
  } finally {
    await db.$disconnect()
  }
}

applyRLS().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
