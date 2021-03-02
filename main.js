const puppeter = require("puppeteer");
const open = require("open");

const config = require("./config.json");
const sitesJson = require(config.website_file);

// Converts JSON to array of objects for map function
let jsonToArray = (json) => {
  let arr = [];
  let lastOpened = {};

  for (let key in json) {
    arr.push({ 
      url : key,
      element : json[key]
    });

    lastOpened[key] = 0;
  };

  return [arr, lastOpened];
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

  if (config.debug)
    console.log(element, ":", check)

  page.close();

  if (check)
    return Promise.resolve(url);
  else
    return Promise.reject("Oos");
};

//Main
(async () => {
  // Convert website JSON list to array
  let [sites, lastOpened] = jsonToArray(sitesJson);

  // Create new browser instance
  if (config.debug) {
    var browser = await puppeter.launch({ 
      headless  : config.headless,
      slowMo    : config.slowMo
    });
  } else {
    var browser = await puppeter.launch();
  }

  while (true) {
    await Promise.allSettled(sites.map(x => {
      return checkPage(browser, x.url, x.element);
    })).then((promises) => {
      if (config.debug)
        console.log(promises);

      promises.forEach((site) => {
        if (site.status == "fulfilled") {
          let currentTime = new Date().getTime();
          if (currentTime - lastOpened[site.value] > 30000) {
            open(site.value);
            lastOpened[site.value] = currentTime;
          } else {
            if (config.debug) {
              console.log(site.value, "last opened:", currentTime - lastOpened[site.value], "ms ago");
            }
          }
        }
      });
    });
  };

  // It shouldn't get here
  await browser.close();
  console.log("SUCCESS!");
})();