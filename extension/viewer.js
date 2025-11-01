// YouTube Parental Watch - Viewer
// Displays watch history from storage

let allHistory = [];
let filteredHistory = [];

// Load watch history from storage
async function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['watchHistory'], (result) => {
      resolve(result.watchHistory || []);
    });
  });
}

// Initialize the viewer
async function init() {
  allHistory = await loadHistory();
  filteredHistory = allHistory;
  updateStats();
  displayHistory();
}

// Update statistics
function updateStats() {
  const totalVideos = allHistory.length;

  // Count unique channels
  const uniqueChannels = new Set(allHistory.map(entry => entry.channelName)).size;

  // Count videos watched today
  const today = new Date().toISOString().split('T')[0];
  const todayCount = allHistory.filter(entry =>
    entry.timestamp.startsWith(today)
  ).length;

  document.getElementById('totalVideos').textContent = totalVideos;
  document.getElementById('uniqueChannels').textContent = uniqueChannels;
  document.getElementById('todayCount').textContent = todayCount;
}

// Display history entries
function displayHistory() {
  const container = document.getElementById('historyContainer');

  if (filteredHistory.length === 0) {
    container.innerHTML = '<p class="no-data">No watch history found.</p>';
    return;
  }

  // Remove duplicates based on video ID and timestamp proximity (within 5 seconds)
  const dedupedHistory = deduplicateHistory(filteredHistory);

  const html = dedupedHistory.map(entry => {
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    // Create profile picture HTML with fallback
    const profilePicHtml = entry.channelProfilePicUrl
      ? `<img src="${entry.channelProfilePicUrl}" alt="${escapeHtml(entry.channelName)}" class="channel-avatar" onerror="this.style.display='none'">`
      : '';

    return `
      <div class="history-entry">
        <div class="video-info">
          <a href="${entry.videoUrl}" target="_blank" class="video-title">${escapeHtml(entry.videoTitle)}</a>
          <div class="channel-info">
            ${profilePicHtml}
            <a href="${entry.channelUrl}" target="_blank" class="channel-name">${escapeHtml(entry.channelName)}</a>
          </div>
        </div>
        <div class="timestamp">
          <div>${formattedDate}</div>
          <div class="time">${formattedTime}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// Deduplicate history entries (same video within 5 seconds)
function deduplicateHistory(history) {
  const seen = new Map();
  const deduped = [];

  for (const entry of history) {
    const key = entry.videoId;
    const timestamp = new Date(entry.timestamp).getTime();

    if (!seen.has(key)) {
      seen.set(key, timestamp);
      deduped.push(entry);
    } else {
      const lastTimestamp = seen.get(key);
      if (Math.abs(timestamp - lastTimestamp) > 5000) {
        seen.set(key, timestamp);
        deduped.push(entry);
      }
    }
  }

  return deduped;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filter history by search term
function filterBySearch(searchTerm) {
  if (!searchTerm) {
    filteredHistory = allHistory;
    return;
  }

  const term = searchTerm.toLowerCase();
  filteredHistory = allHistory.filter(entry =>
    entry.videoTitle.toLowerCase().includes(term) ||
    entry.channelName.toLowerCase().includes(term)
  );
}

// Filter history by date range
function filterByDate(range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch(range) {
    case 'today':
      filteredHistory = allHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= today;
      });
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredHistory = allHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= weekAgo;
      });
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredHistory = allHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= monthAgo;
      });
      break;
    default:
      filteredHistory = allHistory;
  }
}

// Apply all filters
function applyFilters() {
  const searchTerm = document.getElementById('searchBox').value;
  const dateRange = document.getElementById('dateFilter').value;

  filteredHistory = allHistory;

  // Apply date filter first
  if (dateRange !== 'all') {
    filterByDate(dateRange);
  }

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredHistory = filteredHistory.filter(entry =>
      entry.videoTitle.toLowerCase().includes(term) ||
      entry.channelName.toLowerCase().includes(term)
    );
  }

  displayHistory();
}

// Export history as JSON
function exportHistory() {
  const dataStr = JSON.stringify(allHistory, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `youtube-watch-history-${date}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Clear all history
async function clearHistory() {
  if (confirm('Are you sure you want to clear all watch history? This cannot be undone.')) {
    await new Promise((resolve) => {
      chrome.storage.local.remove(['watchHistory'], resolve);
    });

    allHistory = [];
    filteredHistory = [];
    updateStats();
    displayHistory();

    alert('Watch history cleared.');
  }
}

// Event listeners
document.getElementById('refreshBtn').addEventListener('click', init);
document.getElementById('exportBtn').addEventListener('click', exportHistory);
document.getElementById('clearBtn').addEventListener('click', clearHistory);
document.getElementById('searchBox').addEventListener('input', applyFilters);
document.getElementById('dateFilter').addEventListener('change', applyFilters);

// Initialize on load
init();
