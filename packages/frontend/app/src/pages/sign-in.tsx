/* eslint-disable @typescript-eslint/no-misused-promises */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

type Step = 'methodSelect' | 'password' | 'magic';

interface OAuthButtonProps {
  provider: string;
  redirectUrl?: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, redirectUrl }) => {
  const handleClick = async () => {
    // Call preflight to get redirect URL (fallback to /oauth/login)
    try {
      const res = await fetch(`/api/oauth/${provider}/preflight`, {
        method: 'GET',
      });
      if (res.ok) {
        const { redirect } = await res.json();
        window.location.href = redirect;
      } else {
        // fallback – many providers accept this path directly
        window.location.href = `/api/oauth/${provider}?redirect_uri=${encodeURIComponent(
          redirectUrl || window.location.origin + '/oauth/callback'
        )}`;
      }
    } catch {
      window.location.href = `/api/oauth/${provider}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full mb-2 py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-100"
    >
      Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </button>
  );
};

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';

  const {
    isAuthenticated,
    isLoading,
    error,
    clearError,
    checkUserByEmail,
    signInPassword,
    sendMagicLink,
    verifyMagicLink,
  } = useAuthStore();

  // Local UI state
  const [step, setStep] = useState<Step>('methodSelect');
  const [email, setEmail] = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Navigate after login effect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleEmailContinue = async () => {
    clearError();
    if (!email) return;
    try {
      const info = await checkUserByEmail(email);
      setHasPassword(info.hasPassword);
      if (info.hasPassword) {
        setStep('password');
      } else {
        // automatically send magic link
        await sendMagicLink(email, { redirectUrl });
        setCooldown(60);
        setStep('magic');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordLogin = async () => {
    clearError();
    try {
      await signInPassword(email, password);
      navigate(redirectUrl, { replace: true });
    } catch {
      /* handled by store */
    }
  };

  const handleVerifyOtp = async () => {
    clearError();
    if (otp.length !== 6) return;
    try {
      await verifyMagicLink(email, otp);
      navigate(redirectUrl, { replace: true });
    } catch {}
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    await sendMagicLink(email, { redirectUrl });
    setCooldown(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        {step === 'methodSelect' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Sign in</h2>
            <OAuthButton provider="google" />
            <div className="flex items-center my-4">
              <hr className="flex-1" />
              <span className="px-2 text-xs text-gray-500">OR</span>
              <hr className="flex-1" />
            </div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-3 py-2 border rounded mb-3"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              onClick={() => void handleEmailContinue()}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded disabled:opacity-50"
              disabled={!email || isLoading}
            >
              Continue
            </button>
          </>
        )}

        {step === 'password' && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">
              Enter Password
            </h2>
            <p className="text-sm mb-2 text-gray-700">{email}</p>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded mb-3"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <button
              onClick={() => void handlePasswordLogin()}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded disabled:opacity-50"
              disabled={!password || isLoading}
            >
              Sign in
            </button>
            <button
              onClick={() => {
                void (async () => {
                  await sendMagicLink(email, { redirectUrl });
                  setCooldown(60);
                  setStep('magic');
                })();
              }}
              className="mt-3 w-full text-sm text-indigo-600 hover:underline"
            >
              Use a 6-digit code instead
            </button>
          </>
        )}

        {step === 'magic' && (
          <>
            <h2 className="text-xl font-bold mb-2 text-center">
              Enter 6-digit code
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              We emailed a code to <strong>{email}</strong>
            </p>
            <input
              type="text"
              maxLength={6}
              className="w-full px-3 py-2 border rounded mb-3 tracking-widest text-center"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <button
              onClick={() => void handleVerifyOtp()}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded disabled:opacity-50"
              disabled={otp.length !== 6 || isLoading}
            >
              Verify & Sign in
            </button>
            <button
              onClick={() => void resendOtp()}
              disabled={cooldown > 0}
              className="mt-3 w-full text-sm text-indigo-600 hover:underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
            {hasPassword && (
              <button
                onClick={() => setStep('password')}
                className="mt-2 w-full text-sm text-indigo-600 hover:underline"
              >
                Use password instead
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
