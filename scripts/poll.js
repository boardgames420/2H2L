document.addEventListener('DOMContentLoaded', () => {
  const eventContainer = document.getElementById('event-details');
  const pollContainer = document.getElementById('poll-results');

  async function loadUpcomingEvent() {
    try {
      const res = await fetch('events/upcoming.json');
      const event = await res.json();
      const formattedDate = new Date(event.date).toLocaleDateString();
      eventContainer.innerHTML = `
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Players:</strong> up to ${event.playersLimit} participants</p>
      `;
    } catch (err) {
      eventContainer.innerHTML = `<p><img src="assets/icons/warning-purple.svg" class="emoji-icon"> Unable to load event info.</p>`;
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
