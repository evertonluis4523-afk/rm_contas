import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { FabButton } from '../ui/Button';

const TABS = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/metas', label: 'Metas', icon: 'flag' },
  { to: '__fab__', label: '', icon: '' },
  { to: '/relatorios', label: 'Relatórios', icon: 'bar_chart' },
  { to: '/mais', label: 'Mais', icon: 'apps' },
] as const;

export function BottomNav({ onFabClick }: { onFabClick: () => void }) {
  return (
    <>
      <FabButton onClick={onFabClick} />
      <nav className="tabbar">
        {TABS.map((tab) =>
          tab.to === '__fab__' ? (
            <div key="fab-spacer" style={{ flex: 1 }} />
          ) : (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `tab${isActive ? ' on' : ''}`}>
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </>
  );
}
