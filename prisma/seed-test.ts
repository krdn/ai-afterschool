import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding test data...');

  console.log('🗑️  기존 테스트 데이터 삭제 중...');

  // 외래 키 제약 조건을 고려한 삭제 순서 (의존성 역순)
  // 모든 데이터 삭제 (테스트 환경이므로 안전)
  await prisma.gradeHistory.deleteMany({});
  await prisma.counselingSession.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});

  const hashedPassword = await argon2.hash('test1234');

  console.log('👨‍🏫 Creating test teachers...');
  const teacher1 = await prisma.teacher.create({
    data: {
      id: 'test-teacher-001',
      name: '김선생',
      email: 'teacher1@test.com',
      password: hashedPassword,
      phone: '010-1111-1111',
      role: 'TEACHER',
      birthDate: new Date('1985-03-15'),
      birthTimeHour: 14,
      birthTimeMinute: 30,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      id: 'test-teacher-002',
      name: '이선생',
      email: 'teacher2@test.com',
      password: hashedPassword,
      phone: '010-2222-2222',
      role: 'TEACHER',
      birthDate: new Date('1988-07-20'),
      birthTimeHour: 9,
      birthTimeMinute: 15,
    },
  });

  const admin = await prisma.teacher.create({
    data: {
      id: 'test-teacher-admin',
      name: '관리자',
      email: 'admin@test.com',
      password: hashedPassword,
      phone: '010-9999-9999',
      role: 'DIRECTOR',
      birthDate: new Date('1980-01-01'),
      birthTimeHour: 12,
      birthTimeMinute: 0,
    },
  });

  console.log('✅ Created 3 teachers');

  console.log('👨‍🎓 Creating test students...');
  const student1 = await prisma.student.create({
    data: {
      id: 'test-student-001',
      name: '홍길동',
      phone: '010-1000-0001',
      grade: 1,
      school: '테스트고등학교',
      birthDate: new Date('2008-05-10'),
      birthTimeHour: 8,
      birthTimeMinute: 30,
      teacherId: teacher1.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      id: 'test-student-002',
      name: '김영희',
      phone: '010-1000-0002',
      grade: 2,
      school: '테스트고등학교',
      birthDate: new Date('2007-08-22'),
      birthTimeHour: 15,
      birthTimeMinute: 45,
      teacherId: teacher1.id,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      id: 'test-student-003',
      name: '박철수',
      phone: '010-1000-0003',
      grade: 3,
      school: '테스트고등학교',
      birthDate: new Date('2006-12-03'),
      birthTimeHour: 11,
      birthTimeMinute: 20,
      teacherId: teacher2.id,
    },
  });

  const student4 = await prisma.student.create({
    data: {
      id: 'test-student-004',
      name: '이민지',
      phone: '010-1000-0004',
      grade: 3,
      school: '테스트중학교',
      birthDate: new Date('2009-03-18'),
      birthTimeHour: 16,
      birthTimeMinute: 0,
      teacherId: teacher2.id,
    },
  });

  const student5 = await prisma.student.create({
    data: {
      id: 'test-student-005',
      name: '최준호',
      phone: '010-1000-0005',
      grade: 1,
      school: '테스트고등학교',
      birthDate: new Date('2008-09-25'),
      birthTimeHour: 10,
      birthTimeMinute: 10,
      teacherId: teacher1.id,
    },
  });

  console.log('✅ Created 5 students');

  console.log('👨‍👩‍👧 Creating test parents...');
  await prisma.parent.create({
    data: {
      id: 'test-parent-001',
      name: '홍아버지',
      phone: '010-2000-0001',
      relation: 'FATHER',
      isPrimary: true,
      studentId: student1.id,
    },
  });

  await prisma.parent.create({
    data: {
      id: 'test-parent-002',
      name: '김어머니',
      phone: '010-2000-0002',
      relation: 'MOTHER',
      isPrimary: true,
      studentId: student2.id,
    },
  });

  console.log('✅ Created 2 parents');

  console.log('💬 Creating test counseling sessions...');
  await prisma.counselingSession.create({
    data: {
      id: 'test-session-001',
      studentId: student1.id,
      teacherId: teacher1.id,
      sessionDate: new Date('2026-02-10'),
      duration: 60,
      type: 'CAREER',
      summary: '진로 상담 예정',
    },
  });

  await prisma.counselingSession.create({
    data: {
      id: 'test-session-002',
      studentId: student2.id,
      teacherId: teacher1.id,
      sessionDate: new Date('2026-02-05'),
      duration: 45,
      type: 'ACADEMIC',
      summary: '학습 상담 완료 - 수학 성적 향상 방안 논의',
    },
  });

  console.log('✅ Created 2 counseling sessions');

  console.log('📊 Creating test grade history...');
  await prisma.gradeHistory.create({
    data: {
      id: 'test-grade-001',
      studentId: student1.id,
      teacherId: teacher1.id,
      subject: '수학',
      gradeType: 'MIDTERM',
      score: 85,
      maxScore: 100,
      normalizedScore: 85,
      testDate: new Date('2026-01-15'),
      academicYear: 2026,
      semester: 1,
    },
  });

  await prisma.gradeHistory.create({
    data: {
      id: 'test-grade-002',
      studentId: student1.id,
      teacherId: teacher1.id,
      subject: '영어',
      gradeType: 'MIDTERM',
      score: 92,
      maxScore: 100,
      normalizedScore: 92,
      testDate: new Date('2026-01-15'),
      academicYear: 2026,
      semester: 1,
    },
  });

  await prisma.gradeHistory.create({
    data: {
      id: 'test-grade-003',
      studentId: student2.id,
      teacherId: teacher2.id,
      subject: '수학',
      gradeType: 'MIDTERM',
      score: 78,
      maxScore: 100,
      normalizedScore: 78,
      testDate: new Date('2026-01-15'),
      academicYear: 2026,
      semester: 1,
    },
  });

  console.log('✅ Created 3 grade records');

  console.log('\n🎉 Test data seeding completed!');
  console.log('\n📋 Summary:');
  console.log('   Teachers: 3');
  console.log('   Students: 5');
  console.log('   Parents: 2');
  console.log('   Counseling Sessions: 2');
  console.log('   Grade Records: 3');
  console.log('\n🔑 Test Accounts:');
  console.log('   Admin: admin@test.com / test1234');
  console.log('   Teacher 1: teacher1@test.com / test1234');
  console.log('   Teacher 2: teacher2@test.com / test1234');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
