import { useState } from 'react';
import { createShortUrl, getShortUrl } from '../api/client';

function HomePage() {
    const [longUrl, setLongUrl] = useState('');
    const [customCode, setCustomCode] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);
        try {
            const data = await createShortUrl(longUrl, customCode);
            setResult(data);
            setLongUrl('');
            setCustomCode('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <h1>Shorten a URL</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="url"
                    placeholder="https://example.com/some/long/path"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="custom code (optional)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Shortening...' : 'Shorten'}
                </button>
            </form>

            {error && <p className="error">{error}</p>}

            {result && (
                <div className="result">
                    <p>Your short link:</p>
                    <a href={getShortUrl(result.shortCode)} target="_blank" rel="noreferrer">
                        {getShortUrl(result.shortCode)}
                    </a>
                </div>
            )}
        </div>
    );
}

export default HomePage;
