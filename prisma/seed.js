/* Idempotent demo seed — safe to run on every deploy. */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10);

  const eng = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG', description: 'Engineering department' },
  });
  const fin = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN', description: 'Finance department' },
  });

  const users = [
    { email: 'admin@example.com', firstName: 'Ada', lastName: 'Admin', role: 'ADMIN', departmentId: null },
    { email: 'executive@example.com', firstName: 'Evan', lastName: 'Executive', role: 'EXECUTIVE', departmentId: null },
    { email: 'manager@example.com', firstName: 'Mona', lastName: 'Manager', role: 'MANAGER', departmentId: eng.id },
    { email: 'manager.eng@example.com', firstName: 'Miles', lastName: 'EngManager', role: 'MANAGER', departmentId: eng.id },
    { email: 'manager.fin@example.com', firstName: 'Fiona', lastName: 'FinManager', role: 'MANAGER', departmentId: fin.id },
    { email: 'contrib@example.com', firstName: 'Cara', lastName: 'Contributor', role: 'CONTRIBUTOR', departmentId: eng.id },
    { email: 'contributor.eng@example.com', firstName: 'Colin', lastName: 'EngContrib', role: 'CONTRIBUTOR', departmentId: eng.id },
    { email: 'contributor.fin@example.com', firstName: 'Fay', lastName: 'FinContrib', role: 'CONTRIBUTOR', departmentId: fin.id },
    { email: 'viewer@example.com', firstName: 'Vera', lastName: 'Viewer', role: 'VIEWER', departmentId: eng.id },
  ];

  const byEmail = {};
  for (const user of users) {
    byEmail[user.email] = await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, departmentId: user.departmentId },
      create: { ...user, passwordHash },
    });
  }

  const projectAlpha = await prisma.project.upsert({
    where: { code: 'ENG-ALPHA' },
    update: {},
    create: {
      name: 'Platform Alpha',
      code: 'ENG-ALPHA',
      description: 'Core platform build-out',
      status: 'ACTIVE',
      health: 'GREEN',
      ownerId: byEmail['manager@example.com'].id,
      departmentId: eng.id,
      plannedStartDate: new Date('2026-01-05'),
      plannedEndDate: new Date('2026-12-18'),
    },
  });
  await prisma.project.upsert({
    where: { code: 'ENG-BETA' },
    update: {},
    create: {
      name: 'Service Beta',
      code: 'ENG-BETA',
      description: 'Internal service modernization',
      status: 'ACTIVE',
      health: 'AMBER',
      isAtRisk: true,
      ownerId: byEmail['manager.eng@example.com'].id,
      departmentId: eng.id,
      plannedStartDate: new Date('2026-02-02'),
      plannedEndDate: new Date('2026-09-30'),
    },
  });
  await prisma.project.upsert({
    where: { code: 'FIN-LEDGER' },
    update: {},
    create: {
      name: 'Ledger Revamp',
      code: 'FIN-LEDGER',
      description: 'Finance ledger consolidation',
      status: 'ACTIVE',
      health: 'GREEN',
      ownerId: byEmail['manager.fin@example.com'].id,
      departmentId: fin.id,
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-11-15'),
    },
  });

  await prisma.projectVisibilityGrant.upsert({
    where: { userId_projectId: { userId: byEmail['viewer@example.com'].id, projectId: projectAlpha.id } },
    update: {},
    create: { userId: byEmail['viewer@example.com'].id, projectId: projectAlpha.id },
  });

  console.log('Seed complete: 2 departments, 9 users, 3 projects, 1 viewer grant.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
