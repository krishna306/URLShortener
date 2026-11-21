// Strip a trailing slash so "https://x.onrender.com/" doesn't produce "//api/...".
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function createShortUrl(longUrl, customCode) {
    const response = await fetch(`${API_BASE_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl, customCode: customCode || undefined })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to create short URL');
    }
    return data;
}

export async function listUrls() {
    const response = await fetch(`${API_BASE_URL}/api/urls`);
    if (!response.ok) {
        throw new Error('Failed to load URLs');
    }
    return response.json();
}

export async function getUrlStats(shortCode) {
    const response = await fetch(`${API_BASE_URL}/api/urls/${shortCode}/stats`);
    if (!response.ok) {
        throw new Error('Failed to load stats');
    }
    return response.json();
}

export function getShortUrl(shortCode) {
    return `${API_BASE_URL}/${shortCode}`;
}
