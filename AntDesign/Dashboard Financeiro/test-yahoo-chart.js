const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const chart = await yahooFinance.chart('AAPL', { period1: '2023-01-01' });
    console.log("CHART KEYS:", Object.keys(chart));
    if (chart.quotes) {
      console.log("QUOTES LENGTH:", chart.quotes.length);
      if (chart.quotes.length > 0) {
        console.log("SAMPLE QUOTE:", chart.quotes[0]);
      }
    }
  } catch (e) {
    console.error("CHART ERROR:", e.message);
  }
}
test();
