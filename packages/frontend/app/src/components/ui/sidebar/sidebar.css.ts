import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const container = style({
  transition: `width 0.2s cubic-bezier(.13,.67,.1,1)`,
  borderRight: `1px solid ${cssVarV2.layer.insideBorder.border}`,
});
export const resizing = style({
  transition: `none`,
});

export const resizeTrigger = style({});
export const resizeTriggerBar = style({
  opacity: 0,
  selectors: {
    [`${resizeTrigger}:hover &, &.resizing`]: {
      opacity: 1,
    },
  },
});
