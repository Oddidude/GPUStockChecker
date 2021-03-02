const puppeter = require("puppeteer");
const open = require("open");

const config = require("./config.json");
const sitesJson = require(config.website_file);

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
  if (config.debug) {
    var browser = await puppeter.launch({ 
      headless  : config.headless,
      slowMo    : config.slowMo
    });
  } else {
    var browser = await puppeter.launch();
  }

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