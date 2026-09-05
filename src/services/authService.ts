import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../models/index';

const AUTH_KEY = 'krishi_marga_auth';

export const AuthService = {
  async getUserProfile(): Promise<UserProfile> {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.log('Auth load error:', e);
    }
    return { isLoggedIn: false }; // Guest by default
  },

  async loginWithGoogle(name: string, email: string): Promise<UserProfile> {
    const user: UserProfile = { isLoggedIn: true, authProvider: 'google', name, phoneOrEmail: email };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async loginWithPhone(phone: string): Promise<UserProfile> {
    const user: UserProfile = { isLoggedIn: true, authProvider: 'phone', name: 'Farmer (' + phone.slice(-4) + ')', phoneOrEmail: phone };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_KEY);
  }
};