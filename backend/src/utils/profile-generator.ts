// Random profile generator for user names and avatars

const ADJECTIVES = [
  'Swift', 'Brave', 'Clever', 'Bold', 'Wild', 'Bright', 'Silent', 'Quick',
  'Fierce', 'Gentle', 'Sharp', 'Calm', 'Strong', 'Wise', 'Noble', 'Eager',
  'Proud', 'Loyal', 'Daring', 'Keen', 'Agile', 'Witty', 'Stealth', 'Vibrant',
  'Mystic', 'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Shadow', 'Storm',
  'Frost', 'Flame', 'Thunder', 'Lightning', 'Crystal', 'Diamond', 'Ruby', 'Jade'
]

const ANIMALS = [
  'Fox', 'Wolf', 'Tiger', 'Eagle', 'Bear', 'Raven', 'Lion', 'Shark',
  'Hawk', 'Owl', 'Panther', 'Falcon', 'Dragon', 'Phoenix', 'Lynx', 'Viper',
  'Stallion', 'Jaguar', 'Cheetah', 'Cobra', 'Rhino', 'Elephant', 'Dolphin', 'Whale',
  'Spider', 'Scorpion', 'Mantis', 'Butterfly', 'Hummingbird', 'Swan', 'Crane', 'Turtle',
  'Raccoon', 'Squirrel', 'Rabbit', 'Deer', 'Moose', 'Bison', 'Penguin', 'Seal'
]

export interface UserProfile {
  displayName: string
  nickname: string
  avatarSeed: string
}

/**
 * Generate a random user profile with adjective + animal name
 */
export function generateRandomProfile(): UserProfile {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  
  const displayName = `${adjective} ${animal}`
  const nickname = `${adjective[0]}${animal[0]}`.toUpperCase()
  const avatarSeed = `${adjective.toLowerCase()}-${animal.toLowerCase()}`
  
  return {
    displayName,
    nickname,
    avatarSeed
  }
}

/**
 * Generate avatar URL using DiceBear API
 */
export function getAvatarUrl(seed: string, size = 64): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=${size}`
}

/**
 * Validate that a profile has all required fields
 */
export function isValidProfile(profile: Partial<UserProfile>): profile is UserProfile {
  return !!(profile.displayName && profile.nickname && profile.avatarSeed)
}

/**
 * Create a fallback profile if generation fails
 */
export function createFallbackProfile(): UserProfile {
  const timestamp = Date.now().toString().slice(-4)
  return {
    displayName: `Guest ${timestamp}`,
    nickname: 'GU',
    avatarSeed: `guest-${timestamp}`
  }
}