export const Colors = {
  primary: '#2E7D32', // Official Agricultural Green
  primaryDark: '#1B5E20', // Deep Forest Green
  primaryLight: '#4CAF50', // Leaf Green
  primarySoft: '#E8F5E9', // Soft Leaf Tint
  earthBeige: '#F4F7F4', // Soft Off-White Background
  background: '#F8FAF8', // Clean Soft Agricultural Surface
  surface: '#FFFFFF', // Pure White Cards
  cardBorder: '#E8ECE8', // Subtle border
  textPrimary: '#172B1E', // High contrast readable deep navy/green
  textNavy: '#162836', // Deep navy for screen headings
  textSecondary: '#5A6E60', // Soft readable secondary
  textMuted: '#7E8E84',
  accentAmber: '#D97706',
  danger: '#C53030',
  warning: '#DD6B20',
  success: '#2E7D32',
  
  // Status Pills
  statusHealthyBg: '#E8F8EE',
  statusHealthyText: '#1E7E34',
  statusIssueBg: '#FDF0E6',
  statusIssueText: '#BA4A00',
  statusPendingBg: '#EBF2FA',
  statusPendingText: '#2874A6',

  // Bottom Navigation
  tabActiveBg: '#E2F4E7',
  tabActiveText: '#1B5E20',
  tabInactive: '#78909C',

  // Pastel Grid Palette for Crop Cards
  pastelTints: [
    '#FFF8E1', // Banana / Maize pale gold
    '#FFEBEE', // Tomato / Chilli pale blush
    '#E8F5E9', // Mint / Leaf pale green
    '#F3E5F5', // Brinjal pale lavender
    '#EFEBE9', // Potato / Root pale beige
    '#E0F7FA', // Cotton / Ice pale cyan
    '#FFF3E0', // Grain / Pulse pale peach
    '#E8EAF6', // Indigo pale blue
    '#F1F8E9', // Sugarcane pale lime
  ],
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, color: '#162836' },
  titleMedium: { fontSize: 19, fontWeight: '600' as const, color: '#162836' },
  bodyLarge: { fontSize: 16, lineHeight: 22, color: '#172B1E' },
  bodyMedium: { fontSize: 14, lineHeight: 20, color: '#5A6E60' },
  buttonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
};