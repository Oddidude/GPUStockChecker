const puppeter = require("puppeteer");
const open = require("open");
const psl = require("psl");

const config = require("./config/config.json");
const trackedSites = require(config.websites.tracked_sites);
const sitesJson = require(config.websites.website_file);

const debug = config.debug;

// Converts JSON to array of objects for map function
let getUrls = () => {
  // Main website data
  let urls = [];

  for (let val of sitesJson["websites"]) {
    // Regex for parsing domain name
    const httpsPrefix = /^(https:\/\/)/;
    const httpPrefix = /^(http:\/\/)/;
    let url, domain_name;

    if (debug)
      console.log("Processing URL " + val + "...");

    // Formatting link depending on if it contains the http/https prefix
    if (httpsPrefix.test(val)) {
      domain_name = val.substring(8);
      url = val;
    } else if (httpPrefix.test(val)) {
      domain_name = val.substring(7);
      url = val;
    } else {
      domain_name = val;
      url = "https://" + val;
    }

    // Trimming domain name
    let endOfDomain = domain_name.indexOf("/");
    if (endOfDomain != -1)
      domain_name = domain_name.substring(0, endOfDomain);

    // Get domain name from url to check against tracked sites
    let domain = psl.get(domain_name);
    if (debug)
      console.log("Got " + domain + " from " + domain_name);

    // Check if domain name found in tracked sites
    if (trackedSites.hasOwnProperty(domain)) {
      urls.push({ 
        "url" : url,
        "element" : trackedSites[domain]
      });
    } else {
      if (debug)
        console.log("URL " + domain_name + " not found in list of tracked URLs");
    }
  };

  return urls;
};

// Try and find the available button on the webpage and return true if clickable
let checkPage = async (browser, url, element) => {
  // Page refresh timeout
  let lastOpened = 0;

  // Open a new tab and load the URL
  const page = await browser.newPage();
  if (debug)
    console.log("Initialising page " + url + "...");

  // Stop loading images, css and scripts
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.resourceType() == "stylesheet" || req.resourceType() == "font" || req.resourceType() == "image" || req.resourceType() == "script") {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, config.page_load_options);
  
  while (true) {
    try {
      let check = await page.evaluate((element) => {
        // Check if availability element is present on screen
        let el = document.querySelector(element); 
        return (el != null);
      }, element);

      if (debug)
        console.log("Trying to find element \"" + element + "\"..." + (check ? "Success" : "Failed"));

      // If buy button is available
      if (check) {
        let currentTime = new Date().getTime();
        // Check page was last opened MORE than 30 seconds ago
        if (currentTime - lastOpened > config.page_timeout) {
          open(url);
          // Update most recent page open time
          lastOpened = currentTime;

          console.log("Found one! " + url);
        } else {
          if (debug) {
            console.log(url + " last opened: " + (currentTime - lastOpened) + "ms ago");
          }
        }
      }
    } catch(err) {
      console.log(err);
    } finally {

      if (debug)
        console.log("Reloading page " + url + "...");

      // Reload the page and pray again
      await page.reload(config.page_load_options);
    }
  }

  // Shouldn't get here
  page.close();
  return Promise.resolve(url);
};

// Main
(async () => {
  console.log("Starting Stock Checker...");

  // Convert website JSON list to array
  let sites = getUrls();

  // Check that there is at least one array to work with
  if (sites === undefined || sites.length === 0) {
    console.log("Enter at least one valid website address");
    return;
  }

  // Set browser options according to config file
  launch_options = config.browser_load_options;

  // Create browser instance
  const browser = await puppeter.launch(launch_options);

  console.log("Searching...");

  // Start all the page checks
  await Promise.all(sites.map(x => {
    return checkPage(browser, x.url, x.element);
  }));

  // Shouldn't get here
  await browser.close();
})();