import type { Transaction, Category } from '../../models';
import { formatMoney } from '../../utils/currency';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Chip';

export function TransactionRow({ tx, category, onClick }: { tx: Transaction; category?: Category; onClick?: () => void }) {
  const color = category?.color ?? '#8E95A2';
  return (
    <div className="list-item" onClick={onClick} role={onClick ? 'button' : undefined} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="avatar" style={{ background: color + '26', color }}>
        <Icon name={category?.icon ?? 'category'} />
      </div>
      <div className="li-mid">
        <div className="li-t">{tx.description || category?.name || 'Lançamento'}</div>
        <div className="li-s row" style={{ gap: 6 }}>
          <span>{category?.name}</span>
          {tx.installment && <Pill>{tx.installment.index}/{tx.installment.total}</Pill>}
          {tx.recurringId && <Pill>fixo</Pill>}
          {!tx.paid && tx.type === 'expense' && <Pill tone="warn">a pagar</Pill>}
        </div>
      </div>
      <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: tx.type === 'income' ? 'var(--income)' : 'var(--text)' }}>
        {tx.type === 'income' ? '+ ' : '− '}
        {formatMoney(tx.amount)}
      </div>
    </div>
  );
}
