import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const TABS = [
  { to: '/', label: 'Principal', icon: 'grid_view' },
  { to: '/lancamentos', label: 'Transações', icon: 'sync_alt' },
  { to: '__fab__', label: '', icon: '' },
  { to: '/orcamentos', label: 'Planejamento', icon: 'flag' },
  { to: '/mais', label: 'Mais', icon: 'more_horiz' },
] as const;

export function BottomNav({ onFabClick }: { onFabClick: () => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((tab) =>
        tab.to === '__fab__' ? (
          <div key="fab-slot" className="tab-fab-slot">
            <button className="tab-fab" onClick={onFabClick} aria-label="Novo lançamento">
              <Icon name="add" />
            </button>
          </div>
        ) : (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `tab${isActive ? ' on' : ''}`}>
            <span className="tab-pill">
              <Icon name={tab.icon} />
            </span>
            <span className="tab-label">{tab.label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
