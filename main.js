const puppeter = require("puppeteer");
const open = require("open");

const sitesJson = require("./websites.json");

// Converts JSON to array of objects for map function
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

// Try and find the available button on the webpage and return true if clickable
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

  if (check)
    return Promise.resolve(url);
  else
    return Promise.reject("Oos");
};

//Main
(async () => {

  const sites = jsonToArray(sitesJson);

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
      if (site.status == "fulfilled")
        open(site.value);
    });
  });

  // Close browser
  await browser.close();
  console.log("SUCCESS!");
})();