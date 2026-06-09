import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PredictionDetail from './pages/PredictionDetail';
import Leaderboard from './pages/Leaderboard';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/predictions/:id" element={<PredictionDetail />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}
