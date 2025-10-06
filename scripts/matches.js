document.addEventListener('DOMContentLoaded', () => {
  const pastGamesContainer = document.getElementById('match-results');

  async function loadMatches() {
    try {
      const [matchesRes, gamesRes] = await Promise.all([
        fetch('results/matches.json'),
        fetch('games/index.json')
      ]);

      if (!matchesRes.ok || !gamesRes.ok) throw new Error('Failed to fetch data');

      const matches = await matchesRes.json();
      const gamesIndex = await gamesRes.json();

      const gameSlugToData = {};
      await Promise.all(gamesIndex.map(async (entry) => {
        const res = await fetch(`games/${entry.slug}.json`);
        if (res.ok) {
          const gameData = await res.json();
          gameSlugToData[entry.slug] = {
            title: gameData.title || entry.slug,
            url: gameData.url || '#'
          };
        } else {
          gameSlugToData[entry.slug] = {
            title: entry.slug,
            url: '#'
          };
        }
      }));

      const matchesHTML = matches
        .filter(match => match.duration !== "NA")
        .map(match => {
        const gameInfo = gameSlugToData[match.game] || { title: match.game, url: '#' };
        const { title, url } = gameInfo;

        const maxScore = Math.max(...match.players.map(p => p.score), 1);

        const playersHTML = match.players.map(p => {
          const widthPercent = Math.round((p.score / maxScore) * 100);
          return `
            <div class="poll-label"><span>${p.name}</span><span>${p.score}</span></div>
            <div class="poll-bar-container">
              <div class="poll-bar" style="width: ${widthPercent}%;"></div>
            </div>
          `;
        }).join('');

        return `
          <div class="poll-result">
            <div class="poll-label">
              <a href="${url}" target="_blank">${title}</a>
            </div>
            <div class="game-meta" style="margin-top: 4px; justify-content: flex-end; display: flex; gap: 15px;">
              <span>
                <img src="assets/icons/calendar-purple.svg" class="emoji-icon" />: ${match.date}
              </span>
              <span>
                <img src="assets/icons/player-purple.svg" class="emoji-icon" />: ${match.players.length}
              </span>
              <span>
                <img src="assets/icons/time-purple.svg" class="emoji-icon" />: ${match.duration}
              </span>
            </div>
            ${playersHTML}
          </div>
        `;
      }).join('');

      pastGamesContainer.innerHTML = matchesHTML || '<p>No past matches found.</p>';
    } catch (error) {
      console.error('Failed to load past matches:', error);
      pastGamesContainer.innerHTML = '<p>Unable to load past games data.</p>';
    }
  }

  loadMatches();
});
