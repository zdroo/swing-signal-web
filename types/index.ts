export type SignalTone = "good" | "neutral" | "caution" | "bad";

export interface MacroIndicatorValueDto {
  value: number;
  signal: string;
  trend: string;
  tone: SignalTone;
  severity: number;
  isMarketMover: boolean;
}

export interface HealthMemberDto {
  key: string;
  signal: string;
  tone: SignalTone;
}

export interface HealthGroupDto {
  name: string;
  question: string;
  score: number;
  label: string;
  members: HealthMemberDto[];
}

export interface MarketHealthDto {
  score: number;
  label: string;
  groups: HealthGroupDto[];
}

export interface WatchlistItemDto {
  symbol: string;
  name: string;
  addedAt: string;
}

export interface WatchlistRowDto {
  symbol: string;
  name: string;
  currentPrice: number | null;
  odds3M: number | null;
  baseRate3M: number | null;
  edge3M: number | null;
  tradeRead: TradeReadDto | null;
  addedAt: string;
}

export interface ScreenerRowDto {
  symbol: string;
  name: string;
  marketType: string;
  currentPrice: number | null;
  odds3M: number | null;
  baseRate3M: number | null;
  edge3M: number | null;
  stance: string | null;
  strength: string | null;
}

export interface ScreenerResultDto {
  rows: ScreenerRowDto[];
  asOf: string | null;
  universeSize: number;
  trimmed: boolean;
}

export interface SectorRotationRowDto {
  symbol: string;
  sector: string;
  odds3M: number | null;
  edge3M: number | null;
  stance: string | null;
  relStrength3M: number | null;
}

export interface SectorRotationResultDto {
  sectors: SectorRotationRowDto[];
  benchmark: string;
  asOf: string | null;
}

export interface EconomicEventDto {
  title: string;
  date: string;
  impact: string;
}

export interface UpcomingEventsDto {
  events: EconomicEventDto[];
  asOf: string;
}

export type PlaybookVerdict = "Favored" | "Neutral" | "Headwinds";

export interface PlaybookAssetDto {
  name: string;
  score: number;
  verdict: PlaybookVerdict;
  reasons: string[];
}

export type TradeStance = "Long bias" | "No edge" | "Stand aside";

export interface TradeReadDto {
  stance: TradeStance;
  horizonDays: number;
  strength: "Strong" | "Moderate" | "Weak";
  reasons: string[];
  note: string;
}

export interface PlaybookDto {
  headline: string;
  note: string;
  assets: PlaybookAssetDto[]; // ranked best-first
}

export interface MacroRegimeDto {
  indicators: Record<string, MacroIndicatorValueDto>;
  health: MarketHealthDto;
  summary: string[];
  playbook: PlaybookDto;
  asOf: string;
}

export interface RegimePlaybookDto {
  id: string;
  name: string;
  summary: string;
  hallmarks: string[];
  healthScore: number;
  healthLabel: string;
  playbook: PlaybookDto;
  isCurrent: boolean;
  matchScore: number; // 0-100 closeness of today's readings to this regime
}

export interface RegimePlaybookBoardDto {
  regimes: RegimePlaybookDto[];
  currentRegimeId: string | null;
  runnerUpRegimeId: string | null;
  note: string;
}

export interface HistoricalMatchDto {
  date: string;
  similarityScore: number;
  topPercent: number;
  indicatorValues: Record<string, number>;
}

export interface LiquidityReadingDto {
  name: string;
  value: number;
  unit: string; // "$T" | "index"
  changePct3M: number;
  trend: string;
  tone: string; // "good" | "bad" | "neutral"
  plain: string;
}

export interface LiquidityComponentDto {
  name: string;
  valueUsdTrillions: number;
  sharePct: number;
}

export interface LiquidityPointDto {
  date: string;
  globalLiquidity: number;
  fedNetLiquidity: number;
  btc: number | null;
  spy: number | null;
}

export interface LiquidityOverlayDto {
  symbol: string;
  correlationPct: number;
  months: number;
}

export interface LiquidityDashboardDto {
  asOf: string;
  globalLiquidity: LiquidityReadingDto;
  fedNetLiquidity: LiquidityReadingDto;
  components: LiquidityComponentDto[];
  usM2: LiquidityReadingDto;
  dollar: LiquidityReadingDto;
  series: LiquidityPointDto[];
  overlays: LiquidityOverlayDto[];
  note: string;
}

export interface HoldingXrayDto {
  symbol: string;
  name: string;
  assetClass: string;
  posture: string; // "Risk-on" | "Defensive"
  weightPct: number;
  medianReturn3M: number;
  worstReturn3M: number;
  volatilityPct: number | null;
  liquidityBeta: number | null;
}

export interface AssetClassWeightDto {
  assetClass: string;
  weightPct: number;
}

export interface ConcentrationDto {
  topWeightPct: number;
  top3Pct: number;
  hhi: number;
  label: string; // "Diversified" | "Moderate" | "Concentrated"
  byClass: AssetClassWeightDto[];
}

export interface ExposureDto {
  riskOnPct: number;
  defensivePct: number;
  liquidityBeta: number;
  liquidityLabel: string;
}

export interface PortfolioOutcomeDto {
  analogs: number;
  confidence: string; // "Very low" | "Low" | "Modest"
  positiveOddsPct: number;
  medianReturn: number;
  worstReturn: number;
  bestReturn: number;
}

export interface PortfolioXrayDto {
  regimeSummary: string;
  holdings: HoldingXrayDto[];
  concentration: ConcentrationDto;
  exposure: ExposureDto;
  outcome: PortfolioOutcomeDto;
  reads: string[];
  note: string;
}

export interface OddsForPeriodDto {
  totalCases: number;
  positiveCases: number;
  positiveOdds: number;
  averageReturn: number;
  medianReturn: number;
  bestCase: number;
  worstCase: number;
  baseRate: number | null;
  edge: number;
}

export interface AnalogPointDto {
  date: string;
  aboveMa200: boolean | null;
}

export interface AnalogBreakdownDto {
  currentAboveMa200: boolean | null;
  aboveCount: number;
  aboveOdds3M: number | null;
  aboveMedian3M: number | null;
  belowCount: number;
  belowOdds3M: number | null;
  belowMedian3M: number | null;
  points: AnalogPointDto[];
}

export interface AssetOddsDto {
  symbol: string;
  name: string;
  matchesUsed: number;
  currentPrice: number | null;
  oneMonth: OddsForPeriodDto;
  threeMonths: OddsForPeriodDto;
  sixMonths: OddsForPeriodDto;
  explanations: string[];
  disclaimer: string;
  breakdown: AnalogBreakdownDto | null;
  tradeRead: TradeReadDto | null;
}

export interface BacktestBucketDto {
  predictedRange: string;
  predictions: number;
  avgPredictedOdds: number;
  actualPositiveRate: number;
}

export interface BacktestResultDto {
  symbol: string;
  name: string;
  days: number;
  topK: number;
  totalPredictions: number;
  firstPrediction: string;
  lastPrediction: string;
  directionalAccuracy: number;
  brierScore: number;
  avgPredictedOdds: number;
  actualPositiveRate: number;
  calibration: BacktestBucketDto[];
  interpretation: string;
  disclaimer: string;
}

export interface BacktestComparisonDto {
  baseline: BacktestResultDto;
  current: BacktestResultDto;
  summary: string;
}

export interface CandleDto {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UserProfileDto {
  email: string;
  plan: string;
  isEmailConfirmed: boolean;
  createdAt: string;
  weeklyReportEnabled: boolean;
  alertsEnabled: boolean;
  hasBilling: boolean;
}

export interface BillingUrlDto {
  url: string;
}

// The refresh token is never in the body — it lives in an HttpOnly cookie.
export interface AuthResponse {
  accessToken: string;
  accessTokenExpiry: string;
  email: string;
  plan: string;
}

export interface SymbolSearchResultDto {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export interface PopularAssetDto {
  symbol: string;
  name: string;
  currentPrice: number;
  changePct: number;
  spark: number[];
  odds3M: number | null;
  baseRate3M: number | null;
  edge3M: number | null;
}

export interface AssetDto {
  id: string;
  symbol: string;
  name: string;
  marketType: string;
  isActive: boolean;
}
