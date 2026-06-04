import React from 'react';
import {
  Dashboard,
  People,
  CalendarMonth,
  Assignment,
  FitnessCenter,
  Restaurant,
  Person,
  Settings,
  History,
  CloudUpload,
  PictureAsPdf,
  CheckCircle,
  Payments,
  CalendarViewMonth,
  Instagram,
  Star,
  Email,
  Language,
} from '@mui/icons-material';
import { Role } from '@/lib/api';

export type NavItem = {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles: Role[];
  children?: Omit<NavItem, 'roles'>[];
};

export type TaskItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

export const navItems: NavItem[] = [
  // User Role
  { text: 'Dashboard', icon: <Dashboard />, path: '/user/dashboard', roles: ['user'] },
  { text: 'Book Appointment', icon: <CalendarMonth />, path: '/user/book', roles: ['user'] },
  { text: 'Group Sessions', icon: <CalendarMonth />, path: '/user/group-sessions', roles: ['user'] },
  { text: 'My Appointments', icon: <History />, path: '/user/appointments', roles: ['user'] },
  { text: 'Profile', icon: <Person />, path: '/user/profile', roles: ['user'] },

  // Client Role
  { text: 'Dashboard', icon: <Dashboard />, path: '/client/dashboard', roles: ['client'] },
  { text: 'Meal Pics', icon: <Restaurant />, path: '/client/meals', roles: ['client'] },
  { text: 'Body Data', icon: <CloudUpload />, path: '/client/body-data', roles: ['client'] },
  { text: 'Appointments', icon: <CalendarMonth />, path: '/client/appointments', roles: ['client'] },
  { text: 'Group Sessions', icon: <CalendarMonth />, path: '/client/group-sessions', roles: ['client'] },
  { text: 'Diet Plan', icon: <PictureAsPdf />, path: '/client/diet-plan', roles: ['client'] },
  { text: 'Workout Plan', icon: <PictureAsPdf />, path: '/client/workout-plan', roles: ['client'] },
  { text: 'Workouts', icon: <FitnessCenter />, path: '/client/workouts', roles: ['client'] },
  { text: 'Profile', icon: <Person />, path: '/client/profile', roles: ['client'] },

  // Doctor Role
  { text: 'Dashboard', icon: <Dashboard />, path: '/doctor/dashboard', roles: ['doctor'] },
  { text: 'Users', icon: <People />, path: '/doctor/clients', roles: ['doctor'] },
  { text: 'Appointments', icon: <CalendarMonth />, path: '/doctor/appointments', roles: ['doctor'] },
  { text: 'Availability Map', icon: <CalendarViewMonth />, path: '/doctor/availability', roles: ['doctor'] },
  { text: 'Meal Pics', icon: <Restaurant />, path: '/doctor/meals', roles: ['doctor'] },
  { text: 'Body Data', icon: <CloudUpload />, path: '/doctor/body-data', roles: ['doctor'] },
  { text: 'Client Sessions', icon: <Assignment />, path: '/doctor/sessions', roles: ['doctor'] },
  { text: 'Group Sessions', icon: <CalendarMonth />, path: '/doctor/group-sessions', roles: ['doctor'] },
  { text: 'Workouts', icon: <CheckCircle />, path: '/doctor/workouts', roles: ['doctor'] },
  { 
    text: 'Website', 
    icon: <Language />, 
    path: '/doctor/website', 
    roles: ['doctor'],
    children: [
      { text: 'Services', icon: <Settings />, path: '/doctor/services' },
      { text: 'Instagram', icon: <Instagram />, path: '/doctor/instagram' },
      { text: 'Testimonials', icon: <Star />, path: '/doctor/testimonials' },
    ]
  },
  { text: 'Payments', icon: <Payments />, path: '/doctor/payments', roles: ['doctor'] },
  { text: 'Messages', icon: <Email />, path: '/doctor/messages', roles: ['doctor'] },
  { text: 'Settings', icon: <Settings />, path: '/doctor/settings', roles: ['doctor'] },
];

export const getRoleNavItems = (role?: Role) =>
  role ? navItems.filter((item) => item.roles.includes(role)) : [];

export const getRoleTasks = (role?: Role): TaskItem[] =>
  getRoleNavItems(role).map(({ text, path, icon }) => ({
    label: text,
    path,
    icon,
  }));
