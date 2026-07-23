import { useState } from 'react';
import { PageTopBar } from '../components/layout/PageTopBar';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { useCards, useCardInvoice } from '../hooks/useCards';
import { formatMoney } from '../utils/currency';
import { useMonth } from '../contexts';
import { CardFormSheet } from '../components/forms/CardFormSheet';
import type { Card as CardModel } from '../models';

export function Cards() {
  const { cards } = useCards();
  const { month } = useMonth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CardModel | null>(null);

  return (
    <>
      <PageTopBar
        title="Cartões"
        back
        rightAction={
          <button className="btn icon-only ghost" onClick={() => { setEditing(null); setOpen(true); }} aria-label="Novo cartão">
            <Icon name="add" />
          </button>
        }
      />
      <main className="view stack">
        {cards.length === 0 ? (
          <EmptyState icon="credit_card" title="Nenhum cartão cadastrado" subtitle="Adicione seus cartões de crédito para acompanhar limite, fatura e parcelas." />
        ) : (
          <div className="stack">
            {cards.map((c) => (
              <CardTile key={c.id} card={c} month={month} onEdit={() => { setEditing(c); setOpen(true); }} />
            ))}
          </div>
        )}
      </main>
      <CardFormSheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}

function CardTile({ card, month, onEdit }: { card: CardModel; month: string; onEdit: () => void }) {
  const invoice = useCardInvoice(card.id, month);
  const available = Math.max(0, card.limit - invoice);
  const pct = card.limit > 0 ? Math.min(100, Math.round((invoice / card.limit) * 100)) : 0;

  return (
    <div
      onClick={onEdit}
      style={{
        borderRadius: 22,
        padding: 20,
        background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)`,
        color: '#fff',
        boxShadow: `0 14px 30px ${card.color}40`,
        cursor: 'pointer',
      }}
    >
      <div className="row-between">
        <div style={{ fontWeight: 700, fontSize: 15 }}>{card.name}</div>
        <Icon name="credit_card" />
      </div>
      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.85 }}>Fatura atual</div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 800 }}>{formatMoney(invoice)}</div>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99 }} />
        </div>
        <div className="row-between" style={{ marginTop: 8, fontSize: 11, opacity: 0.9 }}>
          <span>Disponível {formatMoney(available)}</span>
          <span>Limite {formatMoney(card.limit)}</span>
        </div>
      </div>
      <div className="row-between" style={{ marginTop: 14, fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span>Fecha dia {card.closingDay}</span>
        <span>{card.brand}</span>
        <span>Vence dia {card.dueDay}</span>
      </div>
    </div>
  );
}
