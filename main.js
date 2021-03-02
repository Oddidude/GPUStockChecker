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
  Visits _____ website and does checks
*/
let firstSite = async (browser) => {
  const url = "https://www.google.com";

  let page = await visitPage(browser, url);
}

/*
  Visits _____ website and does checks
*/
let secondSite = async (browser) => {
  const url = "https://www.bbc.co.uk";

  let page = await visitPage(browser, url);
}

/*
  Main
*/
(async () => {
  // Create new browser instance
  const browser = await puppeter.launch({ 
    headless  : false,
    slowMo    : 0
  });

  await Promise.allSettled([firstSite(browser), secondSite(browser)]);

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();