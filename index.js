'use strict';

const instance = require('./dist/instance').default;
const { handler } = require('./dist/index');

module.exports = {
  handler,
  instance,
  ...require('./dist/interface')
};
