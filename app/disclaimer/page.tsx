import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "What SwingSignal is, what it isn't, and how to read our numbers responsibly.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-600 dark:text-amber-400" />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Disclaimer</h1>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
            Not financial advice
          </h2>
          <p>
            Nothing on SwingSignal is investment advice, a recommendation, or a solicitation to
            buy or sell any asset. We are not a licensed financial advisor, broker, or dealer.
            All content is provided for informational and educational purposes only. Any decision
            you make based on information from this site is yours alone.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
            What our numbers actually are
          </h2>
          <p>
            Our &quot;odds&quot; are statistics computed from historical data: we find past periods
            whose macroeconomic conditions resembled today&apos;s and report how an asset performed
            after them. That is all they are. Past performance does not predict future results —
            markets can and do behave in ways history has never seen.
          </p>
          <p className="mt-2">
            We deliberately publish our accuracy: every asset page includes a backtest showing how
            our historical predictions compared with what actually happened, including the periods
            and assets where our method has <em>no measurable edge</em>. When our numbers are close
            to the base rate, that means the current macro environment tells you little — and we
            show it anyway.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
            Risk warning
          </h2>
          <p>
            Trading and investing involve substantial risk of loss. Cryptocurrencies, leveraged
            products, and derivatives can lose most or all of their value quickly. Never invest
            money you cannot afford to lose, and consider consulting a licensed financial advisor
            before making investment decisions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
            Data accuracy
          </h2>
          <p>
            Market and macroeconomic data is sourced from third parties and may be delayed,
            revised, or occasionally wrong. We make no warranty as to the accuracy, completeness,
            or timeliness of any data shown.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
            Data sources &amp; attribution
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Macroeconomic series are retrieved via the FRED® API of the Federal Reserve Bank of
              St. Louis and via DBnomics. <strong>This product uses the FRED® API but is not
              endorsed or certified by the Federal Reserve Bank of St. Louis.</strong>
            </li>
            <li>
              Cryptocurrency market data comes from the Binance public API; pre-2017 Bitcoin
              history and stablecoin supply from the{" "}
              <a href="https://coinmetrics.io/community-network-data/" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Coin Metrics Community
              </a>{" "}
              dataset (CC BY-NC 4.0).
            </li>
            <li>
              Stock, ETF, forex and commodity prices come from publicly available Yahoo Finance
              endpoints.
            </li>
            <li>
              On-chain Bitcoin metrics from{" "}
              <a href="https://www.blockchain.com/explorer/charts" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Blockchain.com
              </a>{" "}
              and{" "}
              <a href="https://bitcoin-data.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                bitcoin-data.com
              </a>
              ; the Crypto Fear &amp; Greed Index from{" "}
              <a href="https://alternative.me/crypto/fear-and-greed-index/" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                alternative.me
              </a>
              .
            </li>
          </ul>
        </section>
      </div>

      <p className="mt-10 text-center text-xs text-zinc-500">
        See also our <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">Terms of Use</Link> and{" "}
        <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
