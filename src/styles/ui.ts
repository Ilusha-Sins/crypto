import type { CSSProperties } from 'react';

export const panelStyle: CSSProperties = {
  border: '1px solid #2a2a2a',
  borderRadius: 12,
  background: '#111',
  color: '#fff',
};

export const panelPaddedStyle: CSSProperties = {
  ...panelStyle,
  padding: 16,
};

export const panelHeaderStyle: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #2a2a2a',
  color: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

export const cardStyle: CSSProperties = {
  padding: 12,
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  background: '#171717',
  color: '#fff',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #2a2a2a',
  background: '#171717',
  color: '#fff',
  outline: 'none',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
};

export const buttonSecondaryStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2a2a2a',
  background: '#171717',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

export const buttonPrimaryStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2a2a2a',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

export const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
};

export const subtleTextStyle: CSSProperties = {
  opacity: 0.8,
};

export const dangerTextStyle: CSSProperties = {
  color: '#ff6b6b',
};

export const successTextStyle: CSSProperties = {
  color: '#51cf66',
};

export const liveBadgeStyle: CSSProperties = {
  display: 'inline-block',
  marginLeft: 8,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(37, 99, 235, 0.18)',
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.3,
};

export const errorBannerStyle: CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid #2a2a2a',
  color: '#ff6b6b',
  background: '#1a1111',
  fontSize: 13,
};

export function withDisabled(
  base: CSSProperties,
  disabled: boolean,
): CSSProperties {
  return {
    ...base,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

export function makeTabButtonStyle(active: boolean): CSSProperties {
  return {
    ...buttonSecondaryStyle,
    background: active ? '#1f1f1f' : '#111',
    borderColor: active ? '#3a3a3a' : '#2a2a2a',
  };
}