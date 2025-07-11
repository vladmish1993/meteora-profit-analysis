import { RaydiumClmmDownloaderStats } from "@vladmish1993/meteora-dlmm-db/dist/clmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { SummaryLeftComplete } from "@/components/summary/top/left/summary-left-complete";
import { SummaryLeftLoading } from "@/components/summary/top/left/summary-left-loading";

export const SummaryLeft = (props: {
  duration: number;
  done: boolean;
  data: SummaryData;
  stats: RaydiumClmmDownloaderStats;
}) => {
  if (props.done) {
    return <SummaryLeftComplete {...props} />;
  }

  return <SummaryLeftLoading {...props} />;
};
