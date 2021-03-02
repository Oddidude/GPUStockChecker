const puppeter = require("puppeteer");

/*
  Main
*/
(async () => {
  // Create new browser instance
  const browser = await puppeter.launch({ 
    headless  : false,
    slowMo    : 0
  });

  const page = await browser.newPage();

  await page.goto("https://www.google.com");

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();