// YouTube Monitor - Background Service Worker
// Sends watch data to cloud API in real-time

const API_URL = 'http://localhost:8000/api';

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
    // Get device credentials
    const { deviceToken, deviceUUID } = await getDeviceCredentials();

    if (!deviceToken || !deviceUUID) {
      console.log('Device not activated. Event not sent.');
      return;
    }

    // Send to API
    await sendEventToAPI(videoData, deviceUUID, deviceToken);

    console.log('Video watch sent to API:', videoData.videoTitle);
  } catch (error) {
    console.error('Error sending video watch to API:', error);
    // Optionally queue for retry
  }
}

// Send event to API
async function sendEventToAPI(videoData, deviceUUID, token) {
  const payload = {
    device_uuid: deviceUUID,
    video_id: videoData.videoId,
    video_title: videoData.videoTitle,
    channel_name: videoData.channelName,
    channel_id: videoData.channelId,
    video_url: videoData.videoUrl,
    duration_seconds: videoData.duration,
    watch_duration_seconds: videoData.watchDuration,
    watched_at: new Date().toISOString(),
    thumbnail_url: videoData.thumbnailUrl,
    metadata: {
      browser: videoData.browser,
      userAgent: navigator.userAgent,
    },
  };

  const response = await fetch(`${API_URL}/watch-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send event');
  }

  return await response.json();
}

// Get device credentials from storage
function getDeviceCredentials() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['deviceToken', 'deviceUUID'], (result) => {
      resolve(result);
    });
  });
}

// Heartbeat to update last_seen_at every 15 minutes
async function sendHeartbeat() {
  try {
    const { deviceToken, deviceUUID } = await getDeviceCredentials();

    if (!deviceToken || !deviceUUID) {
      return;
    }

    await fetch(`${API_URL}/devices/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ device_uuid: deviceUUID }),
    });

    console.log('Heartbeat sent');
  } catch (error) {
    console.error('Heartbeat error:', error);
  }
}

// Set up heartbeat timer (every 15 minutes)
chrome.alarms.create('heartbeat', { periodInMinutes: 15 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    sendHeartbeat();
  }
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('YouTube Monitor Extension installed');
  }
});
