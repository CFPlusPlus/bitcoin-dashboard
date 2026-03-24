import type {
  DashboardSlowBundle,
  MarketContextChartData,
  OnChainActivity,
  Performance,
  Sentiment,
} from "../../../types/dashboard";
import { DEFAULT_CURRENCY } from "../../../lib/currency";
import { getCacheControlHeader, dashboardSlowCachePolicy } from "../../../server/cache";
import { executeBundledSection } from "../../../server/dashboard-bundle";
import { jsonResponse } from "../../../server/http";
import { GET as getMarketContextChart } from "../market-context-chart/route";
import { GET as getOnChainActivity } from "../onchain-activity/route";
import { GET as getPerformance } from "../performance/route";
import { GET as getSentiment } from "../sentiment/route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const currency = url.searchParams.get("currency") ?? DEFAULT_CURRENCY;

  const [onChainActivity, sentiment, performance, marketContextChart] = await Promise.all([
    executeBundledSection<OnChainActivity>(() => getOnChainActivity()),
    executeBundledSection<Sentiment>(() => getSentiment()),
    executeBundledSection<Performance>(() =>
      getPerformance(new Request(`${origin}/api/performance?currency=${currency}`))
    ),
    executeBundledSection<MarketContextChartData>(() =>
      getMarketContextChart(new Request(`${origin}/api/market-context-chart?currency=${currency}`))
    ),
  ]);

  const body: DashboardSlowBundle = {
    fetchedAt: new Date().toISOString(),
    sections: {
      onChainActivity,
      sentiment,
      performance,
      marketContextChart,
    },
  };

  return jsonResponse(body, {
    headers: {
      "cache-control": getCacheControlHeader(dashboardSlowCachePolicy),
    },
  });
}
