# GPU Stock Checker

A basic website scraper used to notify you when a product comes in stock. It's capable of checking multiple URLs simultaneously and opens a new window directly to a product when it comes in stock

## Dependencies
Requires NodeJS and npm

Also needs any basic text editor if you want to edit the URLs

## Installation
Download the project
> git clone https://</span>github.com/Oddidude/GPUStockChecker.git

Move into the project directory
> cd GPUStockChecker

Install the project dependencies
> npm install

Run the project
> npm start

## Configuration
I've tried to make it as straightforward and easily customised as possible
### Setting up product links to be checked
In the `config/websites/` directory you can add or remove links in the JSON file to change what URLs are checked. You can disable URLs but either removing them from the list completely or moving them into another object that ISN'T the `websites` object.
### Adding more domain names
In the `config/` directory there is a JSON containing the distributor sites that are compatible with the checker. These work by matching the domain name of a product with one of the domains in `tracked_files.json` so that the checker knows what HTML element to look for in the page.
### Config file
There are some parameters in this file that let you choose which websites and tracked sites files to check so you can make multiple versions of these files and just select the ones you want to use. 
The rest of the config file just configures Puppeteer and the loading of web pages.
