import { useNavigate } from 'react-router-dom';
import { PageTopBar } from '../components/layout/PageTopBar';
import { Icon } from '../components/ui/Icon';

const ITEMS = [
  { to: '/contas', icon: 'account_balance', title: 'Contas', subtitle: 'Bancos, carteira e dinheiro' },
  { to: '/cartoes', icon: 'credit_card', title: 'Cartões', subtitle: 'Limite, fatura e parcelas' },
  { to: '/categorias', icon: 'category', title: 'Categorias', subtitle: 'Organize receitas e despesas' },
  { to: '/orcamentos', icon: 'savings', title: 'Orçamentos', subtitle: 'Limites mensais por categoria' },
  { to: '/calendario', icon: 'calendar_month', title: 'Calendário financeiro', subtitle: 'Contas e eventos por dia' },
  { to: '/busca', icon: 'search', title: 'Buscar', subtitle: 'Encontre qualquer lançamento' },
  { to: '/historico', icon: 'history', title: 'Histórico', subtitle: 'Tudo que foi criado ou alterado' },
  { to: '/backup', icon: 'cloud_upload', title: 'Backup', subtitle: 'Exportar, importar e sincronizar' },
  { to: '/configuracoes', icon: 'settings', title: 'Configurações', subtitle: 'Tema, PIN, notificações e mais' },
];

export function More() {
  const navigate = useNavigate();
  return (
    <>
      <PageTopBar title="Mais" />
      <main className="view">
        <div className="list">
          {ITEMS.map((item) => (
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
      </main>
    </>
  );
}
