import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function BottomNav() {
  const { user } = useAuth();

  const items = [
    { to: '/', icon: '🎯', label: 'หน้าหลัก', exact: true },
    { to: '/leaderboard', icon: '🏆', label: 'อันดับ' },
    ...(user ? [{ to: '/profile', icon: '👤', label: 'โปรไฟล์' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 pb-safe">
      <div className="max-w-lg mx-auto flex">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
