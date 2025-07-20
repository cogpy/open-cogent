import './index.css';

import { Route, Routes } from 'react-router';

import { AuthGuard } from './components/auth-guard';
import { HomePage } from './pages/home';
import { MagicLinkPage } from './pages/magic-link';
import { SignInPage } from './pages/sign-in';

function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/magic-link" element={<MagicLinkPage />} />
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
