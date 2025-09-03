
document.addEventListener('DOMContentLoaded', () => {
  const gamesWrapper = document.querySelector('.games-wrapper');
  const playerFilter = document.getElementById('playerFilter');
  const timeFilter = document.getElementById('timeFilter');
  const ownerFilter = document.getElementById('ownerFilter');
  const clearFilters = document.getElementById('clearFilters');

  async function fetchGames() {
    try {
      const res = await fetch('games/index.json');
      const gameEntries = await res.json();

      const validGames = gameEntries.filter(g => g.slug && g.slug !== 'owners');

      // ✅ Populate owner filter dynamically
      const uniqueOwners = [...new Set(validGames.map(g => g.owner).filter(Boolean))].sort();
      uniqueOwners.forEach(owner => {
        const option = document.createElement('option');
        option.value = owner;
        option.textContent = owner;
        ownerFilter.appendChild(option);
      });

      const gameHTMLs = await Promise.all(validGames.map(async (g) => {
        const res = await fetch(`games/${g.slug}.json`);
        const game = await res.json();
        return renderGameHTML(game);
      }));

      gamesWrapper.insertAdjacentHTML('beforeend', gameHTMLs.join(''));
      applyFiltersFromURL();
      filterGames();
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  }

  function renderGameHTML(game) {
    const [minPlayers, maxPlayers] = game.players.split('-').map(n => parseInt(n.trim()));
    const classes = ['game'];
    if (game.comingSoon) classes.push('coming-soon');

    const expansions = (game.expansions || []).map(exp => `
      <div class="expansion">
        <a href="${exp.url}" target="_blank">
          ${exp.title}
          ${exp.note ? `<span class="expansion-note"><img src="assets/icons/player-purple.svg" class="emoji-icon">${exp.note}</span>` : ''}
        </a>
        <span>${exp.description}</span>
      </div>
    `).join('');

    return `
      <div class="${classes.join(' ')}" data-players="${game.players}" ${game.playersWithExpansion ? `data-players-with-expansion="${game.playersWithExpansion}"` : ''}>
        <div class="game-meta">
          <span><img src="assets/icons/player-purple.svg" class="emoji-icon" />: ${game.players}${game.playersWithExpansion ? ` (+${game.playersWithExpansion - maxPlayers} with expansion)` : ''} |
          <img src="assets/icons/time-purple.svg" class="emoji-icon" />: ${game.time}'</span>
        </div>
        <h2><a href="${game.url}" target="_blank">${game.title}</a></h2>
        <p>${game.description}</p>
        ${expansions}
        <small class="owner">(${game.owner})</small>
      </div>
    `;
  }

  function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('players')) playerFilter.value = params.get('players');
    if (params.has('time')) timeFilter.value = params.get('time');
    if (params.has('owner')) ownerFilter.value = params.get('owner');
  }

  function updateURLParams() {
    const params = new URLSearchParams();
    if (playerFilter.value) params.set('players', playerFilter.value);
    if (timeFilter.value) params.set('time', timeFilter.value);
    if (ownerFilter.value) params.set('owner', ownerFilter.value);
    history.replaceState({}, '', '?' + params.toString());
  }

  function filterGames() {
    const games = document.querySelectorAll('.game');
    const selectedPlayers = parseInt(playerFilter.value);
    const selectedTime = parseInt(timeFilter.value);
    const selectedOwner = ownerFilter.value;

    games.forEach(game => {
      const metaText = game.querySelector('.game-meta')?.textContent || '';
      const timeMatch = metaText.match(/(\d+)\s*–?\s*(\d+)?'/);
      const minTime = timeMatch ? parseInt(timeMatch[1]) : null;

      const dataPlayers = game.dataset.players || '';
      const expansionMax = parseInt(game.dataset.playersWithExpansion || '0');
      const [min, max] = dataPlayers.split('-').map(n => parseInt(n.trim()));

      let matchPlayers = true;
      let matchTime = true;

      if (!isNaN(selectedPlayers)) {
        matchPlayers = selectedPlayers >= min && selectedPlayers <= max;
        const existingWarn = game.querySelector('.expansion-warning');
        if (!matchPlayers && selectedPlayers <= expansionMax) {
          matchPlayers = true;
          if (!existingWarn) {
            const warn = document.createElement('div');
            warn.className = 'expansion-warning';
            warn.innerHTML = `<img src="assets/icons/warning-purple.svg" class="emoji-icon"> Requires expansion to support ${selectedPlayers} players`;
            game.appendChild(warn);
          }
        } else if (existingWarn) {
          existingWarn.remove();
        }
      }

      if (!isNaN(selectedTime) && minTime !== null) {
        matchTime = minTime <= selectedTime;
      }

      const ownerEl = game.querySelector('.owner');
      const gameOwner = ownerEl ? ownerEl.textContent.match(/\(([^)]+)\)/)?.[1] : null;
      const matchOwner = !selectedOwner || gameOwner === selectedOwner;

      game.style.display = (matchPlayers && matchTime && matchOwner) ? '' : 'none';
    });

    updateURLParams();
  }

  playerFilter.addEventListener('change', filterGames);
  timeFilter.addEventListener('change', filterGames);
  ownerFilter.addEventListener('change', filterGames);

  clearFilters.addEventListener('click', () => {
    playerFilter.value = '';
    timeFilter.value = '';
    ownerFilter.value = '';
    document.querySelectorAll('.expansion-warning').forEach(w => w.remove());
    filterGames();
  });

  fetchGames();
});
