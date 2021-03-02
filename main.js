const puppeter = require("puppeteer");

let sitesJson = {
  "https://www.google.com"  : ".lnXdpd",
  "https://www.bbc.co.uk"   : ".e9p57e2"
};

let jsonToArray = (json) => {
  let arr = [];

  for (let key in json) {
    arr.push({ 
      url : key,
      element : json[key]
    });
  };

  return arr;
};

let checkPage = async (browser, url, element) => {
  const page = await browser.newPage();
  await page.goto(url, { 
    waitUntil: 'networkidle0'
  });
  
  let check = await page.evaluate((element) => { 
    let el = document.querySelector(element); 
    return (el != null);
  }, element);

  console.log(element, ":", check)

  return Promise.resolve(check);
};

/*
  Main
*/
(async () => {
  let sites = jsonToArray(sitesJson);

  // Create new browser instance
  const browser = await puppeter.launch({ 
    headless  : true,
    slowMo    : 0
  });

  let promises = await Promise.allSettled(sites.map(x => {
    return checkPage(browser, x.url, x.element);
  }));

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();