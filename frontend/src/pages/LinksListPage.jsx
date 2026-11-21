import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUrls } from '../api/client';

function LinksListPage() {
    const [urls, setUrls] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        listUrls()
            .then(setUrls)
            .catch((err) => setError(err.message));
    }, []);

    return (
        <div className="page">
            <h1>All Links</h1>
            {error && <p className="error">{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Short Code</th>
                        <th>Long URL</th>
                        <th>Clicks</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {urls.map((url) => (
                        <tr key={url.id}>
                            <td>
                                <Link to={`/links/${url.shortCode}/stats`}>{url.shortCode}</Link>
                            </td>
                            <td className="long-url">{url.longUrl}</td>
                            <td>{url.clickCount}</td>
                            <td>{new Date(url.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LinksListPage;
