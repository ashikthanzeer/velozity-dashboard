import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('AdminPass123!', salt);
  const pmPassword = await bcrypt.hash('PMPass123!', salt);
  const devPassword = await bcrypt.hash('DevPass123!', salt);

  // 1. Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      passwordHash: adminPassword,
      name: 'Alex Mercer (Admin)',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@velozity.com',
      passwordHash: pmPassword,
      name: 'Priya Sharma (PM)',
      role: Role.PM,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@velozity.com',
      passwordHash: pmPassword,
      name: 'Marcus Vance (PM)',
      role: Role.PM,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@velozity.com',
      passwordHash: devPassword,
      name: 'Ravi Patel',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@velozity.com',
      passwordHash: devPassword,
      name: 'Elena Rostova',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@velozity.com',
      passwordHash: devPassword,
      name: 'Jordan Lee',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@velozity.com',
      passwordHash: devPassword,
      name: 'Aisha Khan',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  // 2. Clients
  console.log('Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Sarah Sterling',
      company: 'Aura Fintech Global',
      email: 'contact@aurafintech.io',
      phone: '+1 (555) 234-5678',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Dr. Robert Chen',
      company: 'Pulse Healthcare Systems',
      email: 'procurement@pulsehealth.org',
      phone: '+1 (555) 876-5432',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Elena Vasquez',
      company: 'Vanguard Global Logistics',
      email: 'tech@vanguardlogistics.com',
      phone: '+1 (555) 432-1098',
    },
  });

  // 3. Projects
  console.log('Creating projects...');
  // Project 1 (Owned by PM1 Priya)
  const project1 = await prisma.project.create({
    data: {
      name: 'NextGen Wealth Mobile Core',
      description: 'Ultra-low latency investment portfolio and algorithmic order routing engine for retail fintech.',
      status: ProjectStatus.ACTIVE,
      clientId: client1.id,
      pmId: pm1.id,
    },
  });

  // Project 2 (Owned by PM2 Marcus)
  const project2 = await prisma.project.create({
    data: {
      name: 'Telehealth Clinical Portal',
      description: 'HIPAA-compliant video consults, asynchronous provider messaging, and EHR sync pipelines.',
      status: ProjectStatus.ACTIVE,
      clientId: client2.id,
      pmId: pm2.id,
    },
  });

  // Project 3 (Owned by PM1 Priya)
  const project3 = await prisma.project.create({
    data: {
      name: 'Fleet Logistics Telemetry Hub',
      description: 'Real-time GPS IoT sensor streaming, predictive route re-calculation, and fuel optimization.',
      status: ProjectStatus.ACTIVE,
      clientId: client3.id,
      pmId: pm1.id,
    },
  });

  // 4. Tasks (at least 5+ tasks each, various statuses, at least 2 overdue)
  console.log('Creating tasks...');
  const now = new Date();
  const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const past1Day = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const future2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const future4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const future7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const future14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Project 1 Tasks (PM1 - Priya)
  const p1t1 = await prisma.task.create({
    data: {
      title: 'Architect Biometric Auth Flow',
      description: 'Implement WebAuthn and passkey protocol for biometric login on native mobile clients.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: past3Days,
      isOverdue: false, // Done tasks are not overdue
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const p1t2 = await prisma.task.create({
    data: {
      title: 'Real-time Ticker WebSocket Ingestion',
      description: 'Stream order book depth and live quotes via high-throughput socket pipeline.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: future2Days,
      isOverdue: false,
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const p1t3 = await prisma.task.create({
    data: {
      title: 'Ledger Reconciliation Audit Worker',
      description: 'Daily automated double-entry ledger reconciliation worker script.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: past1Day, // OVERDUE 1!
      isOverdue: true,
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  const p1t4 = await prisma.task.create({
    data: {
      title: 'Tax Lot Selection Accounting Engine',
      description: 'Support FIFO, LIFO, and MinTax lot identification algorithms during stock sales.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: future4Days,
      isOverdue: false,
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  const p1t5 = await prisma.task.create({
    data: {
      title: 'PCI-DSS Compliance Payment Gateway',
      description: 'Tokenized credit card and ACH direct debit processing with automated chargeback alerts.',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: future7Days,
      isOverdue: false,
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const p1t6 = await prisma.task.create({
    data: {
      title: 'Automated KYC Document Verification',
      description: 'Integrate OCR and passport liveness verification via third-party microservice.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: future14Days,
      isOverdue: false,
      projectId: project1.id,
      assignedToId: dev3.id,
    },
  });

  // Project 2 Tasks (PM2 - Marcus)
  const p2t1 = await prisma.task.create({
    data: {
      title: 'WebRTC Peer Mesh Media Server',
      description: 'Configure Coturn STUN/TURN clusters for encrypted patient video consults.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: past3Days, // OVERDUE 2!
      isOverdue: true,
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  const p2t2 = await prisma.task.create({
    data: {
      title: 'HL7 FHIR Clinical Record Exporter',
      description: 'Export consultation notes and medication prescriptions into FHIR v4 JSON bundle standards.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
      projectId: project2.id,
      assignedToId: dev4.id,
    },
  });

  const p2t3 = await prisma.task.create({
    data: {
      title: 'Doctor Schedule Slot Booking Engine',
      description: 'Timezone-aware calendar booking engine handling multi-facility clinician availability.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: past1Day,
      isOverdue: false,
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  const p2t4 = await prisma.task.create({
    data: {
      title: 'SMS & Email Reminder Dispatcher',
      description: 'Scheduled multi-channel reminders dispatched 24h and 1h prior to appointment.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: future4Days,
      isOverdue: false,
      projectId: project2.id,
      assignedToId: dev4.id,
    },
  });

  const p2t5 = await prisma.task.create({
    data: {
      title: 'E-Prescription Pharmacy Routing',
      description: 'Route validated drug prescriptions to partner pharmacy distribution networks.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: future7Days,
      isOverdue: false,
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  // Project 3 Tasks (PM1 - Priya)
  const p3t1 = await prisma.task.create({
    data: {
      title: 'MQTT Ingestion Pipeline for Telematics',
      description: 'High-volume broker parsing canbus OBD-II engine codes and tyre pressure streams.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: future2Days,
      isOverdue: false,
      projectId: project3.id,
      assignedToId: dev2.id,
    },
  });

  const p3t2 = await prisma.task.create({
    data: {
      title: 'Geofence Polygonal Breach Detection',
      description: 'Spatial queries triggering instant alerts when delivery vehicles exit corridor bounds.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: past1Day, // OVERDUE 3!
      isOverdue: true,
      projectId: project3.id,
      assignedToId: dev1.id,
    },
  });

  const p3t3 = await prisma.task.create({
    data: {
      title: 'Fuel Efficiency Predictive Model',
      description: 'Analyze driver acceleration curves against freight tonnage to optimize fuel usage.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: future4Days,
      isOverdue: false,
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  const p3t4 = await prisma.task.create({
    data: {
      title: 'Driver Hours-of-Service Regulatory Log',
      description: 'Automated ELD electronic logging device rest hour checks and violation warnings.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: past3Days,
      isOverdue: false,
      projectId: project3.id,
      assignedToId: dev1.id,
    },
  });

  const p3t5 = await prisma.task.create({
    data: {
      title: 'Multi-Stop Route TSP Solver',
      description: 'Genetic algorithm calculating optimal dispatch sequence for urban deliveries.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: future7Days,
      isOverdue: false,
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  // 5. Pre-existing Activity Logs
  console.log('Creating activity logs...');
  const tMinus10m = new Date(now.getTime() - 10 * 60 * 1000);
  const tMinus25m = new Date(now.getTime() - 25 * 60 * 1000);
  const tMinus45m = new Date(now.getTime() - 45 * 60 * 1000);
  const tMinus2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const tMinus4h = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const tMinus1d = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.taskActivityLog.createMany({
    data: [
      {
        taskId: p1t1.id,
        userId: dev1.id,
        previousStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.DONE,
        action: 'STATUS_CHANGE',
        details: `Ravi Patel moved Task #${p1t1.taskNumber} from In Review → Done`,
        timestamp: tMinus4h,
      },
      {
        taskId: p1t2.id,
        userId: dev1.id,
        previousStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        action: 'STATUS_CHANGE',
        details: `Ravi Patel moved Task #${p1t2.taskNumber} from To Do → In Progress`,
        timestamp: tMinus2h,
      },
      {
        taskId: p1t4.id,
        userId: dev2.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        action: 'STATUS_CHANGE',
        details: `Elena Rostova moved Task #${p1t4.taskNumber} from In Progress → In Review`,
        timestamp: tMinus45m,
      },
      {
        taskId: p2t2.id,
        userId: dev4.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        action: 'STATUS_CHANGE',
        details: `Aisha Khan moved Task #${p2t2.taskNumber} from In Progress → In Review`,
        timestamp: tMinus25m,
      },
      {
        taskId: p2t3.id,
        userId: dev3.id,
        previousStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.DONE,
        action: 'STATUS_CHANGE',
        details: `Jordan Lee moved Task #${p2t3.taskNumber} from In Review → Done`,
        timestamp: tMinus1d,
      },
      {
        taskId: p3t3.id,
        userId: dev4.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        action: 'STATUS_CHANGE',
        details: `Aisha Khan moved Task #${p3t3.taskNumber} from In Progress → In Review`,
        timestamp: tMinus10m,
      },
    ],
  });

  // 6. Pre-existing Notifications
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: pm1.id,
        type: 'TASK_IN_REVIEW',
        title: 'Task Ready for Review',
        message: `Elena Rostova moved "${p1t4.title}" (Task #${p1t4.taskNumber}) to In Review.`,
        link: `/projects/${project1.id}`,
        isRead: false,
        createdAt: tMinus45m,
      },
      {
        userId: pm2.id,
        type: 'TASK_IN_REVIEW',
        title: 'Task Ready for Review',
        message: `Aisha Khan moved "${p2t2.title}" (Task #${p2t2.taskNumber}) to In Review.`,
        link: `/projects/${project2.id}`,
        isRead: false,
        createdAt: tMinus25m,
      },
      {
        userId: dev1.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You were assigned to "${p1t2.title}" in NextGen Wealth Mobile Core.`,
        link: `/tasks/${p1t2.id}`,
        isRead: false,
        createdAt: tMinus2h,
      },
      {
        userId: dev2.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You were assigned to "${p1t3.title}" in NextGen Wealth Mobile Core.`,
        link: `/tasks/${p1t3.id}`,
        isRead: true,
        createdAt: tMinus1d,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('Test Accounts:');
  console.log('  Admin: admin@velozity.com / AdminPass123!');
  console.log('  PM 1:  pm1@velozity.com   / PMPass123!   (Priya Sharma)');
  console.log('  PM 2:  pm2@velozity.com   / PMPass123!   (Marcus Vance)');
  console.log('  Dev 1: dev1@velozity.com  / DevPass123!  (Ravi Patel)');
  console.log('  Dev 2: dev2@velozity.com  / DevPass123!  (Elena Rostova)');
  console.log('  Dev 3: dev3@velozity.com  / DevPass123!  (Jordan Lee)');
  console.log('  Dev 4: dev4@velozity.com  / DevPass123!  (Aisha Khan)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
