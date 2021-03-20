const puppeter = require("puppeteer");
const open = require("open");
const psl = require("psl");
const fs = require("fs");
const path = require("path");

const config = require("./config/config.json");

// Grabbing some values from config file
const tracked_sites_json = config.tracked_sites_json;
const websites_json = config.websites_json;
const debug = config.debug;

// Gathers all the necessary data inside the directory set in config.websites
let gatherResources = (currentDir, trackedSites={}, sitesList=[]) => {
  let files = fs.readdirSync(currentDir);

  // Go through each file in the current directory
  files.forEach((file) => {
    // Assemble directory/file path
    let filePath = currentDir + "/" + file;
    // If path is a directory then recurse, otherwise search for useful data
    if (fs.statSync(filePath).isDirectory()) {
      [trackedSites, sitesList] = gatherResources(filePath, trackedSites, sitesList);
    } else {
      if (path.extname(file) == ".json") {
        try {
          // Load the JSON in the file
          let json = require("./" + filePath);

          // If the file contains a member siteInfo then add all the data to the current list of tracked sites
          if (tracked_sites_json in json)
            trackedSites = { ...trackedSites, ...json[tracked_sites_json] };

          // If the file contains a member websites then add the websites to the current list of websites
          if (websites_json in json)
            sitesList = sitesList.concat(json[websites_json]);
        } catch (err) {
          // If there's something wrong with the JSON file
          if (debug)
            console.log("Invalid JSON file: " + filePath);
        }
      } else {
        // If the file being checked isn't a JSON file
        if (debug)
          console.log("Invalid website file: " + filePath);
      }
    }
  });

  if (debug) {
    console.log("trackedSites =", trackedSites);
    console.log("sitesList =", sitesList);
  }

  return [trackedSites, sitesList];
};

// Converts JSON to array of objects for map function
let getUrls = (trackedSites, sitesList) => {
  // Main website data
  let urls = [];

  // Regex for parsing domain name
  const httpsPrefix = /^(https:\/\/)/;
  const httpPrefix = /^(http:\/\/)/;

  for (let val of sitesList) {
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
    if (endOfDomain != -1) {
      domain_name = domain_name.substring(0, endOfDomain);

      // Get domain name from url to check against tracked sites
      let domain = psl.get(domain_name);
      if (debug)
        console.log("Got " + domain + " from " + domain_name);

      // Check if domain name found in tracked sites
      if (domain in trackedSites) {
        urls.push({ 
          "url" : url,
          "element" : trackedSites[domain]
        });
      } else {
        if (debug)
          console.log("URL " + domain_name + " not found in list of tracked URLs");
      }
    } else {
      if (debug)
        console.log("Invalid domain: " + domain_name);
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
      console.log("Something went wrong!", err);
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


  let [trackedSites, sitesList] = gatherResources(config.websites);

  // Convert website JSON list to array
  let sites = getUrls(trackedSites, sitesList);

  // Check that there is at least one array to work with
  if (sites === undefined || sites.length === 0) {
    console.log("Enter at least one valid website address");
    return;
  }

  // Set browser options according to config file
  let launch_options = {};
  if (debug) {
    launch_options = config.browser_load_options;
  }

  // Create browser instance
  const browser = await puppeter.launch(launch_options);

  console.log("Starting...");

  // Start all the page checks
  await Promise.all(sites.map(x => {
    console.log("Searching " + x.url + "...");
    return checkPage(browser, x.url, x.element);
  }));

  // Shouldn't get here
  await browser.close();
})();