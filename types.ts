export type Role = 'Staff' | 'Admin';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  pin: string; // 4-digit PIN
}

export type ShiftStatus = 'Scheduled' | 'ClockedIn' | 'Completed' | 'Open';

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string; // ISO
  endTime: string; // ISO
  clockInTime?: string; // ISO
  clockOutTime?: string; // ISO
  status: ShiftStatus;
  coverageRequested: boolean;
  approvedByAdmin: boolean;
  acknowledgedBy: string[];
  patientMood?: number; // 1-10
  isCritical?: boolean;
}

export interface ScheduleEntry {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  note?: string;
  coverageRequested?: boolean;
  interestedStaffId?: string;
}

export type Severity = 'Info' | 'Important' | 'Critical';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  severity: Severity;
  createdAt: string;
  acknowledgedBy: string[];
}

export interface NotebookEntry {
  id: string;
  shiftId?: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD for grouping
  category: string;
  text: string;
  timestamp: string;
  isCritical: boolean;
  // shiftName is used for display and AI summary generation
  shiftName?: string;
}

export interface Category {
  id: string;
  name: string;
}