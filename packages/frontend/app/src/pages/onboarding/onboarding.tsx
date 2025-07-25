import { Button, RowInput } from '@afk/component';
import { Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import useSWR from 'swr';

import { ChatPlayback } from '@/components/chat/chat-playback';
import type { ChatMessage } from '@/store/copilot/types';

import { OnboardingStep, useOnboardingStore } from '../../store/onboarding';
import { AuthLayout as OnboardingLayout } from '../layout/auth-layout';

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const playbacks = {
  example: '/playbacks/example-playback.json',
};

const ExamplePlayback = ({ id }: { id: keyof typeof playbacks }) => {
  const { data: examplePlayback } = useSWR<ChatMessage[]>(
    playbacks[id],
    fetcher,
    {
      suspense: true,
    }
  );

  if (!examplePlayback) return null;
  return (
    <div className="border border-gray-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
      <ChatPlayback rawMessages={examplePlayback} />
    </div>
  );
};

const WelcomeStep: React.FC<StepProps> = ({ onNext }) => (
  <>
    <h1 className="text-2xl font-bold mb-4 text-center">
      Welcome to OpenAgent
    </h1>
    <p className="text-text-secondary mb-8 text-center max-w-md">
      Kick-start your journey into the world of agents. We‘ll guide you through
      a few quick steps to set up your first project.
    </p>
    <Button onClick={onNext}>Get Started</Button>
    <Suspense fallback={<div>Loading...</div>}>
      <ExamplePlayback id="example" />
    </Suspense>
  </>
);

const ShowcaseStep: React.FC<StepProps> = ({ onNext, onPrev }) => (
  <>
    <h1 className="text-xl font-semibold mb-4 text-center">
      Some of the things you can build
    </h1>
    <p className="text-text-secondary mb-6 text-center max-w-md">
      Choose an example to see a preview. (Coming soon)
    </p>
    <div className="flex gap-4 mb-8">
      <div className="w-40 h-24 bg-neutral-100 rounded" />
      <div className="w-40 h-24 bg-neutral-100 rounded" />
      <div className="w-40 h-24 bg-neutral-100 rounded" />
    </div>
    <div className="flex gap-3">
      <Button variant="plain" onClick={onPrev}>
        Back
      </Button>
      <Button onClick={onNext}>Next</Button>
    </div>
  </>
);

const JoinNowStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    if (!email) return;
    // For now just move to next step; in the future this will hit API / magic link.
    onNext?.();
  };

  const handleSignIn = () => navigate('/sign-in');

  return (
    <>
      <h1 className="text-xl font-semibold mb-6 text-center">
        Begin your journey into the world of agents
      </h1>

      <RowInput
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="mb-4"
      />

      <Button
        className="w-full mb-4"
        disabled={!email}
        onClick={handleContinue}
      >
        Continue with Email
      </Button>

      <Button variant="plain" className="w-full mb-6" onClick={handleSignIn}>
        Sign in
      </Button>

      <Button variant="plain" onClick={onPrev}>
        Back
      </Button>
    </>
  );
};

const SubmittedStep: React.FC<StepProps> = () => (
  <>
    <h1 className="text-xl font-semibold mb-4 text-center">
      We‘ve received your submission!
    </h1>
    <p className="text-text-secondary mb-8 text-center max-w-md">
      Check your inbox for a confirmation email. We‘ll be in touch soon.
    </p>
    <Button>
      <a href="/">Back to Home</a>
    </Button>
  </>
);

export const OnboardingPage: React.FC = () => {
  const { step, nextStep, prevStep } = useOnboardingStore();

  const el = useMemo(() => {
    switch (step) {
      case OnboardingStep.Welcome:
        return <WelcomeStep onNext={nextStep} />;
      case OnboardingStep.Showcase:
        return <ShowcaseStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.JoinNow:
        return <JoinNowStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.Submitted:
        return <SubmittedStep />;
      default:
        return null;
    }
  }, [step, nextStep, prevStep]);

  return <OnboardingLayout>{el}</OnboardingLayout>;
};
