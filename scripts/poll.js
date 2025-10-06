document.addEventListener('DOMContentLoaded', () => {
  const eventContainer = document.getElementById('event-details');
  const pollContainer = document.getElementById('poll-results');

async function loadUpcomingEvent() {
  try {
    const res = await fetch('events/upcoming.json');
    if (!res.ok) throw new Error('Failed to fetch upcoming event data.');

    const event = await res.json();

    // Format date (if ISO format)
    const formattedDate = new Date(event.date).toLocaleDateString();

    eventContainer.innerHTML = `
      <p>
        <img src="assets/icons/calendar-purple.svg" class="emoji-icon" />
        <strong>Date:</strong> ${formattedDate}
      </p>
      <p>
        <img src="assets/icons/time-purple.svg" class="emoji-icon" />
        <strong>Start:</strong> ${event.time || 'TBD'}
      </p>
      <p>
        <img src="assets/icons/player-purple.svg" class="emoji-icon" />
        <strong>Players:</strong> up to ${event.playersLimit} participants
      </p>
      <p>
        <img src="assets/icons/place-purple.svg" class="emoji-icon" />
        <strong>Where:</strong> 
        <a href="https://maps.app.goo.gl/64kMEgfQyjjz3mZdA" 
           target="_blank" 
           rel="noopener noreferrer"
           style="color: #bb86fc; text-decoration: none; font-weight: bold;">
          Stanza 1 del Centro Socio Culturale di Zanè
        </a>
      </p>` : ''}
    `;
  } catch (err) {
    console.error('Failed to load upcoming event:', err);
    eventContainer.innerHTML = `
      <p>
        <img src="assets/icons/warning-purple.svg" class="emoji-icon" alt="Warning icon" />
        Unable to load event info.
      </p>
    `;
  }
}

  async function loadPollResults() {
    try {
      const res = await fetch('results/games_results.json');
      const data = await res.json();
      const results = (data.votes || []).filter(v => v.votes > 0);

      if (!results.length) {
        pollContainer.innerHTML = '<p>No votes recorded yet.</p>';
        return;
      }

      const maxVotes = Math.max(...results.map(r => r.votes));
      results.sort((a, b) => b.votes - a.votes);

      pollContainer.innerHTML = '';

      results.forEach((game, index) => {
        const barPercent = ((game.votes / maxVotes) * 100).toFixed(1);
        const glowingClass = game.votes === maxVotes ? 'glow-first-place' : '';

        pollContainer.innerHTML += `
          <div class="poll-result ${glowingClass}">
            <div class="poll-label">
              <a href="${game.url}" target="_blank">${game.title}</a>
              <span>${game.votes} vote${game.votes !== 1 ? 's' : ''}</span>
            </div>
            <div class="poll-bar-container">
              <div class="poll-bar" style="width: ${barPercent}%;"></div>
            </div>
          </div>
        `;
      });
    } catch (err) {
      pollContainer.innerHTML = '<p><img src="assets/icons/warning-purple.svg" class="emoji-icon"> Unable to load poll results.</p>';
      console.error(err);
    }
  }

  loadUpcomingEvent();
  loadPollResults();
});
