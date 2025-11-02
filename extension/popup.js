const API_URL = 'http://localhost:8000/api';

// Generate or get device UUID
function getDeviceUUID() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['deviceUUID'], (result) => {
      if (result.deviceUUID) {
        resolve(result.deviceUUID);
      } else {
        const uuid = crypto.randomUUID();
        chrome.storage.local.set({ deviceUUID: uuid }, () => {
          resolve(uuid);
        });
      }
    });
  });
}

// Get browser info
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
  }

  return { browser, version };
}

// Check activation status
async function checkActivationStatus() {
  const statusContainer = document.getElementById('statusContainer');
  const activationForm = document.getElementById('activationForm');
  const deviceInfoDiv = document.getElementById('deviceInfo');

  chrome.storage.local.get(['deviceToken', 'deviceName', 'activatedAt'], (result) => {
    if (result.deviceToken) {
      // Device is activated
      statusContainer.innerHTML = '<div class="status active">✓ Device Activated</div>';
      activationForm.style.display = 'none';
      deviceInfoDiv.style.display = 'block';
      deviceInfoDiv.innerHTML = `
        <div class="device-info">
          <p><strong>Device:</strong> ${result.deviceName || 'Browser Extension'}</p>
          <p><strong>Activated:</strong> ${result.activatedAt ? new Date(result.activatedAt).toLocaleString() : 'Unknown'}</p>
          <p><strong>Status:</strong> Monitoring active</p>
        </div>
      `;
    } else {
      statusContainer.innerHTML = '<div class="status inactive">⚠ Device Not Activated</div>';
      activationForm.style.display = 'block';
      deviceInfoDiv.style.display = 'none';
    }
  });
}

// Activate device
async function activateDevice(code) {
  const errorDiv = document.getElementById('error');
  const activateBtn = document.getElementById('activateBtn');

  errorDiv.textContent = '';
  activateBtn.disabled = true;
  activateBtn.textContent = 'Activating...';

  try {
    const deviceUUID = await getDeviceUUID();
    const { browser, version } = getBrowserInfo();

    const response = await fetch(`${API_URL}/devices/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code.toUpperCase(),
        device_uuid: deviceUUID,
        name: `${browser} Extension`,
        browser_type: browser,
        browser_version: version,
        os: navigator.platform,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Activation failed');
    }

    // Store device token
    await chrome.storage.local.set({
      deviceToken: data.token,
      deviceName: data.device.name,
      activatedAt: new Date().toISOString(),
      deviceId: data.device.id,
    });

    errorDiv.textContent = '';
    errorDiv.style.color = '#059669';
    errorDiv.textContent = '✓ Device activated successfully!';

    setTimeout(() => {
      checkActivationStatus();
    }, 1000);
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.color = '#dc2626';
  } finally {
    activateBtn.disabled = false;
    activateBtn.textContent = 'Activate Device';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkActivationStatus();

  document.getElementById('activateBtn').addEventListener('click', () => {
    const code = document.getElementById('activationCode').value.trim();
    if (code.length !== 12) {
      document.getElementById('error').textContent = 'Please enter a valid 12-character code';
      return;
    }
    activateDevice(code);
  });

  document.getElementById('activationCode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('activateBtn').click();
    }
  });
});
