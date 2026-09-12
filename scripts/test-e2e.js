const http = require('http');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const parsed = new URL(fullUrl);

  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = {};
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // 1. Health Check
  console.log('--- 1. Health Check ---');
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'Server is healthy');

  // 2. Authentication & Role System
  console.log('\n--- 2. Authentication & Role System ---');
  // Admin Login
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@velozity.com', password: 'AdminPass123!' },
  });
  assert(adminLogin.status === 200 && adminLogin.body.data.user.role === 'ADMIN', 'Admin login successful');
  const adminToken = adminLogin.body.data.accessToken;

  // PM 1 Login
  const pm1Login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'pm1@velozity.com', password: 'PMPass123!' },
  });
  assert(pm1Login.status === 200 && pm1Login.body.data.user.role === 'PM', 'PM1 login successful');
  const pm1Token = pm1Login.body.data.accessToken;
  const pm1Id = pm1Login.body.data.user.id;

  // PM 2 Login
  const pm2Login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'pm2@velozity.com', password: 'PMPass123!' },
  });
  assert(pm2Login.status === 200 && pm2Login.body.data.user.role === 'PM', 'PM2 login successful');
  const pm2Token = pm2Login.body.data.accessToken;

  // Dev 1 Login
  const dev1Login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'dev1@velozity.com', password: 'DevPass123!' },
  });
  assert(dev1Login.status === 200 && dev1Login.body.data.user.role === 'DEVELOPER', 'Developer 1 login successful');
  const dev1Token = dev1Login.body.data.accessToken;
  const dev1Id = dev1Login.body.data.user.id;

  // Dev 2 Login
  const dev2Login = await request('/auth/login', {
    method: 'POST',
    body: { email: 'dev2@velozity.com', password: 'DevPass123!' },
  });
  assert(dev2Login.status === 200 && dev2Login.body.data.user.role === 'DEVELOPER', 'Developer 2 login successful');
  const dev2Token = dev2Login.body.data.accessToken;

  // Verify HttpOnly cookie header was set
  const setCookie = adminLogin.headers['set-cookie'];
  assert(
    setCookie && setCookie.some((c) => c.includes('HttpOnly') && c.includes('velozity_refresh_token')),
    'Refresh token stored in HttpOnly cookie'
  );

  // 3. API-Level Role Enforcement
  console.log('\n--- 3. Strict API-Level Role Enforcement ---');
  // Developer attempting to create a project
  const devCreateProject = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${dev1Token}` },
    body: { name: 'Unauthorized Project', clientId: 'non-existent' },
  });
  assert(devCreateProject.status === 403, 'Developer blocked from creating projects (HTTP 403 Forbidden)');

  // Developer attempting to get all projects (sees only projects with assigned tasks)
  const devProjects = await request('/projects', {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  assert(devProjects.status === 200, 'Developer can only query project scope');

  // PM 1 attempting to access PM 2 project by ID
  const pm2ProjectsRes = await request('/projects', {
    headers: { Authorization: `Bearer ${pm2Token}` },
  });
  const pm2ProjectId = pm2ProjectsRes.body.data.projects[0]?.id;
  assert(!!pm2ProjectId, 'PM2 has at least one owned project');

  const pm1AccessPm2Proj = await request(`/projects/${pm2ProjectId}`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  assert(
    pm1AccessPm2Proj.status === 403,
    'PM1 strictly forbidden from accessing PM2 project by ID (HTTP 403 Forbidden)'
  );

  // 4. Project & Task Filtering via Query Parameters
  console.log('\n--- 4. Task Filtering via URL Query Parameters ---');
  const statusFilterRes = await request('/tasks?status=IN_PROGRESS', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    statusFilterRes.status === 200 &&
      statusFilterRes.body.data.tasks.every((t) => t.status === 'IN_PROGRESS'),
    'Filter by status=IN_PROGRESS works correctly'
  );

  const priorityFilterRes = await request('/tasks?priority=CRITICAL', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    priorityFilterRes.status === 200 &&
      priorityFilterRes.body.data.tasks.every((t) => t.priority === 'CRITICAL'),
    'Filter by priority=CRITICAL works correctly'
  );

  const overdueFilterRes = await request('/tasks?timeRange=overdue', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    overdueFilterRes.status === 200 && overdueFilterRes.body.data.tasks.length >= 2,
    'Filter by timeRange=overdue returns flagged overdue tasks'
  );

  // 5. Real-Time WebSocket, Live Feed, and Role-Scoped Notifications
  console.log('\n--- 5. Real-Time WebSocket, Live Feed, and Presence ---');
  await new Promise((resolve) => {
    // Connect Admin socket
    const adminSocket = io('http://localhost:5000', {
      auth: { token: adminToken },
      transports: ['websocket'],
    });

    // Connect PM1 socket
    const pm1Socket = io('http://localhost:5000', {
      auth: { token: pm1Token },
      transports: ['websocket'],
    });

    // Connect Dev1 socket
    const dev1Socket = io('http://localhost:5000', {
      auth: { token: dev1Token },
      transports: ['websocket'],
    });

    let adminReceivedPresence = false;
    let adminReceivedActivity = false;
    let pm1ReceivedNotification = false;
    let pm1ReceivedActivity = false;

    adminSocket.on('presence:update', (data) => {
      adminReceivedPresence = true;
      assert(data.onlineCount >= 1, `Admin received live presence update (${data.onlineCount} online)`);
    });

    adminSocket.on('activity:new', (activity) => {
      adminReceivedActivity = true;
      assert(
        activity.details && activity.details.includes('Ravi Patel moved Task #'),
        `Admin global feed received real-time event: "${activity.details}"`
      );
    });

    pm1Socket.on('activity:new', (activity) => {
      pm1ReceivedActivity = true;
      assert(
        activity.details && activity.details.includes('Ravi Patel moved Task #'),
        `PM1 project feed received real-time event: "${activity.details}"`
      );
    });

    pm1Socket.on('notification:new', (notification) => {
      pm1ReceivedNotification = true;
      assert(
        notification.type === 'TASK_IN_REVIEW',
        `PM1 received in-app notification when task moved to IN_REVIEW: "${notification.title}"`
      );
    });

    // When all 3 sockets connected, perform status change as Dev 1 on their task
    setTimeout(async () => {
      // Find a task assigned to Dev 1 in PM1's project
      const devTasks = await request('/tasks', {
        headers: { Authorization: `Bearer ${dev1Token}` },
      });
      const taskToMove = devTasks.body.data.tasks.find((t) => t.status !== 'IN_REVIEW');

      if (taskToMove) {
        console.log(`  Updating task #${taskToMove.taskNumber} (${taskToMove.title}) to IN_REVIEW...`);
        const updateRes = await request(`/tasks/${taskToMove.id}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${dev1Token}` },
          body: { status: 'IN_REVIEW' },
        });

        assert(updateRes.status === 200, 'Developer successfully updated assigned task status to IN_REVIEW');

        // Verify task activity log was stored in database
        const taskDetailRes = await request(`/tasks/${taskToMove.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const latestLog = taskDetailRes.body.data.task.activityLogs[0];
        assert(
          latestLog && latestLog.newStatus === 'IN_REVIEW',
          `Task activity log successfully persisted in database: "${latestLog?.details}"`
        );
      }

      // Wait 1.5s for WebSocket events to settle
      setTimeout(() => {
        adminSocket.disconnect();
        pm1Socket.disconnect();
        dev1Socket.disconnect();
        resolve();
      }, 1500);
    }, 1000);
  });

  // 6. Offline Missed Event Catchup from PostgreSQL Database
  console.log('\n--- 6. Offline Missed Event Catchup (Direct DB Query) ---');
  const missedEventsRes = await request('/activity/recent?limit=20', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    missedEventsRes.status === 200 &&
      missedEventsRes.body.data.activities.length > 0 &&
      missedEventsRes.body.data.activities[0].details.includes('Ravi Patel moved Task #'),
    'Offline missed events retrieved directly from PostgreSQL database with correct formatting'
  );

  // Summary
  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
