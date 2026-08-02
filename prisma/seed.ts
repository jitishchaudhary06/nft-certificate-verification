import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'manage_universities',
  'manage_admins',
  'manage_students',
  'manage_certificates',
  'mint_nft',
  'revoke_certificate',
  'view_dashboard',
  'view_own_nfts',
  'verify_public',
];

async function main() {
  console.log('Seeding roles & permissions...');

  const permissions = await Promise.all(
    PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: name.replace(/_/g, ' ') },
      })
    )
  );

  const allPermIds = permissions.map((p) => ({ id: p.id }));

  const roles: Array<{ name: RoleName; perms: string[] }> = [
    {
      name: RoleName.SUPER_ADMIN,
      perms: PERMISSIONS,
    },
    {
      name: RoleName.UNIVERSITY_ADMIN,
      perms: [
        'manage_students',
        'manage_certificates',
        'mint_nft',
        'revoke_certificate',
        'view_dashboard',
        'verify_public',
      ],
    },
    {
      name: RoleName.STUDENT,
      perms: ['view_own_nfts', 'verify_public'],
    },
    {
      name: RoleName.EMPLOYER,
      perms: ['verify_public'],
    },
  ];

  for (const role of roles) {
    const permConnect = permissions
      .filter((p) => role.perms.includes(p.name))
      .map((p) => ({ id: p.id }));

    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: { set: permConnect } },
      create: {
        name: role.name,
        description: role.name.replace(/_/g, ' '),
        permissions: { connect: permConnect },
      },
    });
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.SUPER_ADMIN },
  });

  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@nftcerts.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      isEmailVerified: true,
      roleId: superAdminRole.id,
    },
  });

  const demoUniversity = await prisma.university.upsert({
    where: { code: 'DEMO-UNI' },
    update: {},
    create: {
      name: 'Demo University',
      code: 'DEMO-UNI',
      email: 'admin@demouni.edu',
      website: 'https://demouni.edu',
      address: '123 Education Ave',
    },
  });

  const uniAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.UNIVERSITY_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'uniadmin@demouni.edu' },
    update: {},
    create: {
      email: 'uniadmin@demouni.edu',
      name: 'University Admin',
      passwordHash: await bcrypt.hash('UniAdmin@123', 12),
      isEmailVerified: true,
      roleId: uniAdminRole.id,
      universityId: demoUniversity.id,
    },
  });

  console.log('Seed complete.');
  console.log(`Super Admin: ${email} / ${password}`);
  console.log('University Admin: uniadmin@demouni.edu / UniAdmin@123');
  console.log(`Permissions seeded: ${allPermIds.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
