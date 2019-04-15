const {getGatsbyConfig} = require('ocular-gatsby/api');

const rawConfig = require('./ocular-config');

const completeConfig = getGatsbyConfig(rawConfig);

console.error(JSON.stringify(completeConfig, null, 2));

module.exports = completeConfig;
