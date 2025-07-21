import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  boxShadow: '0px 2px 3px rgba(0,0,0,0.05)',
});

export const modelSelector = style({
  color: cssVarV2.icon.primary,
});
export const send = style({
  backgroundColor: cssVarV2.button.primary,
  borderRadius: '50%',
  width: 28,
  height: 28,
  cursor: 'pointer',

  selectors: {
    '&[data-disabled]': {
      backgroundColor: cssVarV2.button.disable,
    },
  },
});
