import { useNavigate } from 'react-router-dom';
import { MonthTopBar } from '../components/layout/MonthTopBar';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { TransactionRow } from '../components/transaction/TransactionRow';
import { DonutChart } from '../components/charts/DonutChart';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { useMonth } from '../contexts';
import { useDashboard } from '../hooks/useDashboard';
import { useFinancialHealth } from '../hooks/useFinancialHealth';
import { useInsights } from '../hooks/useInsights';
import { useCategoryMap } from '../hooks/useCategories';
import { useAccountBalances } from '../hooks/useAccountBalances';
import { useBudgets } from '../hooks/useBudgets';
import { formatMoney } from '../utils/currency';
import { dayHeading, monthTitle } from '../utils/date';

export function Dashboard() {
  const navigate = useNavigate();
  const { month } = useMonth();
  const data = useDashboard(month);
  const health = useFinancialHealth(month);
  const insights = useInsights(month);
  const catMap = useCategoryMap();
  const { total: totalBalance } = useAccountBalances();
  const { budgets } = useBudgets();
  const generalBudget = budgets.find((b) => b.id === 'general');

  if (!data) {
    return (
      <>
        <MonthTopBar />
        <main className="view stack">
          <SkeletonCard />
          <SkeletonCard />
        </main>
      </>
    );
  }

  const budgetPct = generalBudget ? Math.min(100, Math.round((data.expense / generalBudget.amount) * 100)) : 0;
  const budgetTone = !generalBudget ? 'primary' : data.expense > generalBudget.amount ? 'over' : data.expense > generalBudget.amount * 0.85 ? 'warn' : 'primary';

  return (
    <>
      <MonthTopBar
        rightAction={
          <button className="btn icon-only ghost" onClick={() => navigate('/busca')} aria-label="Buscar">
            <Icon name="search" />
          </button>
        }
      />
      <main className="view stack">
        {/* Saldo disponível */}
        <Card elevated>
          <div className="row-between">
            <div>
              <div className="dim" style={{ fontSize: 12.5, fontWeight: 600 }}>Saldo disponível</div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>{formatMoney(totalBalance)}</div>
            </div>
            {health && (
              <div className="center" style={{ minWidth: 74 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `3px solid ${health.color}`, margin: '0 auto' }}>
                  <span className="mono" style={{ fontWeight: 800, fontSize: 15 }}>{health.score}</span>
                </div>
                <div style={{ fontSize: 10.5, color: health.color, fontWeight: 700, marginTop: 4 }}>{health.label}</div>
              </div>
            )}
          </div>

          <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '11px 13px' }}>
              <div className="dim" style={{ fontSize: 11.5, fontWeight: 600 }}>Receitas ({monthTitle(month).split(' ')[0]})</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--income)', marginTop: 2 }}>{formatMoney(data.income)}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '11px 13px' }}>
              <div className="dim" style={{ fontSize: 11.5, fontWeight: 600 }}>Despesas</div>
              <div className="mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{formatMoney(data.expense)}</div>
            </div>
          </div>

          {generalBudget && (
            <div style={{ marginTop: 14 }}>
              <ProgressBar value={budgetPct} tone={budgetTone} />
              <div className="row-between" style={{ marginTop: 6, fontSize: 12 }}>
                <span className="dim">Meta do mês: {budgetPct}%</span>
                <span className="dim">Limite {formatMoney(generalBudget.amount)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Pode gastar hoje / maior gasto / maior categoria */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card>
            <div className="dim" style={{ fontSize: 11.5, fontWeight: 600 }}>Economia do mês</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 3, color: data.savings > 0 ? 'var(--income)' : 'var(--text)' }}>{formatMoney(data.savings)}</div>
            <div className="dim" style={{ fontSize: 11 }}>{Math.round(data.savingsRate * 100)}% da receita</div>
          </Card>
          <Card>
            <div className="dim" style={{ fontSize: 11.5, fontWeight: 600 }}>Maior gasto</div>
            {data.biggestExpense ? (
              <>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{formatMoney(data.biggestExpense.amount)}</div>
                <div className="dim" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.biggestExpense.description || catMap.get(data.biggestExpense.categoryId)?.name}
                </div>
              </>
            ) : (
              <div className="dim" style={{ fontSize: 13, marginTop: 4 }}>—</div>
            )}
          </Card>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <div className="section-title" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', margin: '4px 2px' }}>Insights</div>
            <div className="stack">
              {insights.slice(0, 4).map((ins) => (
                <div key={ins.id} className={`alert ${ins.kind === 'negative' || ins.kind === 'alert' ? 'over' : ins.kind === 'positive' ? 'ok' : 'warn'}`}>
                  <Icon name={ins.icon} className="ai" />
                  <span style={{ fontSize: 13 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Próximas contas */}
        {data.upcomingBills.length > 0 && (
          <>
            <div className="section-title" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', margin: '10px 2px 0' }}>Próximas contas</div>
            <div className="list">
              {data.upcomingBills.map((t) => (
                <TransactionRow key={t.id} tx={t} category={catMap.get(t.categoryId)} />
              ))}
            </div>
          </>
        )}

        {data.overdueBills.length > 0 && (
          <div className="alert over">
            <Icon name="warning" className="ai" />
            <span style={{ fontSize: 13 }}>
              <b>{data.overdueBills.length} conta(s) vencida(s)</b> totalizando {formatMoney(data.overdueBills.reduce((s, t) => s + t.amount, 0))}.
            </span>
          </div>
        )}

        {/* Gráfico por categoria */}
        {data.byCategory.length > 0 && (
          <>
            <div className="section-title" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', margin: '10px 2px 0' }}>Por categoria</div>
            <Card>
              <DonutChart
                slices={data.byCategory.slice(0, 8).map((c) => ({ label: catMap.get(c.catId)?.name ?? '—', value: c.amount, color: catMap.get(c.catId)?.color ?? '#8E95A2' }))}
              />
              <div className="stack" style={{ marginTop: 14 }}>
                {data.byCategory.slice(0, 5).map((c) => {
                  const cat = catMap.get(c.catId);
                  const pct = data.expense ? Math.round((c.amount / data.expense) * 100) : 0;
                  return (
                    <div key={c.catId} className="row" style={{ gap: 9, fontSize: 13 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: cat?.color, flex: '0 0 auto' }} />
                      <span className="grow muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.name}</span>
                      <span className="mono" style={{ fontWeight: 700 }}>{formatMoney(c.amount)}</span>
                      <span className="dim" style={{ width: 36, textAlign: 'right', fontSize: 11.5 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* Gráfico mensal */}
        <div className="section-title" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', margin: '10px 2px 0' }}>Evolução mensal</div>
        <Card>
          <BarChart labels={data.monthlySeries.map((m) => m.label)} values={data.monthlySeries.map((m) => m.expense)} highlightIndex={data.monthlySeries.length - 1} />
        </Card>

        {/* Linha do tempo financeira */}
        {data.dailyTimeline.length > 1 && (
          <>
            <div className="section-title" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', margin: '10px 2px 0' }}>Linha do tempo</div>
            <Card>
              <LineChart labels={data.dailyTimeline.map((d) => d.day)} values={data.dailyTimeline.map((d) => d.cumulative)} />
            </Card>
          </>
        )}

        {/* Últimos lançamentos */}
        <div className="section-title row-between" style={{ margin: '10px 2px 0' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)' }}>Últimos lançamentos</span>
          <button className="dim" style={{ fontSize: 12.5, fontWeight: 700 }} onClick={() => navigate('/lancamentos')}>
            Ver tudo
          </button>
        </div>
        {data.recent.length === 0 ? (
          <EmptyState icon="receipt_long" title="Nenhum lançamento neste mês" subtitle="Toque no botão + para registrar seu primeiro gasto ou receita." />
        ) : (
          <div className="list">
            {data.recent.map((t) => (
              <TransactionRow key={t.id} tx={t} category={catMap.get(t.categoryId)} onClick={() => navigate(`/lancamentos?edit=${t.id}`)} />
            ))}
          </div>
        )}

        {data.recent.length > 0 && data.recent[0] && (
          <div className="dim center" style={{ fontSize: 11.5, marginTop: -4 }}>
            Último lançamento: {dayHeading(data.recent[0].date)}
          </div>
        )}
      </main>
    </>
  );
}
