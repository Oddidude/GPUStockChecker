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
In the `config/websites/` directory you can add or remove links by storing them in JSON files following the format of the example seen in `config/websites/websites.json`.
You can name the files whatever you want to help with sorting as long as they're in the correct directory and are stored in a JSON with a member named `websites`.
JSON members not named `websites` will be ignored allowing for easy URL disabling.
### Adding more domain names
In `config/websites/` you can also set up domain names to be checked and how to check them. These parameters are stored similarly to website URLs in JSON members named `siteInfo` with the format `domain name : HTML element on page to be checked`.
This is a fairly basic approach for scraping the website and makes the process of adding new websites slightly more hands on but it works.
Once again, JSON members not following the `siteInfo` name will be ignored.
### Config file
There are some parameters in this file that let you choose which websites and tracked sites files to check so you can make multiple versions of these files and just select the directory that they are in.
The rest of the config file just configures Puppeteer and the loading of web pages.
