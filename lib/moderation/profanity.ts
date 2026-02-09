const blockedTerms = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "motherfucker",
  "cunt",
  "bastard",
  "nigger",
  "faggot",
  "whore",
  "slut",
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasProfanity(input: string): boolean {
  const normalized = normalize(input);
  return blockedTerms.some((term) => normalized.includes(term));
}
