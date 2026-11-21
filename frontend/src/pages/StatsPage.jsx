import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUrlStats, getShortUrl } from '../api/client';

function StatsPage() {
    const { code } = useParams();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    function load() {
        getUrlStats(code)
            .then(setStats)
            .catch((err) => setError(err.message));
    }

    useEffect(() => {
        load();
    }, [code]);

    if (error) return <div className="page"><p className="error">{error}</p></div>;
    if (!stats) return <div className="page"><p>Loading...</p></div>;

    return (
        <div className="page">
            <h1>Stats for {stats.shortCode}</h1>
            <p>
                <a href={getShortUrl(stats.shortCode)} target="_blank" rel="noreferrer">
                    {getShortUrl(stats.shortCode)}
                </a>{' '}
                &rarr; {stats.longUrl}
            </p>
            <p>Created: {new Date(stats.createdAt).toLocaleString()}</p>
            <p><strong>Total clicks: {stats.clickCount}</strong></p>

            {stats.analytics ? (
                <>
                    <h2>Clicks by day</h2>
                    <ul>
                        {stats.analytics.clicksByDay.map((d) => (
                            <li key={d.date}>
                                {new Date(d.date).toLocaleDateString()}: {d.count}
                            </li>
                        ))}
                        {stats.analytics.clicksByDay.length === 0 && <li>No data yet</li>}
                    </ul>

                    <h2>Top referrers</h2>
                    <ul>
                        {stats.analytics.topReferrers.map((r, i) => (
                            <li key={i}>{r.referrer || 'direct'}: {r.count}</li>
                        ))}
                        {stats.analytics.topReferrers.length === 0 && <li>No data yet</li>}
                    </ul>
                </>
            ) : (
                <p className="error">Analytics service unavailable — showing basic stats only.</p>
            )}

            <button onClick={load}>Refresh</button>
            <p><Link to="/links">&larr; Back to all links</Link></p>
        </div>
    );
}

export default StatsPage;
