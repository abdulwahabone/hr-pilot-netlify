// Shapes returned by the /api/* functions (dates arrive as ISO strings).

export type Role = "ADMIN" | "EMPLOYEE";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  jobTitle: string;
  department: string;
  dateJoined: string;
  annualLeaveDays: number;
  sickLeaveDays: number;
};

export type UserSummary = Pick<User, "id" | "name" | "department" | "jobTitle">;

export type Leave = {
  id: string;
  type: "ANNUAL" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
};

export type Claim = {
  id: string;
  category: "FOOD" | "TRAVEL" | "MEDICAL" | "OTHER";
  amount: number;
  description: string;
  date: string;
  status: RequestStatus;
  createdAt: string;
};

export type Payslip = {
  id: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
};

export type WithUser<T> = T & { user: UserSummary };

export type LeaveBalance = {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
};
