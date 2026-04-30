import React, { useState } from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import { useAuth } from '@/contexts/AuthContext';

export const OnboardingTour: React.FC = () => {
  const { auth } = useAuth();
  const [enabled, setEnabled] = useState(() => {
    return !localStorage.getItem('vouch_tour_completed') && auth.isAuthenticated;
  });

  const employerSteps = [
    {
      element: '.dashboard-welcome',
      intro: 'Welcome to Vouch! This is your central command for managing projects.',
    },
    {
      element: '.nav-post-job',
      intro: 'Click here to post your first job offer to our verified network of tradespeople.',
    },
    {
       element: '.nav-favorites',
       intro: 'Keep track of the professionals you love. You can save their profiles for future jobs.',
    },
    {
       element: '.nav-messages',
       intro: 'Communicate with prospective hires directly and securely here.',
    }
  ];

  const tradespersonSteps = [
    {
      element: '.dashboard-welcome',
      intro: 'Welcome to Vouch! Your next big opportunity starts here.',
    },
    {
      element: '.nav-find-jobs',
      intro: 'Browse and bid on high-quality, verified jobs across Liberia.',
    },
    {
      element: '.nav-profile',
      intro: 'Make sure your profile is complete. Here you can upload verification docs to get the Blue Badge.',
    },
    {
        element: '.nav-my-bids',
        intro: 'Track the status of your active proposals and contract negotiations.',
    }
  ];

  const onExit = () => {
    setEnabled(false);
    localStorage.setItem('vouch_tour_completed', 'true');
  };

  const steps = auth.user?.user_type === 'employer' ? employerSteps : tradespersonSteps;

  if (!auth.isAuthenticated) return null;

  return (
    <Steps
      enabled={enabled}
      steps={steps}
      initialStep={0}
      onExit={onExit}
      options={{
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        doneLabel: 'Got it!',
        nextLabel: 'Next',
        prevLabel: 'Previous'
      }}
    />
  );
};
