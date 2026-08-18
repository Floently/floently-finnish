import * as Haptics from 'expo-haptics';

export type LearningHapticEvent =
  | 'completion'
  | 'submit-success'
  | 'retry-success'
  | 'important-transition'
  | 'milestone'
  | 'attention'
  | 'error';

export type LearningHapticDriver = {
  notificationAsync: (type: Haptics.NotificationFeedbackType) => Promise<void>;
  impactAsync: (style: Haptics.ImpactFeedbackStyle) => Promise<void>;
};

const expoHapticDriver: LearningHapticDriver = {
  notificationAsync: Haptics.notificationAsync,
  impactAsync: Haptics.impactAsync,
};

export type LearningHapticOptions = {
  enabled?: boolean;
  driver?: LearningHapticDriver;
};

/**
 * Optional semantic feedback only. Learning state must never depend on this result.
 * Returns false when disabled or when the platform haptic API is unavailable/fails.
 */
export async function performLearningHaptic(
  event: LearningHapticEvent,
  options: LearningHapticOptions = {},
): Promise<boolean> {
  if (options.enabled === false) return false;

  const driver = options.driver ?? expoHapticDriver;

  try {
    switch (event) {
      case 'completion':
      case 'submit-success':
      case 'retry-success':
      case 'milestone':
        await driver.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      case 'important-transition':
        await driver.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return true;
      case 'attention':
        await driver.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return true;
      case 'error':
        await driver.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return true;
    }
  } catch {
    return false;
  }
}
