'use strict'

exports.__esModule = true
exports.getStyledEvents = undefined

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, descriptor.key, descriptor)
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps)
    if (staticProps) defineProperties(Constructor, staticProps)
    return Constructor
  }
})()

var _sortBy = require('lodash/sortBy')

var _sortBy2 = _interopRequireDefault(_sortBy)

var _accessors = require('./accessors')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

function _objectWithoutProperties(obj, keys) {
  var target = {}
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue
    target[i] = obj[i]
  }
  return target
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

var Event = (function() {
  function Event(data, _ref) {
    var startAccessor = _ref.startAccessor,
      endAccessor = _ref.endAccessor,
      slotMetrics = _ref.slotMetrics

    _classCallCheck(this, Event)

    var _slotMetrics$getRange = slotMetrics.getRange(
        (0, _accessors.accessor)(data, startAccessor),
        (0, _accessors.accessor)(data, endAccessor)
      ),
      start = _slotMetrics$getRange.start,
      startDate = _slotMetrics$getRange.startDate,
      end = _slotMetrics$getRange.end,
      endDate = _slotMetrics$getRange.endDate,
      top = _slotMetrics$getRange.top,
      height = _slotMetrics$getRange.height

    this.start = start
    this.end = end
    this.startMs = +startDate
    this.endMs = +endDate
    this.top = top
    this.height = height
    this.data = data
  }

  /**
   * The event's width without any overlap.
   */

  _createClass(Event, [
    {
      key: '_width',
      get: function get() {
        // The container event's width is determined by the maximum number of
        // events in any of its rows.

        if (this.data.eventType === 'Availability') {
          return 0
        }

        return 100 / (1 + (this.data.preOver || 0) + (this.data.postOver || 0))
      },

      /**
       * The event's calculated width, possibly with extra width added for
       * overlapping effect.
       */
    },
    {
      key: 'width',
      get: function get() {
        return this._width
      },
    },
    {
      key: 'xOffset',
      get: function get() {
        return this._width * this.data.preOver
      },
    },
  ])

  return Event
})()

/**
 * Return true if event a and b is considered to be on the same row.
 */

function onSameRow(a, b) {
  return (
    // Occupies the same start slot.
    Math.abs(b.start - a.start) <= 30 ||
    // A's start slot overlaps with b's end slot.
    (a.start > b.start && a.start < b.end)
  )
}

function sortByRender(events) {
  var sortedByTime = (0, _sortBy2.default)(events, [
    'startMs',
    function(e) {
      return -e.endMs
    },
  ])

  var sorted = []
  while (sortedByTime.length > 0) {
    var event = sortedByTime.shift()
    sorted.push(event)

    for (var i = 0; i < sortedByTime.length; i++) {
      var test = sortedByTime[i]

      // Still inside this event, look for next.
      if (event.endMs > test.startMs) continue

      // We've found the first event of the next event group.
      // If that event is not right next to our current event, we have to
      // move it here.
      if (i > 0) {
        var _event = sortedByTime.splice(i, 1)[0]
        sorted.push(_event)
      }

      // We've already found the next event group, so stop looking.
      break
    }
  }

  return sorted
}

function getStyledEvents(_ref2) {
  var events = _ref2.events,
    props = _objectWithoutProperties(_ref2, ['events'])

  let i = 0

  let proxies = []

  while (i < events.length) {
    events[i].preOver = 0
    events[i].postOver = 0
    i++
  }

  i = 0

  while (i < events.length) {
    let curEvent = events[i]
    let v = i + 1

    while (v < events.length) {
      let checkEvent = events[v]
      if (
        checkEvent.eventType === 'Appointment' &&
        (checkEvent.start < curEvent.end || checkEvent.start === curEvent.start)
      ) {
        checkEvent.preOver = (checkEvent.preOver || 0) + 1
        curEvent.postOver = (curEvent.postOver || 0) + 1
      } else {
        checkEvent.preOver = checkEvent.preOver || 0
        curEvent.postOver = curEvent.postOver || 0
        break
      }
      v++
    }
    proxies.push(new Event(curEvent, props))
    i++
  }

  var eventsInRenderOrder = sortByRender(proxies)

  // Group overlapping events, while keeping order.
  // Every event is always one of: container, row or leaf.
  // Containers can contain rows, and rows can contain leaves.
  var containerEvents = []

  var _loop = function _loop(i) {
    var event = eventsInRenderOrder[i]

    //preoverlaps
    // iterate through all the events and find events with a start time before the event starts
    // and an end time after the event starts
    //postoverlaps
    // iterate through all the events and find events with a start time before the event ends
    // and an end time after the event starts

    // Check if this event can go into a container event.
    var container = containerEvents.find(function(c) {
      return c.end > event.start || Math.abs(event.start - c.start) < 30
    })

    // Couldn't find a container — that means this event is a container.

    containerEvents.push(event)
    return 'continue'
  }

  // Return the original events, along with their styles.
  return proxies.map(function(event) {
    return {
      event: event.data,
      style: {
        top: event.top,
        height: event.height,
        width: event.width,
        xOffset: event.xOffset,
      },
    }
  })
}

exports.getStyledEvents = getStyledEvents
