import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTopBar } from '../components/layout/PageTopBar';
import { Seg } from '../components/ui/Seg';
import { Icon } from '../components/ui/Icon';

type Section = 'manage' | 'track' | 'about';

interface Item {
  to: string;
  icon: string;
  title: string;
  subtitle: string;
}

const GROUPS: Record<Section, Item[]> = {
  manage: [
    { to: '/contas', icon: 'account_balance', title: 'Contas', subtitle: 'Bancos, carteira e dinheiro' },
    { to: '/cartoes', icon: 'credit_card', title: 'Cartões de crédito', subtitle: 'Limite, fatura e parcelas' },
    { to: '/metas', icon: 'flag', title: 'Objetivos', subtitle: 'Metas financeiras' },
    { to: '/categorias', icon: 'category', title: 'Categorias', subtitle: 'Receitas e despesas' },
    { to: '/orcamentos', icon: 'savings', title: 'Planejamento', subtitle: 'Limites mensais por categoria' },
    { to: '/backup', icon: 'cloud_upload', title: 'Backup', subtitle: 'Exportar e importar dados' },
  ],
  track: [
    { to: '/relatorios', icon: 'bar_chart', title: 'Gráficos e relatórios', subtitle: 'PDF, Excel e CSV' },
    { to: '/calendario', icon: 'calendar_month', title: 'Calendário', subtitle: 'Contas e eventos por dia' },
    { to: '/busca', icon: 'search', title: 'Buscar', subtitle: 'Encontre qualquer lançamento' },
    { to: '/historico', icon: 'history', title: 'Histórico', subtitle: 'Tudo que foi criado ou alterado' },
  ],
  about: [
    { to: '/configuracoes', icon: 'settings', title: 'Configurações', subtitle: 'Tema, PIN, notificações e mais' },
  ],
};

export function More() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('manage');

  return (
    <>
      <PageTopBar
        title="Mais"
        rightAction={
          <button className="btn icon-only ghost" onClick={() => navigate('/configuracoes')} aria-label="Configurações">
            <Icon name="settings" />
          </button>
        }
      />
      <main className="view stack">
        <Seg
          options={[
            { id: 'manage', label: 'Gerenciar' },
            { id: 'track', label: 'Acompanhar' },
            { id: 'about', label: 'Sobre' },
          ]}
          value={section}
          onChange={(v) => setSection(v as Section)}
        />

        <div className="list">
          {GROUPS[section].map((item) => (
            <div key={item.to} className="list-item" onClick={() => navigate(item.to)} role="button">
              <div className="li-ic">
                <Icon name={item.icon} />
              </div>
              <div className="li-mid">
                <div className="li-t">{item.title}</div>
                <div className="li-s">{item.subtitle}</div>
              </div>
              <div className="li-r">
                <Icon name="chevron_right" />
              </div>
            </div>
          ))}
        </div>

        {section === 'about' && (
          <div className="card pad dim center" style={{ fontSize: 12.5, marginTop: 4 }}>
            <b style={{ color: 'var(--text)' }}>Carteira Everton</b>
            <br />
            Controle de gastos pessoal · 100% offline, dados salvos apenas neste aparelho.
          </div>
        )}
      </main>
    </>
  );
}
