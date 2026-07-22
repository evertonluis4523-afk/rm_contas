# 💚 Meus Gastos — Controle de Gastos Mensais

Aplicativo **para celular** de controle de gastos mensais, com relatórios e
orçamentos ("cuidados"). É um **PWA offline**, instalável na tela inicial do
celular, que funciona **sem internet e sem servidor** — todos os dados ficam
salvos apenas no próprio aparelho.

> Sistema **independente** dos sistemas RM. Vive nesta pasta isolada
> (`controle-gastos/`) e não compartilha código nem dados com o app de Contas a
> Pagar que está na raiz do repositório.

## ✨ Funcionalidades

- **Início** — resumo do mês: total gasto, receitas, saldo e progresso do
  orçamento; gastos por categoria; lista de lançamentos agrupada por dia.
- **Lançamentos** — registre despesas e receitas com valor, categoria, data,
  forma de pagamento (Pix, Débito, Crédito, Dinheiro, Boleto, Transferência) e
  descrição. Edite ou remova tocando em qualquer lançamento.
- **Gastos fixos** — marque "Repetir todo mês" para contas recorrentes
  (aluguel, assinaturas...); elas são lançadas automaticamente a cada mês.
- **Relatórios** — gráfico de rosca por categoria, evolução mensal em barras
  (6 ou 12 meses), comparação com o mês anterior e maiores gastos.
- **Cuidados** — orçamento mensal geral e limites por categoria, com barras de
  progresso e **alertas** quando você se aproxima ou ultrapassa um limite.
- **Ajustes** — tema claro/escuro/automático, exportar e importar backup (JSON)
  e apagar todos os dados.

## 🎨 Design

- Mobile-first, minimalista e organizado, com navegação inferior por abas e
  botão flutuante para novo lançamento.
- Tema **claro e escuro** (segue o sistema ou pode ser fixado).
- **Zero dependências externas** — os gráficos são desenhados em SVG próprio,
  então o app carrega instantâneo e funciona 100% offline.

## 📲 Como usar / instalar no celular

1. Publique a pasta `controle-gastos/` em qualquer hospedagem estática com
   HTTPS (ex.: GitHub Pages) ou abra o `index.html` localmente.
2. No celular, acesse a URL pelo navegador.
3. Toque em **"Adicionar à tela inicial"** (Android/Chrome ou iPhone/Safari).
4. Pronto: o app abre em tela cheia, como um aplicativo nativo, e funciona
   mesmo sem internet.

### Publicar no GitHub Pages

Ative o GitHub Pages apontando para esta pasta e acesse:
`https://<usuario>.github.io/rm_contas/controle-gastos/`

## 🔒 Privacidade

Nenhum dado sai do seu aparelho. Não há login, backend nem rastreamento.
Faça backups pela opção **Exportar** em *Ajustes* para não perder o histórico
ao trocar de celular ou limpar o navegador.

## 🗂️ Estrutura

```
controle-gastos/
├── index.html              # Shell do app
├── css/app.css             # Estilos (tema claro/escuro)
├── js/app.js               # Toda a lógica (sem dependências)
├── manifest.webmanifest    # Configuração do PWA
├── sw.js                   # Service worker (offline)
└── icons/                  # Ícones do app (SVG)
```
