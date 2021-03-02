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

  for (let val of sitesJson["websites"]) {
    // Regex for parsing domain name
    const httpsPrefix = /^(https:\/\/)/;
    const httpPrefix = /^(http:\/\/)/;
    let url, domain_name;

    if (config.debug)
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
    if (config.debug)
      console.log("Got " + domain + " from " + domain_name);

    // Check if domain name found in tracked sites
    if (trackedSites.hasOwnProperty(domain)) {
      urls.push({ 
        "url" : url,
        "element" : trackedSites[domain]
      });
    } else {
      if (config.debug)
        console.log("URL " + domain_name + " not found in list of tracked URLs");
    }
  };

  if (config.debug)
    console.log("urls: " + urls);
  return urls;
};

// Try and find the available button on the webpage and return true if clickable
let checkPage = async (browser, url, element) => {
  // Page refresh timeout
  let lastOpened = 0;

  // Page load options set in config file
  const load_options = {
    timeout   : config.load_timeout,
    waitUntil : config.waitUntil
  };

  // Open a new tab and load the URL
  const page = await browser.newPage();
  if (config.debug)
    console.log("Initialising page " + url + "...");
  await page.goto(url, load_options);
  
  while (true) {
    let check = await page.evaluate((element) => {
      // Check if availability element is present on screen
      let el = document.querySelector(element); 
      return (el != null);
    }, element);

    if (config.debug)
      console.log("Trying to find element " + element + "..." + (check ? "Success" : "Failed"));

    // If buy button is available
    if (check) {
      let currentTime = new Date().getTime();
      // Check page was last opened MORE than 30 seconds ago
      if (currentTime - lastOpened > config.page_timeout) {
        open(url);
        // Update most recent page open time
        lastOpened = currentTime;
      } else {
        if (config.debug) {
          console.log(site.value + " last opened: " + currentTime - lastOpened[site.value] + "ms ago");
        }
      }
    }

    if (config.debug)
      console.log("Reloading page " + url + "...");

    // Reload the page and pray again
    await page.reload(load_options);
  }

  // Shouldn't get here
  page.close();
  return Promise.resolve(url);
};

// Main
(async () => {
  // Convert website JSON list to array
  let sites = getUrls();

  // Check that there is at least one array to work with
  if (sites === undefined || sites.length === 0) {
    console.log("Enter at least one valid website address");
    return;
  }

  // Set browser options according to config file
  let launch_options = {};
  if (config.debug) {
    launch_options = {
      headless  : config.headless,
      slowMo    : config.slowMo
    };
  }

  // Create browser instance
  const browser = await puppeter.launch(launch_options);

  // Start all the page checks
  await Promise.all(sites.map(x => {
    return checkPage(browser, x.url, x.element);
  }));

  // Shouldn't get here
  await browser.close();
})();