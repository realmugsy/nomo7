// Grind system logic
export interface GrindState {
  completedLevels: number;
  totalExperience: number;
  level: number;
}

// Initial grind state
export const INITIAL_GRIND_STATE: GrindState = {
  completedLevels: 0,
  totalExperience: 0,
  level: 1
};

// Experience required for each level
const EXPERIENCE_PER_LEVEL = 100;

// Gain experience
export const gainExperience = (currentState: GrindState, experience: number): GrindState => {
  const newExperience = currentState.totalExperience + experience;
  const newLevel = Math.floor(newExperience / EXPERIENCE_PER_LEVEL) + 1;
  
  return {
    ...currentState,
    totalExperience: newExperience,
    level: newLevel
  };
};

// Complete a level
export const completeLevel = (currentState: GrindState): GrindState => {
  return gainExperience(
    {
      ...currentState,
      completedLevels: currentState.completedLevels + 1
    },
    50 // 50 experience per completed level
  );
};

// Get experience needed for next level
export const getExperienceToNextLevel = (currentState: GrindState): number => {
  const nextLevel = currentState.level + 1;
  const experienceNeeded = nextLevel * EXPERIENCE_PER_LEVEL;
  return experienceNeeded - currentState.totalExperience;
};