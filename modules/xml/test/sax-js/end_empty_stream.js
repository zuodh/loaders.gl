var tap = require('tap')
var saxStream = require('@loaders.gl/xml/sax-js/sax').createStream()
tap.doesNotThrow(function () {
  saxStream.end()
})
