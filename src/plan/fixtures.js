// Fictional sample properties for the property-plan demo.
//
// These are NOT real parcels and are not derived from GIS data. Each fixture
// uses the same PropertyGeometry shape a future geocoder / parcel provider
// would return, so the visualization does not need to change when live data
// is connected.
//
// PropertyGeometry (all coordinates in a 640 x 440 plan space):
//   id, city, label, propertyType ('commercial' | 'hoa'), address (fictional),
//   start:        [x, y] where service routes begin (site entrance)
//   access:       closed polyline of plausible access routes (drives, walks)
//   buildings:    [{ poly, label, labelAt }]
//   paving:       [poly]          parking lots and drives
//   walks:        [{ pts, width }] sidewalks and paths
//   lawns:        [{ poly, dir }]  turf areas; dir 'h' | 'v' = mowing direction
//   beds:         [poly]          planting beds
//   shrubs:       [{ cx, cy, r }]
//   trees:        [{ cx, cy, r }]
//   edges:        [pts]           lawn boundaries along walks and curbs
//   improvements: [{ poly, plants: [[x, y]], label, labelAt }]  proposed only

const rect = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
const row = (xs, cy, r) => xs.map((cx) => ({ cx, cy, r }));
const col = (cx, ys, r) => ys.map((cy) => ({ cx, cy, r }));
const grid = (x0, y0, x1, y1, nx, ny) => {
  const pts = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      pts.push([x0 + ((i + 0.5) * (x1 - x0)) / nx, y0 + ((j + 0.5) * (y1 - y0)) / ny]);
  return pts;
};

import { CAMPUS } from './campus.js';

export const FIXTURES = [
  {
    id: 'murfreesboro',
    seed: 11,
    city: 'Murfreesboro',
    label: 'Office campus',
    propertyType: 'commercial',
    address: '0 Example Campus Drive, Murfreesboro, TN',
    summary: 'Two office buildings, a courtyard, several lawn areas, and parking islands.',
    start: [424, 377],
    access: [
      [20, 377], [620, 377], [620, 182], [254, 182], [254, 160], [20, 160],
    ],
    buildings: [
      { poly: rect(52, 44, 242, 140), label: 'OFFICE A', labelAt: [147, 96] },
      { poly: rect(404, 44, 584, 154), label: 'OFFICE B', labelAt: [494, 103] },
    ],
    paving: [rect(262, 188, 596, 316), rect(404, 316, 444, 384)],
    walks: [
      { pts: [[134, 158], [134, 370]], width: 12 },
      { pts: [[254, 110], [396, 110]], width: 12 },
    ],
    lawns: [
      { poly: rect(32, 166, 126, 362), dir: 'v' },
      { poly: rect(142, 166, 250, 362), dir: 'v' },
      { poly: rect(254, 44, 396, 102), dir: 'h' },
      { poly: rect(254, 118, 396, 176), dir: 'h' },
      { poly: rect(262, 324, 396, 362), dir: 'h' },
      { poly: rect(452, 324, 608, 362), dir: 'h' },
    ],
    beds: [
      rect(52, 142, 128, 156),
      rect(142, 142, 242, 156),
      rect(404, 156, 584, 170),
      rect(300, 246, 380, 262),
      rect(476, 246, 556, 262),
    ],
    shrubs: [
      ...row([64, 86, 108], 149, 6),
      ...row([156, 180, 204, 228], 149, 6),
      ...row([418, 444, 470, 496, 522, 548, 572], 163, 6),
    ],
    trees: [
      { cx: 78, cy: 250, r: 15 },
      { cx: 196, cy: 300, r: 15 },
      { cx: 196, cy: 212, r: 13 },
      { cx: 325, cy: 73, r: 14 },
      { cx: 340, cy: 254, r: 11 },
      { cx: 516, cy: 254, r: 11 },
      { cx: 320, cy: 343, r: 12 },
      { cx: 530, cy: 343, r: 12 },
    ],
    edges: [
      [[126, 166], [126, 362]],
      [[142, 166], [142, 362]],
      [[32, 362], [126, 362]],
      [[142, 362], [250, 362]],
      [[262, 362], [396, 362], [396, 324]],
      [[452, 324], [452, 362], [608, 362]],
      [[254, 102], [396, 102]],
      [[254, 118], [396, 118]],
    ],
    improvements: [
      { poly: rect(40, 296, 118, 354), plants: grid(40, 296, 118, 354, 4, 3), label: 'PROPOSED BED', labelAt: [79, 290] },
    ],
  },
  {
    id: 'smyrna',
    seed: 23,
    city: 'Smyrna',
    label: 'Retail property',
    propertyType: 'commercial',
    address: '0 Example Market Street, Smyrna, TN',
    summary: 'A storefront building with narrow roadside turf, entrance beds, and perimeter shrubs.',
    start: [320, 377],
    access: [
      [18, 377], [622, 377], [622, 162], [18, 162],
    ],
    buildings: [{ poly: rect(96, 40, 544, 138), label: 'RETAIL', labelAt: [320, 94] }],
    paving: [rect(96, 138, 544, 156), rect(70, 166, 570, 334), rect(290, 334, 350, 386)],
    walks: [],
    lawns: [
      { poly: rect(24, 346, 282, 368), dir: 'h' },
      { poly: rect(358, 346, 616, 368), dir: 'h' },
      { poly: rect(24, 166, 50, 340), dir: 'v' },
      { poly: rect(590, 166, 616, 340), dir: 'v' },
      { poly: rect(24, 40, 88, 156), dir: 'v' },
      { poly: rect(552, 40, 616, 156), dir: 'v' },
    ],
    beds: [
      rect(238, 348, 280, 366),
      rect(360, 348, 402, 366),
      rect(52, 168, 66, 332),
      rect(574, 168, 588, 332),
      rect(170, 244, 232, 258),
      rect(408, 244, 470, 258),
    ],
    shrubs: [
      ...col(59, [182, 210, 238, 266, 294, 320], 5.5),
      ...col(581, [182, 210, 238, 266, 294, 320], 5.5),
      ...row([184, 201, 218], 251, 5),
      ...row([422, 439, 456], 251, 5),
      ...row([248, 270], 357, 5),
      ...row([370, 392], 357, 5),
    ],
    trees: [
      { cx: 56, cy: 96, r: 16 },
      { cx: 584, cy: 96, r: 16 },
    ],
    edges: [
      [[24, 346], [238, 346]],
      [[24, 368], [282, 368]],
      [[402, 346], [616, 346]],
      [[358, 368], [616, 368]],
      [[24, 156], [88, 156]],
      [[552, 156], [616, 156]],
    ],
    improvements: [
      { poly: rect(150, 140, 226, 154), plants: grid(150, 140, 226, 154, 5, 1), label: 'PROPOSED PLANTERS', labelAt: [188, 165] },
      { poly: rect(414, 140, 490, 154), plants: grid(414, 140, 490, 154, 5, 1), label: '', labelAt: [452, 134] },
    ],
  },
  {
    id: 'christiana',
    seed: 37,
    city: 'Christiana',
    label: 'Shared community',
    propertyType: 'hoa',
    address: '0 Example Commons Lane, Christiana, TN',
    summary: 'A common green, entrance lawns, side lawns, and many trees around a loop road.',
    start: [320, 386],
    access: [
      [115, 107], [525, 107], [525, 299], [320, 299], [115, 299],
    ],
    buildings: [{ poly: rect(420, 30, 540, 82), label: 'CLUBHOUSE', labelAt: [480, 60] }],
    // Loop road around the common green, plus the entrance road.
    paving: [
      rect(104, 96, 536, 118),
      rect(104, 288, 536, 310),
      rect(104, 118, 126, 288),
      rect(514, 118, 536, 288),
      rect(298, 310, 342, 392),
    ],
    walks: [],
    lawns: [
      { poly: rect(126, 118, 514, 288), dir: 'h' },
      { poly: rect(24, 318, 290, 372), dir: 'h' },
      { poly: rect(350, 318, 616, 372), dir: 'h' },
      { poly: rect(24, 30, 96, 304), dir: 'v' },
      { poly: rect(544, 96, 616, 304), dir: 'v' },
      { poly: rect(104, 30, 410, 88), dir: 'h' },
    ],
    beds: [
      rect(250, 326, 284, 346),
      rect(356, 326, 390, 346),
      rect(420, 84, 540, 94),
      rect(296, 184, 344, 220),
    ],
    shrubs: [
      ...row([432, 452, 472, 492, 512, 530], 89, 5),
      ...row([282, 358], 176, 6),
      ...row([282, 358], 228, 6),
      ...row([258, 276], 336, 5),
      ...row([364, 382], 336, 5),
    ],
    trees: [
      { cx: 190, cy: 160, r: 18 },
      { cx: 450, cy: 160, r: 18 },
      { cx: 190, cy: 250, r: 16 },
      { cx: 450, cy: 250, r: 16 },
      { cx: 60, cy: 90, r: 16 },
      { cx: 60, cy: 190, r: 16 },
      { cx: 580, cy: 150, r: 16 },
      { cx: 580, cy: 250, r: 14 },
      { cx: 80, cy: 345, r: 14 },
      { cx: 560, cy: 345, r: 14 },
      { cx: 170, cy: 58, r: 14 },
      { cx: 290, cy: 58, r: 14 },
    ],
    edges: [
      [[126, 118], [514, 118], [514, 288], [126, 288], [126, 118]],
      [[24, 318], [290, 318], [290, 372]],
      [[350, 372], [350, 318], [616, 318]],
    ],
    improvements: [
      { poly: rect(30, 238, 90, 298), plants: grid(30, 238, 90, 298, 3, 3), label: 'PROPOSED', labelAt: [60, 232] },
      { poly: rect(336, 36, 404, 82), plants: grid(336, 36, 404, 82, 4, 2), label: 'PROPOSED', labelAt: [370, 30] },
    ],
  },
];

// Fourth example is a manual aerial trace, not a fictional parcel.
FIXTURES.push(CAMPUS);
