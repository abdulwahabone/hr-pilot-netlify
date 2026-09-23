import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["ADMIN", "EMPLOYEE"]);
export const leaveType = pgEnum("leave_type", ["ANNUAL", "SICK", "UNPAID"]);
export const requestStatus = pgEnum("request_status", ["PENDING", "APPROVED", "REJECTED"]);
export const claimCategory = pgEnum("claim_category", ["FOOD", "TRAVEL", "MEDICAL", "OTHER"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: role("role").notNull().default("EMPLOYEE"),
  jobTitle: text("job_title").notNull(),
  department: text("department").notNull(),
  dateJoined: timestamp("date_joined", { withTimezone: true }).notNull(),
  annualLeaveDays: integer("annual_leave_days").notNull().default(14),
  sickLeaveDays: integer("sick_leave_days").notNull().default(14),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: leaveType("type").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    days: doublePrecision("days").notNull(),
    reason: text("reason").notNull(),
    status: requestStatus("status").notNull().default("PENDING"),
    decidedById: uuid("decided_by_id").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("leave_requests_user_id_idx").on(t.userId)]
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: claimCategory("category").notNull(),
    amount: doublePrecision("amount").notNull(),
    description: text("description").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    status: requestStatus("status").notNull().default("PENDING"),
    decidedById: uuid("decided_by_id").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("claims_user_id_idx").on(t.userId)]
);

export const payslips = pgTable(
  "payslips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // "YYYY-MM"
    month: text("month").notNull(),
    basicSalary: doublePrecision("basic_salary").notNull(),
    allowances: doublePrecision("allowances").notNull(),
    deductions: doublePrecision("deductions").notNull(),
    netPay: doublePrecision("net_pay").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("payslips_user_id_month_key").on(t.userId, t.month), index("payslips_user_id_idx").on(t.userId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  leaveRequests: many(leaveRequests, { relationName: "leaveRequestsByUser" }),
  decidedLeaves: many(leaveRequests, { relationName: "leaveRequestsDecidedBy" }),
  claims: many(claims, { relationName: "claimsByUser" }),
  decidedClaims: many(claims, { relationName: "claimsDecidedBy" }),
  payslips: many(payslips),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
    relationName: "leaveRequestsByUser",
  }),
  decidedBy: one(users, {
    fields: [leaveRequests.decidedById],
    references: [users.id],
    relationName: "leaveRequestsDecidedBy",
  }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  user: one(users, { fields: [claims.userId], references: [users.id], relationName: "claimsByUser" }),
  decidedBy: one(users, {
    fields: [claims.decidedById],
    references: [users.id],
    relationName: "claimsDecidedBy",
  }),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  user: one(users, { fields: [payslips.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type LeaveType = (typeof leaveType.enumValues)[number];
export type RequestStatus = (typeof requestStatus.enumValues)[number];
export type ClaimCategory = (typeof claimCategory.enumValues)[number];
