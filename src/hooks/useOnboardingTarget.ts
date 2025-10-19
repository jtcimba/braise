import {useRef, useCallback} from 'react';
import {useOnboarding} from '../context/OnboardingContext';

export function useOnboardingTarget(stepId: string) {
  const targetRef = useRef<any>(null);
  const {updateTargetPosition} = useOnboarding();

  const measureTarget = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          updateTargetPosition(stepId, {x, y, width, height});
        },
      );
    }
  }, [stepId, updateTargetPosition]);

  return {
    targetRef,
    measureTarget,
  };
}
