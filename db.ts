import { User, Shift, Message, NotebookEntry, Category, ScheduleEntry } from './types';

const STORAGE_KEYS = {
  USERS: 'carejournal_users_v2',
  SHIFTS: 'carejournal_shifts_v2',
  MESSAGES: 'carejournal_messages_v2',
  JOURNAL: 'carejournal_journal_v2',
  CATEGORIES: 'carejournal_categories_v2',
  SCHEDULE: 'carejournal_schedule_v2'
};

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin Jane', username: 'admin', role: 'Admin', active: true, pin: '1234' },
  { id: '2', name: 'Caregiver Mark', username: 'mark', role: 'Staff', active: true, pin: '2222' },
  { id: '3', name: 'Caregiver Sarah', username: 'sarah', role: 'Staff', active: true, pin: '3333' }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'General Note' },
  { id: '2', name: 'Water' },
  { id: '3', name: 'Meals' },
  { id: '4', name: 'Hygiene' },
  { id: '5', name: 'Medication' },
  { id: '6', name: 'Mood' }
];

const safeGet = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`DB Error reading ${key}:`, e);
    return defaultValue;
  }
};

const safeSave = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`DB Error saving ${key}:`, e);
  }
};

export const db = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      safeSave(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => safeSave(STORAGE_KEYS.USERS, users),
  
  getShifts: (): Shift[] => safeGet(STORAGE_KEYS.SHIFTS, []),
  saveShifts: (shifts: Shift[]) => safeSave(STORAGE_KEYS.SHIFTS, shifts),
  
  getMessages: (): Message[] => safeGet(STORAGE_KEYS.MESSAGES, []),
  saveMessages: (messages: Message[]) => safeSave(STORAGE_KEYS.MESSAGES, messages),
  
  getJournalEntries: (): NotebookEntry[] => safeGet(STORAGE_KEYS.JOURNAL, []),
  saveJournalEntries: (entries: NotebookEntry[]) => safeSave(STORAGE_KEYS.JOURNAL, entries),

  getCategories: (): Category[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      safeSave(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(data);
  },
  saveCategories: (cats: Category[]) => safeSave(STORAGE_KEYS.CATEGORIES, cats),

  getSchedule: (): ScheduleEntry[] => safeGet(STORAGE_KEYS.SCHEDULE, []),
  saveSchedule: (sched: ScheduleEntry[]) => safeSave(STORAGE_KEYS.SCHEDULE, sched),
};