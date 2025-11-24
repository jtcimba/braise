import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from '../supabase-client';

interface OnboardingContextType {
  showOnboardingModal: boolean;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const ONBOARDING_STORAGE_KEY = '@onboarding_completed';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({children}: OnboardingProviderProps) {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
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
          // First time user with no recipes - show onboarding modal
          setShowOnboardingModal(true);
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
      setShowOnboardingModal(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const value: OnboardingContextType = {
    showOnboardingModal,
    completeOnboarding,
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
