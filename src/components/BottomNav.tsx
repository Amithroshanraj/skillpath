import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Map, Trophy, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const tabs = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/assessment-choice', icon: ClipboardCheck, label: 'Assessment' },
  { path: '/roadmap', icon: Map, label: 'Roadmap' },
  { path: '/career-ready', icon: Trophy, label: 'Career' },
  { path: '/about', icon: Info, label: 'About' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 transition-all ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              {isActive && <div className="h-0.5 w-4 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
