// YouTube Parental Watch - Background Service Worker
// Receives watch data from content script and stores it

const STORAGE_KEY = 'watchHistory';
const MAX_HISTORY_SIZE = 10000; // Prevent unlimited growth

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_WATCHED') {
    handleVideoWatched(message.data);
    sendResponse({ success: true });
    return true;
  }
});

// Handle new video watch event
async function handleVideoWatched(videoData) {
  try {
    // Add timestamp
    const entry = {
      ...videoData,
      timestamp: new Date().toISOString(),
      id: generateId()
    };

    // Get existing history
    const history = await getWatchHistory();

    // Add new entry to the beginning
    history.unshift(entry);

    // Trim if too large
    if (history.length > MAX_HISTORY_SIZE) {
      history.splice(MAX_HISTORY_SIZE);
    }

    // Save back to storage
    await saveWatchHistory(history);

    console.log('Video watch recorded:', entry.videoTitle);
  } catch (error) {
    console.error('Error recording video watch:', error);
  }
}

// Get watch history from storage
function getWatchHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

// Save watch history to storage
function saveWatchHistory(history) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: history }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Save watch history to a file in Downloads folder
async function saveToFile(history) {
  try {
    // Create JSON string
    const dataStr = JSON.stringify(history, null, 2);

    // Create data URL (blob URLs don't work in service workers)
    // Using base64 encoding for better compatibility
    const base64Data = btoa(unescape(encodeURIComponent(dataStr)));
    const dataUrl = `data:application/json;base64,${base64Data}`;

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `youtube-watch-history-${date}.json`;

    // Download the file
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      conflictAction: 'overwrite', // Overwrite if file exists
      saveAs: false // Don't prompt user, auto-save
    });

    console.log('File saved:', filename, 'Download ID:', downloadId);
  } catch (error) {
    console.error('Error saving file:', error);
  }
}

// Generate a simple unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export data functionality (for future dashboard integration)
// This can be called from a separate admin interface
function exportWatchHistory() {
  return getWatchHistory();
}

// Clear history (for admin use)
function clearWatchHistory() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('YouTube Parental Watch installed');
    // Initialize storage
    chrome.storage.local.set({ [STORAGE_KEY]: [] });
  }
});
