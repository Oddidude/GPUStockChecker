const puppeter = require("puppeteer");
const open = require("open");

let sitesJson = {
  "https://www.google.com"  : ".lnXdpd",
  "https://www.google.com/"  : "no",
  //"https://www.google.com"  : "don\'t open",
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

  if (check) {
    return Promise.resolve(url);
  } else {
    return Promise.reject("Oos");
  }
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

  await Promise.allSettled(sites.map(x => {
    return checkPage(browser, x.url, x.element);
  })).then((promises) => {
    console.log(promises);
    promises.forEach((site) => {
      if (site.value != null)
        open(site.value);
    });
  });

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();