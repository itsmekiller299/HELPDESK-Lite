require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb, run, get } = require('./schema');

async function seed() {
  const db = await getDb();

  const existing = get('SELECT COUNT(*) as count FROM users');
  if (existing && existing.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@helpdesk.com', hashPassword('admin123'), 'Admin']);
  run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Agent Smith', 'agent@helpdesk.com', hashPassword('agent123'), 'Agent']);
  run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Agent Jane', 'jane@helpdesk.com', hashPassword('agent123'), 'Agent']);
  run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['John Customer', 'customer@helpdesk.com', hashPassword('customer123'), 'Customer']);
  run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Sarah Customer', 'sarah@helpdesk.com', hashPassword('customer123'), 'Customer']);

  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Cannot login to my account', 'I am getting an error when trying to login. The page shows "Invalid credentials" even though I am sure my password is correct. I have tried resetting but no email arrives.', 'Technical', 'High', 'Open', 4, null, 1, '2026-08-14T09:00:00Z']);
  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Invoice not received for last month', 'I have not received my invoice for July 2026. I need it for my accounting records. My account email is customer@helpdesk.com.', 'Billing', 'Medium', 'InProgress', 4, 2, 1, '2026-08-13T14:30:00Z']);
  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['App crashes on mobile device', 'The application crashes every time I open it on my iPhone 15. I have the latest iOS version. It shows a black screen then closes.', 'Technical', 'Critical', 'Open', 5, null, 1, '2026-08-15T08:15:00Z']);
  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['How to export data?', 'I want to export my data to CSV but cannot find the option. Where is it located?', 'General', 'Low', 'Resolved', 5, 3, 0, '2026-08-12T11:00:00Z']);
  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Double charged for subscription', 'I was charged twice for my monthly subscription on August 1st. Please refund the extra charge of $29.99.', 'Billing', 'High', 'Reopened', 4, 2, 0, '2026-08-10T16:45:00Z']);
  run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, assigned_to, auto_suggested, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Dashboard loading very slowly', 'The dashboard takes over 30 seconds to load. This started happening after the last update. Other pages load fine.', 'Technical', 'Medium', 'Open', 5, null, 0, '2026-08-15T07:00:00Z']);

  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [1, 2, 'Hi John, I can see your account is active. Let me check the authentication logs for your account.', 1, '2026-08-14T10:30:00Z']);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [1, 4, 'Thank you for looking into this. I really need access urgently.', 0, '2026-08-14T11:00:00Z']);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [2, 2, 'I have checked with our billing team. The invoice was generated but there was a delivery issue. Re-sending now.', 1, '2026-08-14T09:00:00Z']);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [2, 4, 'Thanks for the quick response! Looking forward to receiving it.', 0, '2026-08-14T09:30:00Z']);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [5, 2, 'I can see the duplicate charge. Initiating refund now.', 1, '2026-08-11T10:00:00Z']);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?)', [5, 4, 'The refund was supposed to appear within 3-5 days but it has been 5 days now. Still waiting.', 0, '2026-08-15T08:00:00Z']);

  run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', ['How to Reset Your Password', 'Go to the login page and click "Forgot Password". Enter your registered email address. You will receive a password reset link within 5 minutes. Click the link and set a new password. If you do not receive the email, check your spam folder.', 'Technical', 1]);
  run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', ['Understanding Your Invoice', 'Invoices are generated on the 1st of each month. You can download them from the Billing section in your dashboard. Each invoice includes a breakdown of charges, taxes, and payment details.', 'Billing', 1]);
  run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', ['How to Export Data to CSV', 'Navigate to the Dashboard, click the "Export" button in the top-right corner. Select your date range and data type. Click "Download CSV" to export. The file will be saved to your default downloads folder.', 'General', 1]);
  run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', ['Subscription Billing FAQ', 'Subscriptions are billed monthly on the date you signed up. You can view your billing history in the Account Settings. For refund requests, please submit a ticket with subject containing "refund".', 'Billing', 1]);
  run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', ['Troubleshooting App Crashes', 'If the app crashes, try these steps: 1) Force close and reopen the app. 2) Clear the app cache from Settings. 3) Ensure you have the latest version installed. 4) Restart your device. If the issue persists, submit a technical support ticket.', 'Technical', 1]);

  console.log('Database seeded successfully!');
  console.log('Demo accounts:');
  console.log('  Admin:    admin@helpdesk.com / admin123');
  console.log('  Agent:    agent@helpdesk.com / agent123');
  console.log('  Agent:    jane@helpdesk.com / agent123');
  console.log('  Customer: customer@helpdesk.com / customer123');
  console.log('  Customer: sarah@helpdesk.com / customer123');
}

seed().catch(console.error);
