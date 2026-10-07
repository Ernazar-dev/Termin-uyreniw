import type { ThemeConfig } from 'antd';

/** Single source of design tokens for Ant Design; SCSS mirrors them in _tokens.scss. */
export const COLORS = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primarySoft: '#eef0ff',
  accent: '#f59e0b',
  teal: '#0d9488',
  pink: '#db2777',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  text: '#1e2140',
  textSecondary: '#585e7a',
  border: '#e5e7f0',
  bg: '#f5f6fb',
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.success,
    colorWarning: COLORS.warning,
    colorError: COLORS.error,
    colorInfo: COLORS.primary,
    colorLink: COLORS.primary,
    colorTextBase: COLORS.text,
    colorTextSecondary: COLORS.textSecondary,
    colorBorder: COLORS.border,
    colorBorderSecondary: COLORS.border,
    colorBgLayout: COLORS.bg,
    borderRadius: 12,
    controlHeight: 40,
    controlHeightLG: 48,
    lineHeight: 1.65,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 15,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#1e1b4b',
      headerHeight: 68,
      headerPadding: '0 32px',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(255, 255, 255, 0.72)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.09)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: '#4f46e5',
      darkItemSelectedColor: '#ffffff',
      itemBorderRadius: 12,
      itemMarginInline: 12,
      itemHeight: 46,
      itemSelectedBg: COLORS.primarySoft,
      itemSelectedColor: COLORS.primary,
      itemHoverBg: COLORS.bg,
    },
    Card: {
      borderRadiusLG: 18,
    },
    Table: {
      headerBg: COLORS.bg,
      rowHoverBg: '#f4f5ff',
    },
    Button: {
      primaryShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
      defaultShadow: 'none',
      fontWeight: 600,
      borderRadius: 10,
      borderRadiusLG: 12,
      borderRadiusSM: 8,
    },
    Input: { activeShadow: '0 0 0 3px rgba(79, 70, 229, 0.14)' },
    Progress: { defaultColor: COLORS.primary },
  },
};
