import './index.css';
import '@afk/component/theme';

import { useEffect } from 'react';
import { Route, Routes } from 'react-router';

import { AuthGuard } from './components/auth-guard';
import { ChatPage } from './pages/chats/chat';
import { ChatsDashboard } from './pages/chats/chats-dashboard';
import { HomePage } from './pages/home';
import { ChatLayout } from './pages/layout/chat-layout';
import { LibraryDashboard } from './pages/library-dashboard';
import { MagicLinkPage } from './pages/magic-link';
import { SignInPage } from './pages/sign-in';
import { useSidebarStore } from './store/sidebar';
import { DocEditTest } from './pages/doc-edit-test';

const ChatsPage = () => {
  return (
    <Routes>
      <Route element={<ChatLayout />}>
        <Route index element={<ChatsDashboard />} />
        <Route path=":id" element={<ChatPage />} />
      </Route>
    </Routes>
  );
};

const LibraryPage = () => {
  return (
    <Routes>
      <Route element={<ChatLayout />}>
        <Route path="/" element={<LibraryDashboard />} />
        <Route path="/:id" element={<div>Document</div>} />
      </Route>
    </Routes>
  );
};

function App() {
  const { open } = useSidebarStore();
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', open);
  }, [open]);

  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/magic-link" element={<MagicLinkPage />} />
      <Route
        path="/chats/*"
        element={
          <AuthGuard>
            <ChatsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/library/*"
        element={
          <AuthGuard>
            <LibraryPage />
          </AuthGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGuard>
            <div className="p-8">Settings (coming soon)</div>
          </AuthGuard>
        }
      />
      <Route path="/doc-edit-test" element={<DocEditTest />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
