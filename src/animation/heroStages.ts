/**
 * Progress windows (0–1) for the hero construction sequence. Plain data with no
 * dependencies, shared by the 3D scene, the frame-sequence player, the DOM
 * overlay and the ambience.
 */
export interface HeroStage {
  id: string;
  number: string;
  label: string;
  caption: string;
  range: readonly [number, number];
}

export const HERO_STAGES: readonly HeroStage[] = [
  { id: 'origin', number: '00', label: 'Origin', caption: 'A single member, waiting for a purpose.', range: [0, 0.08] },
  { id: 'foundation', number: '01', label: 'Foundation', caption: 'Ground set out. Slabs and footings placed.', range: [0.08, 0.25] },
  { id: 'structure', number: '02', label: 'Structural development', caption: 'Piers rise. Steel moves into position.', range: [0.25, 0.45] },
  { id: 'assembly', number: '03', label: 'Assembly', caption: 'Deck, barriers and lighting arrive independently.', range: [0.45, 0.62] },
  { id: 'alignment', number: '04', label: 'Alignment', caption: 'Every member settles into line. Seams close.', range: [0.62, 0.75] },
  { id: 'completion', number: '05', label: 'Completion', caption: 'One structure. Ready to carry what moves.', range: [0.75, 0.88] },
  { id: 'identity', number: '06', label: 'Identity', caption: '', range: [0.88, 1] },
];

export function stageIndexAt(p: number): number {
  for (let i = HERO_STAGES.length - 1; i >= 0; i--) {
    if (p >= HERO_STAGES[i].range[0]) return i;
  }
  return 0;
}
