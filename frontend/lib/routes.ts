import { UserRole } from './types';

export function getRoleHomePath(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'EXECUTIVE':
      return '/executive';
    case 'MANAGER':
      return '/manager';
    case 'CONTRIBUTOR':
      return '/contributor';
    case 'VIEWER':
      return '/viewer';
  }
}

export function getRoleLabel(role: UserRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
