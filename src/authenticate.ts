import config from '../config';

const CLIENT_ID = config.clientId;
const CLIENT_SECRET = config.clientSecret;
const redirectUri = config.redirectUri;
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

// retrieve access token, or refresh if expired
export async function getAccessToken() {
  const { accessToken, expiresIn } = await chrome.storage.local.get([
    'accessToken',
    'expiresIn',
  ]);
  if (!accessToken || Date.now() >= expiresIn) {
    await refreshAccessToken();
    const updatedData = await chrome.storage.local.get('accessToken');
    console.log('attempted access token: ' + updatedData.accessToken);
    return updatedData.accessToken;
  }
  return accessToken;
}

export async function refreshAccessToken() {
  const { refreshToken } = await chrome.storage.local.get('refreshToken');
  if (!refreshToken) {
    await authenticate(); // Restart the flow if there's no refresh token
    return;
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (response.ok) {
    const data = await response.json();
    chrome.storage.local.set({
      accessToken: data.access_token,
      expiresIn: Date.now() + data.expires_in * 1000,
    });
    console.log('Access token refreshed.');
  } else {
    console.error('Failed to refresh access token:', response.statusText);
  }
}

// authenticate user and get access and refresh tokens
async function exchangeCodeForTokens(code: string) {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  });

  if (response.ok) {
    const data = await response.json();
    chrome.storage.local.set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: Date.now() + data.expires_in * 1000,
    });
    console.log('Tokens stored successfully.');
  } else {
    console.error('Failed to exchange code for tokens:', response.statusText);
  }
}

export const authenticate = async () => {
  console.log('Authorizing user...');
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
  ];
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}`;

  try {
    const redirectUriWithCode = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
    if (!redirectUriWithCode) return;
    const authorizationCode = new URL(redirectUriWithCode).searchParams.get(
      'code',
    );
    if (authorizationCode) {
      await exchangeCodeForTokens(authorizationCode);
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};