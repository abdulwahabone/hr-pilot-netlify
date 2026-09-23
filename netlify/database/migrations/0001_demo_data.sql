-- Demo workspace for HR Pilot: 1 admin + 20 employees with sample leave
-- requests, expense claims and payslips (the same data the original seed script
-- produced). Netlify applies this once per database, right after 0000_init, so
-- production and every deploy preview start populated.
--
-- Passwords: admin / admin, every employee / password123 (bcrypt, cost 10).
-- Dates are relative to when the migration runs: decided leaves sit in the
-- recent past, pending ones a few days to weeks ahead.
-- `ord` keeps "newest first" lists in the original creation order.

INSERT INTO "users" ("name", "email", "username", "password_hash", "role", "job_title", "department", "date_joined", "created_at")
VALUES
  ('Nurul Huda (HR Admin)', 'admin@hrpilot.com', 'admin', '$2b$10$RlF8mIUvYtWYPYgflEnX2.hlfuh2sexovem0/qJJEpYiIPt.SWsbK', 'ADMIN', 'HR Administrator', 'Human Resources', '2021-01-11', now() - interval '10 minutes');
--> statement-breakpoint

INSERT INTO "users" ("name", "email", "username", "password_hash", "role", "job_title", "department", "date_joined", "created_at")
SELECT e.name, e.username || '@hrpilot.com', e.username, '$2b$10$hFGIuprBQrv8334r8JppIePqr96EoRrhfb2QLjCZRvJxLtYfOxAlC', 'EMPLOYEE', e.job_title, e.department, e.date_joined::timestamptz,
       now() - interval '10 minutes' + e.ord * interval '1 millisecond'
FROM (VALUES
  (1, 'Ahmad Faiz Rahman', 'ahmad.faiz', 'Senior Software Engineer', 'Engineering', '2022-03-14'),
  (2, 'Siti Aminah Yusof', 'siti.aminah', 'Software Engineer', 'Engineering', '2023-06-01'),
  (3, 'Tan Wei Jian', 'wei.jian', 'Engineering Manager', 'Engineering', '2020-09-21'),
  (4, 'Priya Sharma', 'priya.sharma', 'QA Engineer', 'Quality Assurance', '2022-11-07'),
  (5, 'Muhammad Hafiz Ismail', 'hafiz.ismail', 'DevOps Engineer', 'Infrastructure', '2021-07-19'),
  (6, 'Nur Alia Zainal', 'alia.zainal', 'Product Manager', 'Product', '2021-02-08'),
  (7, 'Kevin Lee Chun Wai', 'kevin.lee', 'Software Engineer', 'Engineering', '2023-01-16'),
  (8, 'Farah Aziz', 'farah.aziz', 'UI/UX Designer', 'Design', '2022-05-30'),
  (9, 'Rajesh Kumar', 'rajesh.kumar', 'Data Analyst', 'Data', '2023-04-11'),
  (10, 'Chong Mei Ling', 'mei.ling', 'Senior Software Engineer', 'Engineering', '2021-10-04'),
  (11, 'Aiman Yusof', 'aiman.yusof', 'Software Engineer', 'Engineering', '2024-02-19'),
  (12, 'Nadia Rahman', 'nadia.rahman', 'QA Engineer', 'Quality Assurance', '2022-08-22'),
  (13, 'Daniel Wong', 'daniel.wong', 'DevOps Engineer', 'Infrastructure', '2023-09-05'),
  (14, 'Syafiqah Ismail', 'syafiqah.ismail', 'Product Designer', 'Design', '2022-01-17'),
  (15, 'Arun Prakash', 'arun.prakash', 'Data Scientist', 'Data', '2021-12-13'),
  (16, 'Hafizah Zainal', 'hafizah.zainal', 'Technical Writer', 'Product', '2023-03-27'),
  (17, 'Lim Jun Hao', 'jun.hao', 'Software Engineer', 'Engineering', '2024-05-06'),
  (18, 'Zulaikha Osman', 'zulaikha.osman', 'Scrum Master', 'Product', '2022-06-20'),
  (19, 'Vincent Tan', 'vincent.tan', 'Staff Engineer', 'Engineering', '2020-04-02'),
  (20, 'Amirul Hakim', 'amirul.hakim', 'IT Support Specialist', 'Operations', '2023-07-10')
) AS e(ord, name, username, job_title, department, date_joined);
--> statement-breakpoint

INSERT INTO "leave_requests" ("user_id", "type", "start_date", "end_date", "days", "reason", "status", "decided_by_id", "decided_at", "created_at")
SELECT u.id, l.type::leave_type,
       current_date + l.start_offset,
       current_date + l.start_offset + (l.duration - 1),
       l.duration, l.reason, l.status::request_status,
       CASE WHEN l.status = 'PENDING' THEN NULL ELSE (SELECT id FROM "users" WHERE username = 'admin') END,
       CASE WHEN l.status = 'PENDING' THEN NULL ELSE now() END,
       now() - interval '5 minutes' + l.ord * interval '1 millisecond'
FROM (VALUES
  (1, 'ahmad.faiz', 'ANNUAL', -10, 1, 'Family vacation', 'APPROVED'),
  (2, 'siti.aminah', 'SICK', -13, 1, 'Medical appointment', 'APPROVED'),
  (3, 'siti.aminah', 'UNPAID', 7, 2, 'Additional time off requested', 'PENDING'),
  (4, 'wei.jian', 'UNPAID', 7, 1, 'Additional time off requested', 'PENDING'),
  (5, 'wei.jian', 'ANNUAL', -19, 2, 'Attending a wedding', 'REJECTED'),
  (6, 'wei.jian', 'SICK', -22, 1, 'Recovering from minor surgery', 'APPROVED'),
  (7, 'priya.sharma', 'ANNUAL', -19, 1, 'Attending a wedding', 'REJECTED'),
  (8, 'hafiz.ismail', 'SICK', -22, 1, 'Recovering from minor surgery', 'APPROVED'),
  (9, 'hafiz.ismail', 'UNPAID', -25, 2, 'Additional time off requested', 'APPROVED'),
  (10, 'alia.zainal', 'UNPAID', -25, 1, 'Additional time off requested', 'APPROVED'),
  (11, 'alia.zainal', 'ANNUAL', 11, 2, 'Balik kampung for the holidays', 'PENDING'),
  (12, 'alia.zainal', 'SICK', -31, 1, 'Down with a cold', 'REJECTED'),
  (13, 'kevin.lee', 'ANNUAL', 11, 1, 'Balik kampung for the holidays', 'PENDING'),
  (14, 'farah.aziz', 'SICK', -31, 1, 'Down with a cold', 'REJECTED'),
  (15, 'farah.aziz', 'UNPAID', -34, 2, 'Additional time off requested', 'APPROVED'),
  (16, 'rajesh.kumar', 'UNPAID', -34, 1, 'Additional time off requested', 'APPROVED'),
  (17, 'rajesh.kumar', 'ANNUAL', -37, 2, 'Taking time off to recharge', 'APPROVED'),
  (18, 'rajesh.kumar', 'SICK', 15, 1, 'Fever and flu', 'PENDING'),
  (19, 'mei.ling', 'ANNUAL', -37, 1, 'Taking time off to recharge', 'APPROVED'),
  (20, 'aiman.yusof', 'SICK', 15, 1, 'Fever and flu', 'PENDING'),
  (21, 'aiman.yusof', 'UNPAID', -43, 2, 'Additional time off requested', 'REJECTED'),
  (22, 'nadia.rahman', 'UNPAID', -43, 1, 'Additional time off requested', 'REJECTED'),
  (23, 'nadia.rahman', 'ANNUAL', -46, 2, 'Personal trip', 'APPROVED'),
  (24, 'nadia.rahman', 'SICK', -49, 1, 'Food poisoning', 'APPROVED'),
  (25, 'daniel.wong', 'ANNUAL', -46, 1, 'Personal trip', 'APPROVED'),
  (26, 'syafiqah.ismail', 'SICK', -49, 1, 'Food poisoning', 'APPROVED'),
  (27, 'syafiqah.ismail', 'UNPAID', 19, 2, 'Additional time off requested', 'PENDING'),
  (28, 'arun.prakash', 'UNPAID', 19, 1, 'Additional time off requested', 'PENDING'),
  (29, 'arun.prakash', 'ANNUAL', -55, 2, 'Family vacation', 'REJECTED'),
  (30, 'arun.prakash', 'SICK', -58, 1, 'Medical appointment', 'APPROVED'),
  (31, 'hafizah.zainal', 'ANNUAL', -55, 1, 'Family vacation', 'REJECTED'),
  (32, 'jun.hao', 'SICK', -58, 1, 'Medical appointment', 'APPROVED'),
  (33, 'jun.hao', 'UNPAID', -61, 2, 'Additional time off requested', 'APPROVED'),
  (34, 'zulaikha.osman', 'UNPAID', -61, 1, 'Additional time off requested', 'APPROVED'),
  (35, 'zulaikha.osman', 'ANNUAL', 23, 2, 'Attending a wedding', 'PENDING'),
  (36, 'zulaikha.osman', 'SICK', -67, 1, 'Recovering from minor surgery', 'REJECTED'),
  (37, 'vincent.tan', 'ANNUAL', 23, 1, 'Attending a wedding', 'PENDING'),
  (38, 'amirul.hakim', 'SICK', -67, 1, 'Recovering from minor surgery', 'REJECTED'),
  (39, 'amirul.hakim', 'UNPAID', -70, 2, 'Additional time off requested', 'APPROVED')
) AS l(ord, username, type, start_offset, duration, reason, status)
JOIN "users" u ON u.username = l.username;
--> statement-breakpoint

INSERT INTO "claims" ("user_id", "category", "amount", "description", "date", "status", "decided_by_id", "decided_at", "created_at")
SELECT u.id, c.category::claim_category, c.amount, c.description,
       now() - c.days_ago * interval '1 day',
       c.status::request_status,
       CASE WHEN c.status = 'PENDING' THEN NULL ELSE (SELECT id FROM "users" WHERE username = 'admin') END,
       CASE WHEN c.status = 'PENDING' THEN NULL ELSE now() END,
       now() - interval '5 minutes' + c.ord * interval '1 millisecond'
FROM (VALUES
  (1, 'ahmad.faiz', 'FOOD', 35.00, 2, 'Team lunch with client', 'APPROVED'),
  (2, 'siti.aminah', 'TRAVEL', 95.00, 6, 'Parking fees for onsite meeting', 'PENDING'),
  (3, 'siti.aminah', 'MEDICAL', 150.00, 10, 'Prescription medication', 'REJECTED'),
  (4, 'wei.jian', 'MEDICAL', 150.00, 10, 'Prescription medication', 'REJECTED'),
  (5, 'wei.jian', 'OTHER', 105.00, 14, 'Work-from-home internet reimbursement', 'APPROVED'),
  (6, 'wei.jian', 'FOOD', 95.00, 18, 'Team lunch with client', 'APPROVED'),
  (7, 'priya.sharma', 'OTHER', 105.00, 14, 'Work-from-home internet reimbursement', 'APPROVED'),
  (8, 'hafiz.ismail', 'FOOD', 95.00, 18, 'Team lunch with client', 'APPROVED'),
  (9, 'hafiz.ismail', 'TRAVEL', 80.00, 22, 'Parking fees for onsite meeting', 'PENDING'),
  (10, 'alia.zainal', 'TRAVEL', 80.00, 22, 'Parking fees for onsite meeting', 'PENDING'),
  (11, 'alia.zainal', 'MEDICAL', 135.00, 26, 'Clinic visit co-payment', 'REJECTED'),
  (12, 'alia.zainal', 'OTHER', 90.00, 30, 'Office supplies purchase', 'APPROVED'),
  (13, 'kevin.lee', 'MEDICAL', 135.00, 26, 'Clinic visit co-payment', 'REJECTED'),
  (14, 'farah.aziz', 'OTHER', 90.00, 30, 'Office supplies purchase', 'APPROVED'),
  (15, 'farah.aziz', 'FOOD', 80.00, 34, 'Team lunch with client', 'APPROVED'),
  (16, 'rajesh.kumar', 'FOOD', 80.00, 34, 'Team lunch with client', 'APPROVED'),
  (17, 'rajesh.kumar', 'TRAVEL', 140.00, 38, 'Parking fees for onsite meeting', 'PENDING'),
  (18, 'rajesh.kumar', 'MEDICAL', 120.00, 42, 'Panel doctor consultation', 'REJECTED'),
  (19, 'mei.ling', 'TRAVEL', 140.00, 38, 'Parking fees for onsite meeting', 'PENDING'),
  (20, 'aiman.yusof', 'MEDICAL', 120.00, 42, 'Panel doctor consultation', 'REJECTED'),
  (21, 'aiman.yusof', 'OTHER', 75.00, 46, 'Mobile phone bill reimbursement', 'APPROVED'),
  (22, 'nadia.rahman', 'OTHER', 75.00, 46, 'Mobile phone bill reimbursement', 'APPROVED'),
  (23, 'nadia.rahman', 'FOOD', 65.00, 50, 'Team lunch with client', 'APPROVED'),
  (24, 'nadia.rahman', 'TRAVEL', 125.00, 54, 'Parking fees for onsite meeting', 'PENDING'),
  (25, 'daniel.wong', 'FOOD', 65.00, 50, 'Team lunch with client', 'APPROVED'),
  (26, 'syafiqah.ismail', 'TRAVEL', 125.00, 54, 'Parking fees for onsite meeting', 'PENDING'),
  (27, 'syafiqah.ismail', 'MEDICAL', 180.00, 58, 'Prescription medication', 'REJECTED'),
  (28, 'arun.prakash', 'MEDICAL', 180.00, 58, 'Prescription medication', 'REJECTED'),
  (29, 'arun.prakash', 'OTHER', 60.00, 62, 'Work-from-home internet reimbursement', 'APPROVED'),
  (30, 'arun.prakash', 'FOOD', 50.00, 66, 'Team lunch with client', 'APPROVED'),
  (31, 'hafizah.zainal', 'OTHER', 60.00, 62, 'Work-from-home internet reimbursement', 'APPROVED'),
  (32, 'jun.hao', 'FOOD', 50.00, 66, 'Team lunch with client', 'APPROVED'),
  (33, 'jun.hao', 'TRAVEL', 110.00, 70, 'Parking fees for onsite meeting', 'PENDING'),
  (34, 'zulaikha.osman', 'TRAVEL', 110.00, 70, 'Parking fees for onsite meeting', 'PENDING'),
  (35, 'zulaikha.osman', 'MEDICAL', 165.00, 74, 'Clinic visit co-payment', 'REJECTED'),
  (36, 'zulaikha.osman', 'OTHER', 120.00, 78, 'Office supplies purchase', 'APPROVED'),
  (37, 'vincent.tan', 'MEDICAL', 165.00, 74, 'Clinic visit co-payment', 'REJECTED'),
  (38, 'amirul.hakim', 'OTHER', 120.00, 78, 'Office supplies purchase', 'APPROVED'),
  (39, 'amirul.hakim', 'FOOD', 35.00, 82, 'Team lunch with client', 'APPROVED')
) AS c(ord, username, category, amount, days_ago, description, status)
JOIN "users" u ON u.username = c.username;
--> statement-breakpoint

-- Four months of payslips per employee: RM 500 allowances, 11.5% deductions.
INSERT INTO "payslips" ("user_id", "month", "basic_salary", "allowances", "deductions", "net_pay")
SELECT u.id, m.month, p.basic_salary, 500,
       round(p.basic_salary * 0.115, 2),
       round(p.basic_salary + 500 - round(p.basic_salary * 0.115, 2), 2)
FROM (VALUES
  ('ahmad.faiz', 8500),
  ('siti.aminah', 6000),
  ('wei.jian', 12000),
  ('priya.sharma', 5500),
  ('hafiz.ismail', 7000),
  ('alia.zainal', 9000),
  ('kevin.lee', 6000),
  ('farah.aziz', 6000),
  ('rajesh.kumar', 5800),
  ('mei.ling', 8500),
  ('aiman.yusof', 5800),
  ('nadia.rahman', 5500),
  ('daniel.wong', 6800),
  ('syafiqah.ismail', 6200),
  ('arun.prakash', 8000),
  ('hafizah.zainal', 5500),
  ('jun.hao', 5700),
  ('zulaikha.osman', 7500),
  ('vincent.tan', 11000),
  ('amirul.hakim', 4500)
) AS p(username, basic_salary)
JOIN "users" u ON u.username = p.username
CROSS JOIN (VALUES ('2026-03'), ('2026-04'), ('2026-05'), ('2026-06')) AS m(month);
