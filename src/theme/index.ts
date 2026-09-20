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

  // Pastel Grid Palette for Crop Cards matching Reference 4
  pastelTints: [
    '#FFF8E7', // 0. Banana (warm pale gold)
    '#FFEBEE', // 1. Tomato (soft pinkish-blush)
    '#EBF7EE', // 2. Chilli (gentle mint green)
    '#F5EEF8', // 3. Brinjal (soft pastel lavender)
    '#FFF8E7', // 4. Potato (warm pale cream)
    '#FFF8E7', // 5. Paddy (pale golden wheat)
    '#FFF9E6', // 6. Maize (light buttery yellow)
    '#E0F7FA', // 7. Cotton (very light cyan-ice)
    '#EBF7EE', // 8. Sugarcane (soft cane-green)
  ],
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, color: '#162836' },
  titleMedium: { fontSize: 19, fontWeight: '600' as const, color: '#162836' },
  bodyLarge: { fontSize: 16, lineHeight: 22, color: '#172B1E' },
  bodyMedium: { fontSize: 14, lineHeight: 20, color: '#5A6E60' },
  buttonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
};