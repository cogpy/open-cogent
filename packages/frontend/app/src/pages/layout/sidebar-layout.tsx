import { IconButton } from '@afk/component';
import { SidebarIcon } from '@blocksuite/icons/rc';

import { DocPanel } from '@/components/doc-panel/doc-panel';
import AppSidebar from '@/components/ui/sidebar/sidebar';
import { useDocPanelStore } from '@/store/doc-panel';
import { useSidebarStore } from '@/store/sidebar';

export const SidebarLayout = ({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { toggleSidebar, width, open: sidebarOpen } = useSidebarStore();
  const { isOpen: isDocPanelOpen } = useDocPanelStore();

  return (
    <div className="relative flex size-full justify-end">
      {/* sidebar */}
      <AppSidebar className="flex flex-col">
        {/* Head spacer */}
        <header className="w-full h-15 p-4 flex items-center">
          <img src="/logo.svg" alt="logo" className="w-6 h-6" />
        </header>
        <div className="flex-1 h-0">{sidebar}</div>
      </AppSidebar>

      {/* main content area */}
      <main className="w-0 flex-1 h-full flex gap-2">
        {/* chat panel */}
        <div
          className={`bg-white rounded-[8px] overflow-hidden transition-all duration-300 ${
            isDocPanelOpen ? 'flex-1' : 'w-full'
          }`}
        >
          {children}
        </div>

        {/* doc panel */}
        {isDocPanelOpen && (
          <div className="flex-1 bg-white rounded-[8px] overflow-hidden">
            <DocPanel />
          </div>
        )}
      </main>

      {/* actions */}
      <IconButton
        size="24"
        className="absolute"
        icon={<SidebarIcon />}
        style={{
          position: 'absolute',
          left: sidebarOpen ? width - 36 : 12,
          top: 14,
          transition: 'all 0.2s ease',
        }}
        onClick={toggleSidebar}
      />
    </div>
  );
};
