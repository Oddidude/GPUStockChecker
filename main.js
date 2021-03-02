const puppeter = require("puppeteer");
const open = require("open");
const psl = require("psl");

const config = require("./config/config.json");
const trackedSites = require(config.tracked_sites);
const sitesJson = require(config.website_file);

// Converts JSON to array of objects for map function
let getUrls = () => {
  // Main website data
  let urls = [];
  // Keeps track of last time each link was opened
  let lastOpened = {};

  for (let val of sitesJson["websites"]) {
    // URL used for finding webpage
    const httpsPrefix = /^(https:\/\/)/;
    const httpPrefix = /^(http:\/\/)/;
    let fullUrl, url;

    if (config.debug)
      console.log("Processing URL", val, "...");

    // Adjust link depending on it it contains the http/https prefix
    if (httpsPrefix.test(val)) {
      url = val.substring(8);
      fullUrl = val;
    } else if (httpPrefix.test(val)) {
      url = val.substring(7);
      fullUrl = val;
    } else {
      url = val;
      fullUrl = "https://" + val;
    }

    let endOfDomain = url.indexOf("/");
    if (endOfDomain != -1)
      url = url.substring(0, endOfDomain);


    // Get domain name from url to check against tracked sites
    let domain = psl.get(url);
    if (config.debug)
      console.log("Got ", domain, "from", url);

    // Check if domain name found in tracked sites
    if (trackedSites.hasOwnProperty(domain)) {
      urls.push({ 
        "url" : fullUrl,
        "element" : trackedSites[domain]
      });

      lastOpened[fullUrl] = 0;
    } else {
      if (config.debug)
        console.log("URL", url, "not found in list of tracked URLs");
    }
  };

  if (config.debug) {
    console.log("urls:",urls);
    console.log("lastOpened:", lastOpened);
  }
  return [urls, lastOpened];
};

// Try and find the available button on the webpage and return true if clickable
let checkPage = async (browser, url, element) => {
  const page = await browser.newPage();
  if (config.debug)
    console.log("Loading page", url);
  await page.goto(url, { 
    waitUntil: 'networkidle0'
  });
  
  let check = await page.evaluate((element) => {
    // Check if availability element is present on screen
    let el = document.querySelector(element); 
    return (el != null);
  }, element);

  if (config.debug)
    console.log("Trying to find element", element, "...", (check ? "Success" : "Failed"));

  page.close();

  if (check)
    return Promise.resolve(url);
  else
    return Promise.reject("Out of Stock");
};

//Main
(async () => {
  // Convert website JSON list to array
  let [sites, lastOpened] = getUrls();

  if (sites === undefined || sites.length === 0) {
    console.log("Enter at least one valid website address");
    return;
  }

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
          // Check page was last opened MORE than 30 seconds ago
          if (currentTime - lastOpened[site.value] > config.page_timeout) {
            open(site.value);
            // Refresh time of last time page was opened
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
})();