import { ClmmDbTx } from "@vladmish1993/meteora-dlmm-db/dist/clmm-db";

export interface Token {
  mint: string;
  symbol: string;
  decimals: number;
  logo: string;
}

interface TransactionData {
  deposits: number;
  fees: number;
  impermanentLoss: number;
  profit: number;
  usdDeposits: number;
  usdFees: number;
  usdImpermanentLoss: number;
  usdProfit: number;
}

interface TransactionSummary extends TransactionData {
  positionCount: number;
  transactionCount: number;
  usdLoadCount: number;
  startDate: Date;
  endDate: Date;
}

interface TransactionTimeSeriesDataPoint {
  blockTime: number;
  date: string;
  dateTime: string;
  profit: number;
  usdProfit: number;
}

export interface TokenSummary {
  token: Token;
  summary: TransactionSummary;
  transactionTimeSeries: TransactionTimeSeriesDataPoint[];
}

export interface QuoteTokenSummary extends TokenSummary {
  base: TokenSummary[];
}

export interface SummaryData {
  positionTransactionCount: number;
  positionCount: number;
  usdLoadCount: number;
  usdFees: number;
  usdImpermanentLoss: number;
  usdProfit: number;
  startDate: Date;
  endDate: Date;
  quote: Map<string, QuoteTokenSummary>;
}

export type PositionStatus = "all" | "open" | "closed";
export type HawksightStatus = "include" | "exclude" | "hawksightOnly";

export interface TransactionFilter {
  startDate: Date;
  endDate: Date;
  positionStatus: PositionStatus;
  hawksight: HawksightStatus;
  baseTokenMints: Set<string>;
  quoteTokenMints: Set<string>;
  displayUsd: boolean;
}

export function generateSummary(
  transactions: ClmmDbTx[]
): SummaryData {
  const summary: SummaryData = {
    positionTransactionCount: 0,
    positionCount: 0,
    usdLoadCount: 0,
    usdFees: 0,
    usdImpermanentLoss: 0,
    usdProfit: 0,
    quote: new Map(),
    startDate: new Date(),
    endDate: new Date()
  };

  const positions: Set<string> = new Set();
  const signatures: Set<string> = new Set();

  transactions.forEach((tx) => {
    positions.add(tx.position_address);
    signatures.add(tx.signature);
    if (!summary.quote.has(tx.quote_mint)) {
      const newQuoteToken: Token = {
        mint: tx.quote_mint,
        symbol: tx.quote_symbol,
        decimals: tx.quote_decimals,
        logo: tx.quote_logo
      };

      summary.quote.set(
        newQuoteToken.mint,
        summarizeToken(transactions, newQuoteToken) as QuoteTokenSummary
      );
    }
  });
  summary.positionCount = positions.size;
  summary.positionTransactionCount = signatures.size;
  summary.usdLoadCount =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
        .map((quoteSummary) => quoteSummary.summary.usdLoadCount)
        .reduce((total, current) => total + current)
      : 0;
  summary.usdFees =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
        .map((quoteSummary) => quoteSummary.summary.usdFees)
        .reduce((total, current) => total + current)
      : 0;
  summary.usdImpermanentLoss =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
        .map((quoteSummary) => quoteSummary.summary.usdImpermanentLoss)
        .reduce((total, current) => total + current)
      : 0;
  summary.usdProfit =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
        .map((quoteSummary) => quoteSummary.summary.usdProfit)
        .reduce((total, current) => total + current)
      : 0;

  summary.quote = new Map(
    Array.from(summary.quote.values())
      .sort((a, b) => b.summary.transactionCount - a.summary.transactionCount)
      .map((s) => [s.token.mint, s])
  );

  summary.startDate = new Date(
    Math.min(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat()
    )
  );

  summary.startDate = new Date(
    Math.min(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat()
    )
  );

  summary.endDate = new Date(
    Math.max(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat()
    )
  );

  return summary;
}

function summarizeToken(
  transactions: ClmmDbTx[],
  quoteToken: Token,
  baseToken?: Token
): TokenSummary | QuoteTokenSummary {
  const { mint: quoteMint } = quoteToken;
  const baseMint = baseToken?.mint;
  const transactionTimeSeries: TransactionTimeSeriesDataPoint[] = [];
  const baseTokens: Map<string, Token> = new Map();

  let summary = {
    positionCount: 0,
    transactionCount: 0,
    usdLoadCount: 0,
    deposits: 0,
    withdraws: 0,
    fees: 0,
    impermanentLoss: 0,
    profit: 0,
    usdDeposits: 0,
    usdWithdraws: 0,
    usdFees: 0,
    usdImpermanentLoss: 0,
    usdProfit: 0,
    startDate: new Date(),
    endDate: new Date()
  };

  const tokenTransactions = transactions.filter(
    (tx) =>
      tx.quote_mint == quoteMint &&
      (!baseMint || (baseMint && tx.base_mint == baseMint))
  );

  summary.startDate = new Date(tokenTransactions[0].block_time * 1000);
  summary.endDate = new Date(
    tokenTransactions[tokenTransactions.length - 1].block_time * 1000
  );

  if (tokenTransactions.length == 0) {
    return {
      token: quoteToken,
      summary,
      transactionTimeSeries
    };
  }

  // Create a set of position addresses to track the # of positions
  const positions: Set<string> = new Set();
  const usdPositions: Set<string> = new Set();

  tokenTransactions.forEach((tx) => {
    let positionCount = positions.size;
    let usdLoadCount = usdPositions.size;

    // Add the position address for opening positions
    if (tx.is_opening_transaction) {
      positions.add(tx.position_address);
      positionCount = positions.size;
      if (tx.usd_deposit + tx.usd_withdrawal > 0) {
        usdPositions.add(tx.position_address);
      }
      usdLoadCount = usdPositions.size;
    }

    // Add the base token if we're creating a quote token summary
    if (!baseTokens.has(tx.base_mint) && positions.has(tx.position_address)) {
      baseTokens.set(tx.base_mint, {
        mint: tx.base_mint,
        symbol: tx.base_symbol,
        decimals: tx.base_decimals,
        logo: tx.base_logo
      });
    }

    // Destructure the current summary to increment all the values
    // using the current transaction
    let {
      transactionCount,
      deposits,
      withdraws,
      fees,
      impermanentLoss,
      profit,
      usdDeposits,
      usdWithdraws,
      usdFees,
      usdImpermanentLoss,
      usdProfit
    } = summary;

    // Update if we have the position (i.e. grabbed the opening transaction)
    if (positions.has(tx.position_address)) {
      // Get the timestamp data
      const { block_time: blockTime } = tx;
      const date = new Date(blockTime * 1000).toLocaleDateString();
      const dateTime =
        date + " " + new Date(blockTime * 1000).toLocaleTimeString();

      // Update all the cumulative values
      transactionCount++;

      deposits = floor(deposits + tx.deposit, tx.quote_decimals);
      withdraws = floor(withdraws + tx.withdrawal, tx.quote_decimals);
      fees = floor(fees + tx.fee_amount, tx.quote_decimals);
      impermanentLoss = floor(withdraws - deposits, tx.quote_decimals);
      profit = floor(impermanentLoss + fees, tx.quote_decimals);
      usdDeposits = floor(usdDeposits + tx.usd_deposit, 2);
      usdWithdraws = floor(usdWithdraws + tx.usd_withdrawal, 2);
      usdFees = floor(usdFees + tx.usd_fee_amount, 2);
      usdImpermanentLoss = floor(usdWithdraws - usdDeposits, 2);
      usdProfit = floor(usdImpermanentLoss + usdFees, 2);

      // Update the main summary with the new cumulative values
      summary = {
        ...summary,
        positionCount,
        transactionCount,
        usdLoadCount,
        deposits,
        withdraws,
        fees,
        impermanentLoss,
        profit,
        usdDeposits,
        usdWithdraws,
        usdFees,
        usdImpermanentLoss,
        usdProfit
      };

      // Add the time series data if it is a close transaction
      if (tx.is_closing_transaction) {
        let profit = floor(
          tokenTransactions
            .filter((t) => t.position_address == tx.position_address)
            .reduce(
              (total, t) => total + t.fee_amount + t.withdrawal - t.deposit,
              0
            ),
          tx.quote_decimals
        );

        let usdProfit = floor(
          tokenTransactions
            .filter((t) => t.position_address == tx.position_address)
            .reduce(
              (total, t) =>
                total + t.usd_fee_amount + t.usd_withdrawal - t.usd_deposit,
              0
            ),
          2
        );

        if (transactionTimeSeries.length > 0) {
          profit +=
            transactionTimeSeries[transactionTimeSeries.length - 1].profit;
          usdProfit +=
            transactionTimeSeries[transactionTimeSeries.length - 1].usdProfit;
        }

        transactionTimeSeries.push({
          blockTime,
          date,
          dateTime,
          profit,
          usdProfit
        });
      }
    }
  });

  if (baseToken) {
    return {
      token: baseToken,
      summary,
      transactionTimeSeries
    };
  }

  const base = Array.from(baseTokens.values()).map((baseToken) =>
    summarizeToken(transactions, quoteToken, baseToken)
  );

  return {
    token: quoteToken,
    summary,
    transactionTimeSeries,
    base
  };
}

export function applyFilter(
  transactions: ClmmDbTx[],
  transactionFilter: TransactionFilter,
  applyTokenFilters = true
) {
  return transactions.filter((tx) => {
    if (tx.block_time < transactionFilter.startDate.getTime() / 1000)
      return false;
    if (
      tx.block_time >
      transactionFilter.endDate.getTime() / 1000 + 60 * 60 * 24
    )
      return false;
    if (transactionFilter.positionStatus === "closed" && tx.position_is_open)
      return false;
    if (transactionFilter.positionStatus === "open" && !tx.position_is_open)
      return false;
    if (transactionFilter.hawksight == "exclude" && tx.is_hawksight)
      return false;
    if (transactionFilter.hawksight == "hawksightOnly" && !tx.is_hawksight)
      return false;
    if (!applyTokenFilters) return true;
    if (!transactionFilter.baseTokenMints.has(tx.base_mint)) return false;
    if (!transactionFilter.quoteTokenMints.has(tx.quote_mint)) return false;

    return true;
  });
}

function floor(value: number, decimals: number) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
