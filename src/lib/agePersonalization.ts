/**
 * Age-based personalization helpers.
 * "Young" = 18-35, "Mature" = 36+
 */

export type AgeProfile = "young" | "mature";

export const getAgeProfile = (age?: string): AgeProfile => {
  if (!age) return "mature"; // default to current copy
  if (age === "18 a 25 anos" || age === "26 a 35 anos") return "young";
  return "mature";
};

export const isYoungProfile = (age?: string): boolean => getAgeProfile(age) === "young";
