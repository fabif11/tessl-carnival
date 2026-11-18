# Ring Toss

Land your rings on the necks of the bottles on the shelves before you run out.

## How to play

- Move the mouse to aim, and click to throw a ring. A dashed line shows where it will land.
- Your hand sways from side to side, up to 40 px either way, and the ring lands
  where you aim plus the sway at the moment you throw. Time your throws.
- A ring scores when it lands on a bottle's neck. A ring that misses falls to the floor.
- You have 10 rings. The round ends when the last ring has landed.
- Click again on the game over screen to play another round.

## Scoring

Bottles further back are harder to ring: their necks are smaller, and they score more.

| Row    | Neck radius | Points |
| ------ | ----------- | ------ |
| Back   | 10 px       | 30     |
| Middle | 12 px       | 20     |
| Front  | 14 px       | 10     |

A bottle can be ringed more than once. Your final score is saved to the
carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `toss`, `step`, `sway`, `isRinged`,
  `bottleAt`) and the `ringToss` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
