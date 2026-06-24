const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const period1 = date.toISOString().split('T')[0];
  console.log("period1:", period1);
  try {
    const historical = await yahooFinance.historical('AAPL', { period1 });
    console.log("Historical Length:", historical.length);
    if(historical.length > 0) {
      console.log("First item close:", historical[0].close);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
