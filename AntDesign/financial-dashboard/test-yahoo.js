const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const hist = await yahooFinance.historical('AAPL', { period1: '2023-01-01', interval: '1d' });
    console.log("HISTORICAL LENGTH:", hist.length);
    if (hist.length > 0) {
      console.log("SAMPLE:", hist[0]);
    }
  } catch (e) {
    console.error("HISTORICAL ERROR:", e.message);
  }
}
test();
