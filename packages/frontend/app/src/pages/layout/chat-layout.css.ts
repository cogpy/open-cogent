import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const hoverableItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px 8px 4px',
  color: cssVarV2('text/primary'),
  borderRadius: 8,
  ':hover': {
    backgroundColor: cssVarV2('layer/background/hoverOverlay'),
  },
});

export const hoverableIcon = style({
  width: 16,
  height: 16,
  flexShrink: 0,
  fontSize: 16,
});

export const hoverableLabel = style({
  width: 0,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 14,
});
