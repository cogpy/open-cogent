import './index.css';
import '@afk/component/theme';

import { Route, Routes } from 'react-router';

import { AuthGuard } from './components/auth-guard';
import { ChatPage } from './pages/chat';
import { ChatsDashboard } from './pages/chats-dashboard';
import { HomePage } from './pages/home';
import { ChatLayout } from './pages/layout/chat-layout';
import { LibraryDashboard } from './pages/library-dashboard';
import { MagicLinkPage } from './pages/magic-link';
import { SignInPage } from './pages/sign-in';

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
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/magic-link" element={<MagicLinkPage />} />
      <Route path="/chats/*" element={<ChatsPage />} />
      <Route path="/library/*" element={<LibraryPage />} />
      <Route
        path="/settings"
        element={
          <AuthGuard>
            <div className="p-8">Settings (coming soon)</div>
          </AuthGuard>
        }
      />
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
