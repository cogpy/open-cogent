import { SearchIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';

import { cn } from '@/lib/utils';

export const Cmdk = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'h-[34px] rounded-lg bg-white border flex items-center px-2 gap-3',
        className
      )}
      style={{ boxShadow: `0px 1px 5px rgba(0,0,,0,0.05)` }}
    >
      <div className="size-5 items-center flex justify-center">
        <SearchIcon className="text-xl" />
      </div>
      <div
        className="text-sm truncate w-0 flex-1"
        style={{ color: cssVarV2.text.secondary }}
      >
        Search ⌘K
      </div>
    </div>
  );
};
