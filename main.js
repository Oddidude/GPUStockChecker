const puppeter = require("puppeteer");

/*
  Load desired page

  Opens new tab and waits till page is FULLY loaded before returning
*/
let visitPage = async (browser, url) => {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil : "networkidle0"
  });
  return page;
};

/*
  Main
*/
(async () => {
  // Create new browser instance
  const browser = await puppeter.launch({ 
    headless  : false,
    slowMo    : 0
  });

  const url = "https://www.google.com";

  await visitPage(browser, url);

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();