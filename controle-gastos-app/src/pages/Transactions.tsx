import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTopBar } from '../components/layout/PageTopBar';
import { EmptyState } from '../components/ui/EmptyState';
import { TransactionRow } from '../components/transaction/TransactionRow';
import { TransactionSheet } from '../components/transaction/TransactionSheet';
import { useMonth } from '../contexts';
import { useTransactions } from '../hooks/useTransactions';
import { useCategoryMap } from '../hooks/useCategories';
import { dayHeading, monthTitle } from '../utils/date';
import { formatMoney } from '../utils/currency';
import type { Transaction } from '../models';

export function Transactions() {
  const { month } = useMonth();
  const { transactions } = useTransactions(month);
  const catMap = useCategoryMap();
  const [params, setParams] = useSearchParams();

  const editingId = params.get('edit');
  const editingTx = useMemo(() => transactions.find((t) => t.id === editingId) ?? null, [transactions, editingId]);

  const grouped = useMemo(() => {
    const days = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const list = days.get(t.date) ?? [];
      list.push(t);
      days.set(t.date, list);
    });
    return [...days.entries()];
  }, [transactions]);

  function closeSheet() {
    if (editingId) {
      params.delete('edit');
      setParams(params, { replace: true });
    }
  }

  return (
    <>
      <PageTopBar title={`Lançamentos — ${monthTitle(month)}`} back />
      <main className="view stack">
        {transactions.length === 0 ? (
          <EmptyState icon="receipt_long" title="Nenhum lançamento neste mês" subtitle="Toque no + para registrar um gasto ou receita." />
        ) : (
          grouped.map(([date, list]) => (
            <div key={date}>
              <div className="row-between" style={{ padding: '12px 4px 7px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
                <span>{dayHeading(date)}</span>
                <span className="mono">{formatMoney(list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}</span>
              </div>
              <div className="list">
                {list.map((t) => (
                  <TransactionRow key={t.id} tx={t} category={catMap.get(t.categoryId)} onClick={() => setParams({ edit: t.id })} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      <TransactionSheet open={!!editingTx} onClose={closeSheet} editing={editingTx} />
    </>
  );
}
