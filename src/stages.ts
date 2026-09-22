import { EnemyType } from './constants';
import type { StageDef } from './types';

/**
 * Each stage: 13 strings of length 13.
 * Chars: . empty  B brick  S steel  W water  G grass  I ice  E eagle
 * Eagle must be on last row center (col 6) so player can spawn at col 4.
 */

function eq(n: number, types: EnemyType[]): EnemyType[] {
  const out: EnemyType[] = [];
  for (let i = 0; i < n; i++) out.push(types[i % types.length]);
  return out;
}

const E = EnemyType;

export const STAGES: StageDef[] = [
  {
    name: 'Stage 1',
    rows: [
      '.............',
      '...B...B.....',
      '...B...B.....',
      '.............',
      '..BBB.BBB....',
      '.............',
      'BB.........BB',
      'BB...SSS...BB',
      '.............',
      '...B.....B...',
      '...B.....B...',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Basic, E.Basic, E.Basic, E.Fast]),
  },
  {
    name: 'Stage 2',
    rows: [
      '.............',
      '.BBB.....BBB.',
      '.B.........B.',
      '.B..BB.BB..B.',
      '.............',
      'SS.........SS',
      '.....GGG.....',
      'BB...GGG...BB',
      '.............',
      '.B.B.....B.B.',
      '.B.B.....B.B.',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Basic, E.Basic, E.Fast, E.Basic]),
  },
  {
    name: 'Stage 3',
    rows: [
      '....WWW......',
      'BB..WWW...BB.',
      'BB.........BB',
      '....BBB......',
      'SS.......SS..',
      '.....B.B.....',
      'GGG.......GGG',
      '.....SSS.....',
      'B.B.......B.B',
      'B.B..BBB..B.B',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Basic, E.Fast, E.Fast, E.Basic, E.Power]),
  },
  {
    name: 'Stage 4',
    rows: [
      'S.S.......S.S',
      'S.S.BBBBB.S.S',
      '.............',
      '.BBB.....BBB.',
      '.............',
      'WW.........WW',
      'WW...III...WW',
      '.....III.....',
      '.B.........B.',
      '.B.SS...SS.B.',
      '.............',
      '.............',
      '.....SES.....',
    ],
    enemies: eq(20, [E.Fast, E.Basic, E.Power, E.Fast]),
  },
  {
    name: 'Stage 5',
    rows: [
      '.............',
      '.SSSS...SSSS.',
      '.S.........S.',
      '.S.BBBBBBB.S.',
      '.............',
      'BBB.G.G.G.BBB',
      '.............',
      '..B..SSS..B..',
      '..B.......B..',
      'WWWW.....WWWW',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Basic, E.Fast, E.Power, E.Armor, E.Basic]),
  },
  {
    name: 'Stage 6',
    rows: [
      'B.B.B.B.B.B.B',
      '.............',
      'B.SSS...SSS.B',
      '.............',
      'WWW...B...WWW',
      '......B......',
      'GGG.......GGG',
      'G.G.BBB.G.G.G',
      '.............',
      '.IIII...IIII.',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Fast, E.Power, E.Armor, E.Fast, E.Basic]),
  },
  {
    name: 'Stage 7',
    rows: [
      '...SSSSSSS...',
      '...S.....S...',
      'BBB.......BBB',
      '....WWWWW....',
      'BB.........BB',
      '..GGGGGGGGG..',
      '.............',
      'S.B.B.B.B.B.S',
      '.............',
      '.BBB.SSS.BBB.',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Power, E.Armor, E.Fast, E.Power, E.Basic]),
  },
  {
    name: 'Stage 8',
    rows: [
      'S...........S',
      'S.BBBBBBBBB.S',
      'S.B.......B.S',
      '..B.SSSSS.B..',
      '..B.......B..',
      'WWWW.....WWWW',
      '.....GGG.....',
      'BBB..GGG..BBB',
      '.............',
      'IIII.....IIII',
      '.B.B.....B.B.',
      '.............',
      '.....SES.....',
    ],
    enemies: eq(20, [E.Armor, E.Power, E.Fast, E.Armor, E.Power]),
  },
  {
    name: 'Stage 9',
    rows: [
      '.............',
      'SS.SS.SS.SS.S',
      '.............',
      'BB.WWW.WWW.BB',
      '.............',
      '.GGGGGGGGGGG.',
      '......S......',
      'BBB...S...BBB',
      '......S......',
      'I.I.I.I.I.I.I',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Armor, E.Armor, E.Power, E.Fast, E.Armor]),
  },
  {
    name: 'Stage 10',
    rows: [
      'S.S.S.S.S.S.S',
      '.............',
      'B.BBBBBBBBB.B',
      'B.B.......B.B',
      '..B.WWWWW.B..',
      'SS.........SS',
      '..GGGGGGGGG..',
      'B....SSS....B',
      'B...........B',
      'IIII.BBB.IIII',
      '.............',
      '.............',
      '.....BEB.....',
    ],
    enemies: eq(20, [E.Armor, E.Power, E.Armor, E.Fast, E.Armor, E.Power]),
  },
];

export function getStage(index: number): StageDef {
  return STAGES[index % STAGES.length];
}
