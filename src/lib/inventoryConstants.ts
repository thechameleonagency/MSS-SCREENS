/** Doc-aligned fixed categories for materials (5). */
export const MATERIAL_CATEGORIES = [
  'Panel',
  'Inverter',
  'Structure',
  'Cable',
  'Balance of System',
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** Doc: 7 tool groupings. */
export const TOOL_CATEGORIES = [
  'Power tools',
  'Hand tools',
  'Measuring',
  'Safety',
  'Electrical',
  'Lifting',
  'Other',
] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
