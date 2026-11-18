export { createRegistry, type CarnivalGame } from './registry';
export {
  recordScore,
  bestScore,
  topScores,
  leaderScores,
  createScoreBoard,
  type ScoreEntry,
} from './scores';
export { prizeFor, CARNIVAL_PRIZES, type PrizeTier } from './prizes';
export { playerName, setPlayerName, createPlayer, cleanName, MAX_NAME_LENGTH } from './player';
export { theme, canvasFont, applyTheme } from './theme';
