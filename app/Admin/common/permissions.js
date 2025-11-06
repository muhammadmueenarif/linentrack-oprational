"use client";

import { db } from '../../config';
import { doc, getDoc } from 'firebase/firestore';

export const NavbarPermissionKeys = {
  newOrder: 'permNewOrder',
  pickupDeliveries: 'permPickupDeliveries',
  cleaning: 'permCleaning',
  ironingFolding: 'permIroningFolding',
  ready: 'permReady',
  details: 'permDetails',
  machine: 'permMachine',
};

export function getStoredUserData() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getUserPermissions() {
  const userData = getStoredUserData();
  if (!userData) return {};

  // Admins get full access by default
  if (userData.roleType === 'Admin') {
    return { __admin: true };
  }

  // Try per-user cache first
  try {
    const cacheKey = `userPermissions:${userData.id}`;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      return JSON.parse(cached) || {};
    }
  } catch {}

  // Staff: fetch their storeStaff doc by id to read permissions
  try {
    const staffId = userData.id;
    if (!staffId) return {};
    const staffRef = doc(db, 'storeStaff', staffId);
    const snap = await getDoc(staffRef);
    const data = snap.exists() ? snap.data() : {};
    const perms = data.permissions || {};
    if (typeof window !== 'undefined') {
      const cacheKey = `userPermissions:${userData.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(perms));
    }
    return perms;
  } catch {
    return {};
  }
}

export async function hasPermission(key) {
  const userData = getStoredUserData();
  if (!userData) return false;
  if (userData.roleType === 'Admin') return true;
  // POS or Operations staff may still be restricted by specific keys
  const perms = await getUserPermissions();
  if (perms.__admin) return true;
  return !!perms[key];
}

export function clearCachedPermissions(userId) {
  try {
    if (typeof window !== 'undefined') {
      if (userId) {
        localStorage.removeItem(`userPermissions:${userId}`);
      } else {
        // Fallback: clear any keys that match the prefix
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('userPermissions:')) localStorage.removeItem(k);
        });
      }
    }
  } catch {}
}


