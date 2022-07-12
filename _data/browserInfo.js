const { AssetCache } = require('@11ty/eleventy-fetch');
const { browsers } = require('../_data/config');
const fetch = require('node-fetch');

async function getBrowserData(browser) {
  const response = await fetch(
    `https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/${browser}.json`,
    {}
  );
  const { type, name, releases } = (await response.json()).browsers[browser];
  const { current, previous, next } = Object.entries(releases).reduce(
    (acc, [key, value]) => {
      // set up new object to get the version number in there
      // because it's the key 🤦‍♂️
      const current = { version: key, ...value };

      if (current.status === 'current') {
        acc.current = current;
        return acc;
      }

      if (!acc.current) {
        acc.previous.push(current);
      } else {
        acc.next.push(current);
      }

      return acc;
    },
    { previous: [], next: [] }
  );

  return {
    name,
    key: browser,
    type,
    current,
    previous,
    next,
  };
}

module.exports = async function browserInfo() {
  let browserData = new AssetCache('browser_info');

  if (browserData.isCacheValid('1d')) {
    return browserData.getCachedValue();
  }

  const browserInfo = await Promise.all(
    browsers.map((browser) => getBrowserData(browser))
  );

  await browserData.save(browserInfo, 'json');

  return browserInfo;
};
