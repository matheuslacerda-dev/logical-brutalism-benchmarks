const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const period1 = date.toISOString().split('T')[0];
  try {
    const result = await yahooFinance.chart('AAPL', { period1, interval: '1d' });
    console.log("Chart Quotes Length:", result.quotes.length);
    if(result.quotes.length > 0) {
      console.log("First quote close:", result.quotes[0].close);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
