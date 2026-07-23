import { useState } from 'react';
import { PageTopBar } from '../components/layout/PageTopBar';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountBalances } from '../hooks/useAccountBalances';
import { formatMoney } from '../utils/currency';
import { AccountFormSheet } from '../components/forms/AccountFormSheet';
import type { Account } from '../models';

export function Accounts() {
  const { accounts } = useAccounts();
  const { balances } = useAccountBalances();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  return (
    <>
      <PageTopBar
        title="Contas"
        back
        rightAction={
          <button className="btn icon-only ghost" onClick={() => { setEditing(null); setOpen(true); }} aria-label="Nova conta">
            <Icon name="add" />
          </button>
        }
      />
      <main className="view stack">
        {accounts.length === 0 ? (
          <EmptyState icon="account_balance" title="Nenhuma conta cadastrada" subtitle="Adicione suas contas bancárias, carteira e dinheiro para acompanhar o saldo." />
        ) : (
          <div className="stack">
            {accounts.map((a) => (
              <Card key={a.id} interactive onClick={() => { setEditing(a); setOpen(true); }} className="row-between">
                <div className="row" style={{ gap: 12 }}>
                  <span className="avatar" style={{ background: a.color + '26', color: a.color }}>
                    <Icon name={a.icon} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{a.name}</div>
                    <div className="dim" style={{ fontSize: 11.5, textTransform: 'capitalize' }}>{kindLabel(a.kind)}</div>
                  </div>
                </div>
                <div className="mono" style={{ fontWeight: 800, fontSize: 15 }}>{formatMoney(balances.get(a.id) ?? a.balance)}</div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <AccountFormSheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}

function kindLabel(kind: Account['kind']): string {
  return { checking: 'Conta corrente', savings: 'Poupança', wallet: 'Carteira', cash: 'Dinheiro', investment: 'Investimento' }[kind];
}
