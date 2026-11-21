import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LinksListPage from './pages/LinksListPage';
import StatsPage from './pages/StatsPage';
import './App.css';

function App() {
    return (
        <div className="app">
            <nav>
                <Link to="/">Shorten</Link>
                <Link to="/links">All Links</Link>
            </nav>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/links" element={<LinksListPage />} />
                <Route path="/links/:code/stats" element={<StatsPage />} />
            </Routes>
        </div>
    );
}

export default App;
