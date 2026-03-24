import type { ChartRange } from "../../../types/dashboard";
import type { ChartData, DashboardCoreBundle, Network, Overview } from "../../../types/dashboard";
import { DEFAULT_CURRENCY } from "../../../lib/currency";
import { getCacheControlHeader, dashboardCoreCachePolicy } from "../../../server/cache";
import { executeBundledSection } from "../../../server/dashboard-bundle";
import { jsonResponse } from "../../../server/http";
import { GET as getChart } from "../chart/route";
import { GET as getNetwork } from "../network/route";
import { GET as getOverview } from "../overview/route";

function isValidRange(value: string | null): value is `${ChartRange}` {
  return value === "1" || value === "7" || value === "30";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const currency = url.searchParams.get("currency") ?? DEFAULT_CURRENCY;
  const days = isValidRange(url.searchParams.get("days")) ? url.searchParams.get("days") : "1";

  const [overview, chart, network] = await Promise.all([
    executeBundledSection<Overview>(() =>
      getOverview(new Request(`${origin}/api/overview?currency=${currency}`))
    ),
    executeBundledSection<ChartData>(() =>
      getChart(new Request(`${origin}/api/chart?days=${days}&currency=${currency}`))
    ),
    executeBundledSection<Network>(() => getNetwork()),
  ]);

  const body: DashboardCoreBundle = {
    fetchedAt: new Date().toISOString(),
    sections: {
      overview,
      chart,
      network,
    },
  };

  return jsonResponse(body, {
    headers: {
      "cache-control": getCacheControlHeader(dashboardCoreCachePolicy),
    },
  });
}
