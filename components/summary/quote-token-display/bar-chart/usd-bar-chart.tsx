import { ContentType } from "recharts/types/component/Tooltip";
import {
  NameType,
  ValueType
} from "recharts/types/component/DefaultTooltipContent";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Label,
  Bar,
  Tooltip
} from "recharts";

import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const QuoteTokenBarChartUsd = (props: {
  summary: QuoteTokenSummary;
}) => {
  const ProfitTooltip: ContentType<ValueType, NameType> = (tooltipProps) => {
    if (
      tooltipProps.active &&
      tooltipProps.payload &&
      tooltipProps.payload.length
    ) {
      const { usdFees, usdDeposits, usdImpermanentLoss, usdProfit } =
        tooltipProps.payload[0].payload;
      const profitPercent = usdProfit / usdDeposits;

      return (
        <div className="bg-white text-black p-2">
          <p className="font-bold">{tooltipProps.label}</p>
          <p>
            Total Deposits:{" "}
            {usdDeposits.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
          </p>
          <p>
            Fees:{" "}
            {usdFees.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
          </p>
          <p>
            Impermanent Loss:{" "}
            {usdImpermanentLoss.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
          </p>
          <p className="font-bold">
            Net Profit:{" "}
            {usdProfit.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
          </p>
          <p className="font-bold">
            Profit %:{" "}
            {profitPercent.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              { style: "percent", maximumFractionDigits: 2 }
            )}
          </p>
        </div>
      );
    }

    return null;
  };

  const data = props.summary.base
    .map((base) => {
      return {
        symbol: base.token.symbol,
        usdDeposits: base.summary.usdDeposits,
        usdFees: base.summary.usdFees,
        usdImpermanentLoss: base.summary.usdImpermanentLoss,
        usdProfit: base.summary.usdProfit
      };
    })
    .sort((a, b) => b.usdProfit - a.usdProfit);

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">USD Profit by Token</div>
      <ResponsiveContainer height={200}>
        <BarChart data={data}>
          <XAxis dataKey="symbol" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value="Total USD Profit"
            />
          </YAxis>
          <Tooltip
            content={
              // Adding this to avoid lint complaint on build
              // @ts-ignore
              <ProfitTooltip />
            }
            formatter={(value) =>
              value.toLocaleString(
                Intl.NumberFormat().resolvedOptions().locale,
                {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }
              )
            }
            labelStyle={{ color: "black" }}
          />
          <Bar
            dataKey="usdProfit"
            fill="rgb(37 99 235)"
            name="USD Profit"
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
