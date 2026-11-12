export const TEAMMATE_MODELS = [
  "character_female_a", "character_female_b", "character_female_c",
  "character_female_d", "character_female_e", "character_female_f",
  "character_male_a", "character_male_b", "character_male_c",
  "character_male_d", "character_male_e", "character_male_f",
] as const;

export const PERSONALITIES = [
  { id: "quiet", label: "安静", bob: 0.55 },
  { id: "hasty", label: "急躁", bob: 2.4 },
  { id: "shy", label: "胆小", bob: 0.8 },
  { id: "bold", label: "大方", bob: 1.05 },
  { id: "curious", label: "好奇", bob: 1.45 },
  { id: "cool", label: "冷淡", bob: 0.28 },
] as const;

export function hashId(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function teammateLook(id: string) {
  const hash = hashId(id);
  return {
    model: TEAMMATE_MODELS[hash % TEAMMATE_MODELS.length],
    personality: PERSONALITIES[(hash >>> 8) % PERSONALITIES.length],
  };
}
