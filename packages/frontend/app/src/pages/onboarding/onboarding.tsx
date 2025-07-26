import { Button, RowInput } from '@afk/component';
import { CollaborationIcon, GithubDuotoneIcon } from '@blocksuite/icons/rc';
import { type HTMLAttributes, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { OnboardingStep, useOnboardingStore } from '../../store/onboarding';
import { AuthLayout as OnboardingLayout } from '../layout/auth-layout';
import { MultiAgentPreview } from './assets/multi-agent-preview';
import { TodoListPreview } from './assets/todo-list-preview';
import { EnterAnim } from './enter-anim';
import { LeaveAnim } from './leave-anim';
import { OnboardingNext } from './onboarding-next';
import { ShowCase } from './show-case';

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
  onNavigate?: (step: OnboardingStep) => void;
}
const Logo = () => (
  <div
    className={cn(
      'size-[55px] bg-white rounded-full shadow-view',
      'flex items-center justify-center',
      'mb-6'
    )}
  >
    <img src="/logo.svg" alt="Open Agent" />
  </div>
);

const WelcomeStep: React.FC<StepProps> = ({ onNext }) => {
  const [show, setShow] = useState(true);
  return (
    <LeaveAnim
      show={show}
      onAnimationEnd={() => onNext?.()}
      className="flex flex-col items-center"
    >
      <EnterAnim
        items={[
          <Logo />,
          <h1 className="onboarding-title">Welcome to OpenAgent</h1>,
          <p className="onboarding-caption">
            Chat with all the frontier models and our multi-agent will have the
            job done
          </p>,
          <OnboardingNext className="mt-4" onClick={() => setShow(false)}>
            Get Started
          </OnboardingNext>,
        ]}
      />
    </LeaveAnim>
  );
};

const MultiAgentStep: React.FC<StepProps> = ({ onNext }) => {
  const [show, setShow] = useState(true);
  return (
    <LeaveAnim
      className="flex flex-col items-center"
      show={show}
      onAnimationEnd={() => onNext?.()}
    >
      <EnterAnim
        items={[
          <h1 className="onboarding-title">
            Multi-agent that collaborate together
          </h1>,
          <p className="onboarding-caption">
            Instead of chatting with singluar AI, all the frontier models
            collaborate together to finish your task with our multi-agents
          </p>,
          <MultiAgentPreview />,
          <OnboardingNext onClick={() => setShow(false)} className="mt-8">
            Continue
          </OnboardingNext>,
        ]}
      />
    </LeaveAnim>
  );
};

const TodoListStep: React.FC<StepProps> = ({ onNext }) => {
  const [show, setShow] = useState(true);

  return (
    <LeaveAnim
      className="flex flex-col items-center"
      show={show}
      onAnimationEnd={() => onNext?.()}
    >
      <EnterAnim
        items={[
          <h1 className="onboarding-title">
            Stop prompt‑chasing. Start decision‑making
          </h1>,
          <p className="onboarding-caption">
            Spec & context engineering give agents structure to plan, score, and
            surface options. You stay in control of the final call. Achieve
            more, struggle less.
          </p>,
          <TodoListPreview />,
          <OnboardingNext onClick={() => setShow(false)} className="mt-8">
            Continue
          </OnboardingNext>,
        ]}
      />
    </LeaveAnim>
  );
};

const ShowcaseStep: React.FC<StepProps> = ({ onNext }) => {
  const [show, setShow] = useState(true);
  return (
    <LeaveAnim
      className="flex flex-col items-center"
      onAnimationEnd={() => onNext?.()}
      show={show}
    >
      <EnterAnim
        items={[
          <h1 className="onboarding-title">
            See what OpenAgent can do for you
          </h1>,
          <p className="onboarding-caption mb-4">
            Spec & context engineering give agents structure to plan, score, and
            surface options. You stay in control of the final call. Achieve
            more, struggle less.
          </p>,
          <ShowCase />,
          <OnboardingNext className="mt-8" onClick={() => setShow(false)}>
            Continue
          </OnboardingNext>,
        ]}
      />
    </LeaveAnim>
  );
};

const SelectCard = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'p-6 border shadow-view rounded-2xl bg-white w-100 max-w-full',
        'hover:bg-[#fcfcfc] cursor-pointer transition-all',
        'flex flex-col gap-2',
        className
      )}
      {...props}
    />
  );
};

const SelectStep: React.FC<StepProps> = ({ onNext }) => {
  const [show, setShow] = useState(true);
  return (
    <LeaveAnim
      className="flex flex-col items-center"
      show={show}
      onAnimationEnd={() => onNext?.()}
    >
      <EnterAnim
        items={[
          <Logo />,
          <h1 className="onboarding-title">Ready to experience OpenAgent!?</h1>,
          <p className="onboarding-caption">
            Spec & context engineering give agents structure to plan, score, and
            surface options. You stay in control of the final call. Achieve
            more, struggle less.
          </p>,
          <div className="flex items-stretch gap-4 w-full max-w-[816px] flex-wrap justify-center">
            <SelectCard onClick={() => setShow(false)}>
              <CollaborationIcon className="size-6 text-icon-primary" />
              <p className="text-text-primary font-semibold text-lg leading-[26px]">
                Register and Join Waiting List
              </p>
              <p className="text-sm text-text-secondary leading-[22px]">
                Get early access to development version, no configuration
                required
              </p>
              <ul className="text-text-primary">
                <li>✓ &nbsp;First-time notification of product releases</li>
                <li>✓ &nbsp;Free real conversation replay</li>
                <li>✓ &nbsp;Priority access to new features</li>
              </ul>
            </SelectCard>
            <a href="https://github.com/AFK-surf/open-agent" target="_blank">
              <SelectCard className="h-full">
                <GithubDuotoneIcon className="size-6 text-icon-primary" />
                <p className="text-text-primary font-semibold text-lg leading-[26px]">
                  GitHub Self-deployment
                </p>
                <p className="text-sm text-text-secondary leading-[22px]">
                  Fully open source, start using immediately
                </p>
                <ul className="text-text-primary">
                  <li>✓ &nbsp;View complete source code</li>
                  <li>✓ &nbsp;Customize configuration as needed</li>
                  <li>✓ &nbsp;Participate in open source contributions</li>
                </ul>
              </SelectCard>
            </a>
          </div>,
        ]}
      />
    </LeaveAnim>
  );
};

const RegisterStep: React.FC<StepProps> = ({ onPrev }) => {
  const [show, setShow] = useState(true);
  return (
    <LeaveAnim
      className="flex flex-col items-center"
      show={show}
      onAnimationEnd={() => onPrev?.()}
    >
      <EnterAnim
        items={[
          <Logo />,
          <h1 className="onboarding-title">Register and Join Waiting List</h1>,
          <p className="onboarding-caption">
            Get early access to development version, no configuration required
          </p>,
          <div
            className={cn(
              'w-[440px] max-w-full-screen p-6 flex flex-col items-start',
              'border bg-white shadow-view rounded-2xl',
              'mb-8'
            )}
          >
            <label className="text-xs text-text-secondary">Email</label>
            <RowInput
              placeholder="Enter your email"
              style={{
                height: 40,
                fontSize: 14,
                fontWeight: 500,
              }}
              className="border w-full rounded-lg mt-1 px-2"
            />

            <Button
              className="mt-6"
              size="large"
              style={{ width: '100%', height: 40 }}
              variant="primary"
            >
              Submit
            </Button>
          </div>,
          <Button
            onClick={() => setShow(false)}
            style={{
              height: 40,
              width: 200,
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Back
          </Button>,
        ]}
      />
    </LeaveAnim>
  );
};

const WaitingStep: React.FC<StepProps> = ({ onNext }) => {
  return <div>WaitingStep</div>;
};

export const OnboardingPage: React.FC = () => {
  const { step, nextStep, prevStep } = useOnboardingStore();

  const el = useMemo(() => {
    switch (step) {
      case OnboardingStep.Welcome:
        return <WelcomeStep onNext={nextStep} />;
      case OnboardingStep.MultiAgent:
        return <MultiAgentStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.TodoList:
        return <TodoListStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.Showcase:
        return <ShowcaseStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.Select:
        return <SelectStep onNext={nextStep} onPrev={prevStep} />;
      case OnboardingStep.Register:
        return <RegisterStep onPrev={prevStep} />;
      case OnboardingStep.Waiting:
        return <WaitingStep />;
      default:
        return null;
    }
  }, [step, nextStep, prevStep]);

  return <OnboardingLayout>{el}</OnboardingLayout>;
};
