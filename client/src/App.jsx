import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import PredictionDetail from './pages/PredictionDetail';
import Leaderboard from './pages/Leaderboard';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import BuyCredits from './pages/BuyCredits';
import NotFound from './pages/NotFound';
import BottomNav from './components/BottomNav';

const HIDE_NAV = ['/admin', '/auth/callback'];

export default function App() {
  const { pathname } = useLocation();
  const showNav = !HIDE_NAV.some(p => pathname.startsWith(p));

  return (
    <>
      <div className={showNav ? 'pb-16' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/predictions/:id" element={<PredictionDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credits" element={<BuyCredits />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
