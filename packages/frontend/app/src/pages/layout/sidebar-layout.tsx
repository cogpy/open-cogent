import { IconButton } from '@afk/component';
import { SidebarIcon } from '@blocksuite/icons/rc';

import AppSidebar from '@/components/ui/sidebar/sidebar';
import { useSidebarStore } from '@/store/sidebar';

export const SidebarLayout = ({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { toggleSidebar } = useSidebarStore();
  return (
    <div className="relative flex size-full justify-end">
      {/* sidebar */}
      <AppSidebar className="flex flex-col">
        {/* Head spacer */}
        <header style={{ height: 48 }} className="w-full"></header>
        <div className="flex-1 h-0">{sidebar}</div>
      </AppSidebar>

      {/* main */}
      <main className="w-0 flex-1 bg-white rounded-[8px] overflow-hidden">
        {children}
      </main>

      {/* actions */}
      <IconButton
        className="absolute"
        icon={<SidebarIcon />}
        style={{ position: 'absolute', left: 10, top: 10 }}
        onClick={toggleSidebar}
      />
    </div>
  );
};
