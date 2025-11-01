// YouTube Parental Watch - Content Script
// Monitors YouTube video pages and extracts watch data

(function() {
  'use strict';

  let lastProcessedUrl = '';
  let extractionAttempts = 0;
  let extensionContextValid = true;
  let extractionTimeoutId = null;
  let fallbackCheckInterval = null;
  const MAX_EXTRACTION_ATTEMPTS = 20; // Increased from 10
  const EXTRACTION_RETRY_DELAY = 500; // ms
  const INITIAL_EXTRACTION_DELAY = 2000; // ms - increased from 1000ms for initial page loads
  const NAVIGATION_EXTRACTION_DELAY = 800; // ms - faster for SPA navigation
  const FALLBACK_CHECK_INTERVAL = 3000; // ms - check periodically if extraction failed
  const DEBUG = true; // Enable detailed logging

  // Debug logging helper
  function log(...args) {
    if (DEBUG) {
      console.log('[YT Parental Watch]', ...args);
    }
  }

  // Check if we're on a video page
  function isVideoPage() {
    return window.location.pathname === '/watch' && window.location.search.includes('v=');
  }

  // Extract video data from the page
  function extractVideoData() {
    const data = {};

    // Video URL
    data.videoUrl = window.location.href.split('&list=')[0]; // Remove playlist params

    // Extract video ID
    const urlParams = new URLSearchParams(window.location.search);
    data.videoId = urlParams.get('v');

    // Video title - YouTube uses different selectors, try multiple
    const titleSelectors = [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.title.ytd-video-primary-info-renderer',
      'h1 yt-formatted-string.ytd-watch-metadata',
      'ytd-watch-metadata h1'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        data.videoTitle = titleElement.textContent.trim();
        log(`Found title: "${data.videoTitle}" using selector: ${selector}`);
        break;
      }
    }

    if (!data.videoTitle) {
      log('Failed to find video title. Tried selectors:', titleSelectors);
    }

    // Channel name and URL
    const channelSelectors = [
      'ytd-channel-name a',
      'ytd-video-owner-renderer a',
      '#owner a',
      'ytd-channel-name#channel-name a'
    ];

    for (const selector of channelSelectors) {
      const channelElement = document.querySelector(selector);
      if (channelElement) {
        data.channelName = channelElement.textContent.trim();
        const channelHref = channelElement.getAttribute('href');
        if (channelHref) {
          data.channelUrl = `https://www.youtube.com${channelHref}`;
        }
        log(`Found channel: "${data.channelName}" using selector: ${selector}`);
        break;
      }
    }

    if (!data.channelName) {
      log('Failed to find channel name. Tried selectors:', channelSelectors);
    }

    // Channel profile picture
    const avatarSelectors = [
      'ytd-video-owner-renderer img',
      '#owner img',
      'ytd-channel-name img',
      '#avatar img'
    ];

    for (const selector of avatarSelectors) {
      const avatarElement = document.querySelector(selector);
      if (avatarElement) {
        const avatarUrl = avatarElement.getAttribute('src');
        if (avatarUrl && avatarUrl.startsWith('http')) {
          data.channelProfilePicUrl = avatarUrl;
          log(`Found channel avatar using selector: ${selector}`);
          break;
        }
      }
    }

    if (!data.channelProfilePicUrl) {
      log('Failed to find channel profile picture. Tried selectors:', avatarSelectors);
    }

    // Validate that we got the essential data
    if (data.videoTitle && data.channelName && data.videoUrl) {
      log('✓ Successfully extracted all video data');
      return data;
    }

    log('✗ Missing required data. Title:', !!data.videoTitle, 'Channel:', !!data.channelName);
    return null;
  }

  // Check if extension context is still valid
  function isExtensionContextValid() {
    if (!chrome.runtime || !chrome.runtime.id) {
      extensionContextValid = false;
      return false;
    }
    return extensionContextValid;
  }

  // Send video data to background script
  function sendVideoData(data) {
    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      console.warn('YouTube Parental Watch: Extension context invalidated, cannot send data');
      return;
    }

    log('📤 Sending video data to background script:', data.videoTitle);

    try {
      chrome.runtime.sendMessage({
        type: 'VIDEO_WATCHED',
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          if (error.includes('Extension context invalidated')) {
            extensionContextValid = false;
            console.warn('YouTube Parental Watch: Extension was reloaded. Please refresh this page.');
          } else {
            console.error('YouTube Parental Watch: Error sending message:', error);
          }
        } else {
          log('✓ Video data sent successfully');
        }
      });
    } catch (error) {
      extensionContextValid = false;
      console.warn('YouTube Parental Watch: Extension context invalidated');
    }
  }

  // Process the current page
  function processPage(source = 'unknown') {
    // Don't process if extension context is invalid
    if (!isExtensionContextValid()) {
      return;
    }

    const currentUrl = window.location.href;

    log(`🔍 processPage() called from: ${source}, URL: ${currentUrl}`);

    // Don't process the same video twice
    if (currentUrl === lastProcessedUrl) {
      log('⏭️  Skipping - already processed this URL');
      return;
    }

    if (!isVideoPage()) {
      log('⏭️  Skipping - not a video page');
      // Stop fallback checking if we're not on a video page
      if (fallbackCheckInterval) {
        clearInterval(fallbackCheckInterval);
        fallbackCheckInterval = null;
      }
      return;
    }

    // Cancel any pending extraction
    if (extractionTimeoutId) {
      clearTimeout(extractionTimeoutId);
      extractionTimeoutId = null;
    }

    extractionAttempts = 0;

    // Use different delays based on source
    // Initial page loads need more time for YouTube to render
    const delay = source === 'initial' ? INITIAL_EXTRACTION_DELAY : NAVIGATION_EXTRACTION_DELAY;

    log(`⏱️  Scheduling extraction in ${delay}ms`);

    // Wait for YouTube to update DOM after navigation
    // This prevents capturing the previous video's title with the new URL
    extractionTimeoutId = setTimeout(() => {
      attemptExtraction(currentUrl);
    }, delay);
  }

  // Attempt to extract data with retries (for page load delays)
  function attemptExtraction(url) {
    // Check if URL has changed (user navigated away)
    if (window.location.href !== url) {
      log('⏭️  URL changed during extraction, aborting');
      extractionAttempts = 0;
      return;
    }

    extractionAttempts++;
    log(`🔄 Extraction attempt ${extractionAttempts}/${MAX_EXTRACTION_ATTEMPTS}`);

    const data = extractVideoData();

    if (data) {
      // Verify URL still matches before sending (double-check)
      if (window.location.href === url) {
        lastProcessedUrl = url;
        sendVideoData(data);

        // Clear any fallback retry interval since we succeeded
        if (fallbackCheckInterval) {
          clearInterval(fallbackCheckInterval);
          fallbackCheckInterval = null;
          log('✓ Cleared fallback interval - extraction succeeded');
        }
      }
      extractionAttempts = 0;
    } else if (extractionAttempts < MAX_EXTRACTION_ATTEMPTS) {
      // Retry after delay
      log(`⏳ Retrying in ${EXTRACTION_RETRY_DELAY}ms...`);
      setTimeout(() => attemptExtraction(url), EXTRACTION_RETRY_DELAY);
    } else {
      // Give up after max attempts - but set up fallback retry
      console.warn('YouTube Parental Watch: Failed to extract video data after max attempts');
      log(`⚠️  Setting up fallback retry every ${FALLBACK_CHECK_INTERVAL}ms`);
      extractionAttempts = 0;

      // Set up periodic retry as a fallback
      if (!fallbackCheckInterval && isVideoPage()) {
        fallbackCheckInterval = setInterval(() => {
          // Only retry if we're still on a video page and haven't processed this URL
          if (isVideoPage() && window.location.href !== lastProcessedUrl) {
            log('🔄 Fallback retry triggered');
            const fallbackData = extractVideoData();
            if (fallbackData && window.location.href !== lastProcessedUrl) {
              lastProcessedUrl = window.location.href;
              sendVideoData(fallbackData);
              clearInterval(fallbackCheckInterval);
              fallbackCheckInterval = null;
              log('✓ Fallback retry succeeded');
            }
          } else if (!isVideoPage() || window.location.href === lastProcessedUrl) {
            // Stop checking if we're no longer on a video page or already processed
            clearInterval(fallbackCheckInterval);
            fallbackCheckInterval = null;
            log('✓ Cleared fallback interval - no longer needed');
          }
        }, FALLBACK_CHECK_INTERVAL);
      }
    }
  }

  // Monitor URL changes (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      processPage('mutation-observer');
    }
  }).observe(document, { subtree: true, childList: true });

  // Process initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => processPage('DOMContentLoaded'));
  } else {
    processPage('initial');
  }

  // Also listen for YouTube's own navigation events
  window.addEventListener('yt-navigate-finish', () => processPage('yt-navigate-finish'));

  log('YouTube Parental Watch content script initialized');
})();
