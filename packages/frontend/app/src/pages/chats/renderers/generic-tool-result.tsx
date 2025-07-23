import { IconButton } from '@afk/component';
import { ExpandCloseIcon, ExpandFullIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import * as styles from './generic-tool-result.css';

export const GenericToolResult = ({
  icon,
  title,
  children,
  count,
  actions,
  onCollapseChange,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  onCollapseChange?: (collapsed: boolean) => void;
}) => {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    onCollapseChange?.(!collapsed);
  };

  return (
    <div
      className={cn('border rounded-2xl overflow-hidden')}
      style={{
        boxShadow: `0px 1px 5px 0px rgba(0, 0, 0, 0.05)`,
      }}
      data-collapsed={collapsed}
    >
      <header
        className={cn(
          styles.header,
          'flex items-center gap-1 h-14 px-4 border-b'
        )}
      >
        <div className="size-5 shrink-0 text-xl flex items-center justify-center">
          {icon}
        </div>
        <div className="w-0 flex-1 text-sm font-medium text-text-primary">
          {title}
          {count ? (
            <span
              className="ml-1 font-normal"
              style={{
                color: cssVarV2.text.tertiary,
              }}
            >
              {count}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <IconButton
            onClick={toggleCollapsed}
            icon={collapsed ? <ExpandFullIcon /> : <ExpandCloseIcon />}
          />
        </div>
      </header>
      <main data-collapsed={collapsed} className={cn(styles.contentWrapper)}>
        <div className={'overflow-hidden'}>{children}</div>
      </main>
    </div>
  );
};
