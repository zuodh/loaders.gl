import * as sax from './constants';

var Stream
try {
  Stream = require('stream').Stream
} catch (ex) {
  Stream = function () {}
}

var streamWraps = sax.EVENTS.filter(function (ev) {
  return ev !== 'error' && ev !== 'end'
})

export default function SAXStream (strict, opt) {
  if (!(this instanceof SAXStream)) {
    return new SAXStream(strict, opt)
  }

  Stream.apply(this)

  this._parser = new SAXParser(strict, opt)
  this.writable = true
  this.readable = true

  var me = this

  this._parser.onend = function () {
    me.emit('end')
  }

  this._parser.onerror = function (er) {
    me.emit('error', er)

    // if didn't throw, then means error was handled.
    // go ahead and clear error, so we can write again.
    me._parser.error = null
  }

  this._decoder = null

  streamWraps.forEach(function (ev) {
    Object.defineProperty(me, 'on' + ev, {
      get: function () {
        return me._parser['on' + ev]
      },
      set: function (h) {
        if (!h) {
          me.removeAllListeners(ev)
          me._parser['on' + ev] = h
          return h
        }
        me.on(ev, h)
      },
      enumerable: true,
      configurable: false
    })
  })
}

SAXStream.prototype = Object.create(Stream.prototype, {
  constructor: {
    value: SAXStream
  }
})

SAXStream.prototype.write = function (data) {
  if (typeof Buffer === 'function' &&
    typeof Buffer.isBuffer === 'function' &&
    Buffer.isBuffer(data)) {
    if (!this._decoder) {
      var SD = require('string_decoder').StringDecoder
      this._decoder = new SD('utf8')
    }
    data = this._decoder.write(data)
  }

  this._parser.write(data.toString())
  this.emit('data', data)
  return true
}

SAXStream.prototype.end = function (chunk) {
  if (chunk && chunk.length) {
    this.write(chunk)
  }
  this._parser.end()
  return true
}

SAXStream.prototype.on = function (ev, handler) {
  var me = this
  if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
    me._parser['on' + ev] = function () {
      var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
      args.splice(0, 0, ev)
      me.emit.apply(me, args)
    }
  }

  return Stream.prototype.on.call(me, ev, handler)
}
