import { PanelResizeHandle } from 'react-resizable-panels';
import { NavLink, Outlet } from 'react-router-dom';

import { ResizablePanel, ResizablePanelGroup } from '../components/resizable';
import { useAuthStore } from '../store/auth';

const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
  'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors truncate ' +
  (isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100');

export const ChatLayout = () => {
  const { user } = useAuthStore();
  const chats = [
    'Discover the Art of Meaning',
    'Unraveling the Secrets of...',
    'Exploring the Art of Meani...',
    'Navigating the World of In...',
  ];

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen w-screen">
      {/* Primary sidebar */}
      <ResizablePanel
        defaultSize={15}
        minSize={12}
        maxSize={25}
        className="bg-white border-r border-gray-200 flex flex-col"
      >
        <div className="p-4 flex items-center space-x-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-800 uppercase">
            {(user?.name || user?.email || '?')[0]}
          </div>
          <span className="text-sm font-medium truncate">
            {user?.name || user?.email}
          </span>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          <NavLink to="/chats" end className={navLinkClasses}>
            Chat
          </NavLink>
          <NavLink to="/library" className={navLinkClasses}>
            Library
          </NavLink>
          <NavLink to="/settings" className={navLinkClasses}>
            Settings
          </NavLink>
        </nav>
      </ResizablePanel>

      <PanelResizeHandle className="w-1 bg-gray-100 cursor-col-resize" />

      {/* Chat list */}
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={35}
        className="bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden"
      >
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Chats
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
          {chats.map((title, i) => (
            <NavLink
              key={title}
              to={`/chats/${i}`}
              className={({ isActive }) =>
                'block px-4 py-2 text-sm truncate ' +
                (isActive ? 'bg-gray-200' : 'hover:bg-gray-100')
              }
            >
              {title}
            </NavLink>
          ))}
        </div>
      </ResizablePanel>

      <PanelResizeHandle className="w-1 bg-gray-100 cursor-col-resize" />

      {/* Main content */}
      <ResizablePanel defaultSize={65} minSize={30} className="bg-white">
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
