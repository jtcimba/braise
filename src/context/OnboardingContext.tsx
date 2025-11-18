import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../supabase-client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetRef?: React.RefObject<any>;
  targetPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  updateTargetPosition: (
    stepId: string,
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const ONBOARDING_STORAGE_KEY = '@onboarding_completed';
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Braise!',
    description:
      "Let's get you started by adding your first recipe from a URL. This will help you build your personal recipe collection.",
  },
  {
    id: 'from_url_button',
    title: 'Choose From URL',
    description:
      'Tap "From url" to add a recipe from any cooking website. This is the easiest way to get started!',
  },
  {
    id: 'url_input',
    title: 'Paste Recipe URL',
    description:
      "Copy a recipe URL from your favorite cooking website and paste it here. We'll grab all the details for you!",
  },
  {
    id: 'add_recipe_button',
    title: 'Add Recipe',
    description:
      'Once you\'ve pasted a valid URL, tap "Add recipe" to import it into your collection.',
  },
  {
    id: 'complete',
    title: "You're All Set! 🎉",
    description:
      "Great! You've successfully added your first recipe. You can now browse your recipes, edit them, and add more from any website.",
  },
];

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({children}: OnboardingProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(ONBOARDING_STEPS);
  const [_hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  // Check if user needs onboarding on app start
  useEffect(() => {
    checkOnboardingStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkOnboardingStatus = async () => {
    try {
      const userId = await supabase.auth
        .getUser()
        .then(({data: {user}}) => user?.id);
      if (!userId) {
        setHasCheckedOnboarding(true);
        return;
      }

      const onboardingCompleted = await AsyncStorage.getItem(
        `${ONBOARDING_STORAGE_KEY}_${userId}`,
      );

      if (!onboardingCompleted) {
        // Check if user has any recipes
        const recipes = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', userId)
          .then(({data: recipesData, error}) => {
            if (error) {
              console.error('Failed to fetch recipes', error);
              return [];
            }
            return recipesData;
          });

        if (recipes.length === 0) {
          // First time user with no recipes - start onboarding
          setIsOnboardingActive(true);
          console.log('Starting onboarding');
        } else {
          // User has recipes but no onboarding flag - mark as completed
          await completeOnboarding();
        }
      }

      setHasCheckedOnboarding(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCheckedOnboarding(true);
    }
  };

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      const userId = await supabase.auth
        .getUser()
        .then(({data: {user}}) => user?.id);
      if (userId) {
        await AsyncStorage.setItem(
          `${ONBOARDING_STORAGE_KEY}_${userId}`,
          'true',
        );
      }
      setIsOnboardingActive(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const updateTargetPosition = (
    stepId: string,
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) => {
    setSteps(prevSteps =>
      prevSteps.map(step => {
        return step.id === stepId ? {...step, targetPosition: position} : step;
      }),
    );
  };

  const value: OnboardingContextType = {
    isOnboardingActive,
    currentStep,
    steps,
    startOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    updateTargetPosition,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
