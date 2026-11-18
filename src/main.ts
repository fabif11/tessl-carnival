import './style.css';
import {
  applyTheme,
  bestScore,
  leaderScores,
  MAX_NAME_LENGTH,
  playerName,
  setPlayerName,
  type CarnivalGame,
} from './carnival';
import { registry } from './games';
import { ANONYMOUS, leaderboardRows } from './leaderboard';
import { startMidway } from './midway/midway';
import type { BoothSlot } from './midway/world';
import { carnivalLink, REPO_URL, shareLinks } from './share';

applyTheme();

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

const LEADERBOARD_SIZE = 10;

function bestText(game: CarnivalGame): string {
  const best = bestScore(game.id);
  return best === undefined ? 'No scores yet' : `Best: ${best}`;
}

function renderMidway() {
  document.body.dataset.view = 'midway';
  app.innerHTML = `
    <section class="midway">
      <canvas class="midway-map" aria-label="The carnival midway. Walk up to a booth to play its game."></canvas>
      <p class="midway-help">
        <kbd>WASD</kbd> or <kbd>arrows</kbd> to walk, or click where you want to go.
        <kbd>E</kbd> to play.
      </p>
      <p class="midway-credit">
        Built with
        <a href="https://tessl.io/?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">Tessl</a>
        at
        <a href="https://tessl.io/devcon?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">AI DevCon NYC</a>
        <span class="midway-links">
          <a href="${REPO_URL}" target="_blank" rel="noopener">Build your own</a>
          <span class="midway-share" hidden>
            · Share on
            <a class="share-x" target="_blank" rel="noopener">X</a>
            or
            <a class="share-linkedin" target="_blank" rel="noopener">LinkedIn</a>
          </span>
        </span>
      </p>
      <div class="midway-side">
        <nav class="midway-guide" aria-label="Booths">
          <h2>Booths</h2>
          <ul></ul>
        </nav>
        <section class="midway-leaderboard" aria-labelledby="leaderboard-title">
          <h2 id="leaderboard-title">Leaderboard</h2>
          <form class="player-name">
            <label for="player-name">Your name</label>
            <input id="player-name" name="name" maxlength="${MAX_NAME_LENGTH}" autocomplete="nickname" placeholder="${ANONYMOUS}" />
            <button type="submit">Save</button>
          </form>
          <p class="playing-as" aria-live="polite"></p>
          <ol></ol>
          <p class="no-scores">No scores yet. Play a booth to get on the board.</p>
        </section>
      </div>
      <div class="booth-card" aria-live="polite" hidden>
        <h2></h2>
        <p class="description"></p>
        <p class="best"></p>
        <a class="play">Play</a>
      </div>
    </section>`;

  const link = carnivalLink(location.href);
  if (link) {
    const share = shareLinks(link);
    app.querySelector<HTMLAnchorElement>('.share-x')!.href = share.x;
    app.querySelector<HTMLAnchorElement>('.share-linkedin')!.href = share.linkedIn;
    app.querySelector<HTMLElement>('.midway-share')!.hidden = false;
  }

  const guide = app.querySelector('.midway-guide ul')!;
  for (const game of registry.all()) {
    const item = document.createElement('li');
    item.innerHTML = `<a href="#/play/${game.id}"><span class="name"></span> <span class="best"></span></a>`;
    item.querySelector('.name')!.textContent = game.name;
    item.querySelector('.best')!.textContent = bestText(game);
    guide.append(item);
  }

  renderLeaderboard();

  const card = app.querySelector<HTMLElement>('.booth-card')!;
  const showBooth = (booth: BoothSlot | undefined) => {
    const game = booth?.gameId ? registry.get(booth.gameId) : undefined;
    card.hidden = booth === undefined;
    card.classList.toggle('closed', booth !== undefined && !game);
    card.querySelector('h2')!.textContent = game?.name ?? 'Coming soon';
    card.querySelector('.description')!.textContent =
      game?.description ?? 'This booth is waiting for a game. Build one and it opens here.';
    card.querySelector('.best')!.textContent = game ? bestText(game) : '';
    const link = card.querySelector<HTMLAnchorElement>('.play')!;
    link.hidden = !game;
    if (game) link.href = `#/play/${game.id}`;
  };

  const midway = startMidway(app.querySelector('canvas')!, {
    games: registry.all(),
    onPlay: (gameId) => (location.hash = `#/play/${gameId}`),
    onReach: showBooth,
  });
  stop = midway.stop;
}

function renderLeaderboard() {
  const board = app.querySelector<HTMLElement>('.midway-leaderboard')!;
  const form = board.querySelector<HTMLFormElement>('.player-name')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const playingAs = board.querySelector<HTMLElement>('.playing-as')!;
  const showName = (name: string | undefined) => {
    input.value = name ?? '';
    playingAs.textContent = name
      ? `Your scores carry the name ${name}.`
      : 'You are playing anonymously.';
  };
  showName(playerName());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showName(setPlayerName(input.value));
    input.blur();
  });

  const list = board.querySelector('ol')!;
  const rows = leaderboardRows(leaderScores(LEADERBOARD_SIZE), registry.get);
  for (const row of rows) {
    const item = document.createElement('li');
    item.innerHTML = `<span class="player"></span> <span class="score"></span> <span class="detail"></span>`;
    item.querySelector('.player')!.textContent = row.player;
    item.querySelector('.score')!.textContent = String(row.score);
    item.querySelector('.detail')!.textContent = row.prize
      ? `${row.game} · ${row.prize}`
      : row.game;
    list.append(item);
  }
  board.querySelector<HTMLElement>('.no-scores')!.hidden = rows.length > 0;
}

function renderGame(game: CarnivalGame) {
  document.body.dataset.view = 'game';
  app.innerHTML = `
    <section class="game">
      <div class="game-header">
        <a href="#/">← Back to the midway</a>
        <h1></h1>
      </div>
      <canvas></canvas>
    </section>`;
  app.querySelector('h1')!.textContent = game.name;
  stop = game.start(app.querySelector('canvas')!);
}

function route() {
  stop?.();
  stop = undefined;

  const match = location.hash.match(/^#\/play\/([\w-]+)$/);
  const game = match ? registry.get(match[1]) : undefined;
  if (game) renderGame(game);
  else renderMidway();
}

window.addEventListener('hashchange', route);
route();
