import type { Transaction, Category } from '../../models';
import { formatMoney } from '../../utils/currency';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Chip';

export function TransactionRow({
  tx,
  category,
  accountName,
  onClick,
}: {
  tx: Transaction;
  category?: Category;
  accountName?: string;
  onClick?: () => void;
}) {
  const color = category?.color ?? '#8E95A2';
  const paid = tx.paid;
  return (
    <div className="list-item" onClick={onClick} role={onClick ? 'button' : undefined} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="avatar" style={{ width: 44, height: 44, borderRadius: '50%', background: color, color: '#fff' }}>
        <Icon name={category?.icon ?? 'category'} size={20} />
      </div>
      <div className="li-mid">
        <div className="li-t">{tx.description || category?.name || 'Lançamento'}</div>
        <div className="li-s row" style={{ gap: 6 }}>
          <span>
            {category?.name}
            {accountName ? ` | ${accountName}` : ''}
          </span>
          {tx.installment && <Pill>{tx.installment.index}/{tx.installment.total}</Pill>}
          {tx.recurringId && <Pill>fixo</Pill>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
          {tx.type === 'income' ? '+ ' : '− '}
          {formatMoney(tx.amount)}
        </div>
        {tx.type === 'expense' && (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: paid ? 'var(--income)' : 'transparent',
              border: paid ? 'none' : '1.5px solid var(--warn)',
            }}
            title={paid ? 'Pago' : 'A pagar'}
          >
            {paid ? <Icon name="check" size={12} style={{ color: '#fff' }} /> : <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--warn)' }} />}
          </span>
        )}
      </div>
    </div>
  );
}
