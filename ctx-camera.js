module.exports = createCamera

function createCamera (ctx, eventContext, handlers, state) {
  eventContext = eventContext || window
  handlers = handlers || {}
  var canBeDirty = typeof ctx.dirty === 'function'

  var limits = {
    zoom: [0.2, 100]
  }

  var mouse = {
    down: false,
    pos: [0, 0],
    deltaPos: [0, 0],
    downPosition: [0, 0]
  }
  
  var frameSize = [
    eventContext.innerWidth,
    eventContext.innerHeight
  ]
  
  state = Object.assign({
    translation: [0, 0],
    zoom: 1
  }, state)

  function begin () {
    ctx.save()
    ctx.scale(state.zoom, state.zoom)
    ctx.translate(state.translation[0], state.translation[1])
  }

  function end () {
    ctx.restore()
    return state
  }

  function translateCamera (x, y) {
    state.translation[0] += x
    state.translation[1] += y
    canBeDirty && ctx.dirty()
  }

  function zoomCamera (amount) {
    state.zoom = Math.max(limits.zoom[0], Math.min(limits.zoom[1], state.zoom + amount))
    canBeDirty && ctx.dirty()
  }

  function zoomToScreenPoint (x, y, amount) {
    var ox = x / state.zoom
    var oy = y / state.zoom

    zoomCamera(amount)

    var nx = x / state.zoom
    var ny = y / state.zoom

    translateCamera(nx - ox, ny - oy)
  }

  var camera = {
    begin: begin,
    end: end,
    translate: translateCamera,
    zoom: zoomCamera,
    mouse: mouse,
    zoomToScreenPoint: zoomToScreenPoint
  }

  function event (el, name, defaultFn) {
    var fn = defaultFn
    if (typeof handlers[name] === 'function') {
      fn = function intercept (e) {
        handlers[name].call(camera, e, defaultFn)
      }
    }

    el.addEventListener(name, fn)
  }

  event(eventContext, 'mousedown', handleMouseDown)
  event(eventContext, 'mouseup', handleMouseUp)
  event(eventContext, 'mousemove', handleMouseMove)
  event(eventContext, 'mousewheel', handleMouseWheel)
  event(eventContext, 'resize', handleResize)

  function handleMouseDown (e) {
    mouse.down = true
    mouse.downPosition = [
      e.clientX,
      e.clientY
    ]
  }

  function handleMouseUp (e) {
    mouse.down = false
  }

  function handleMouseMove (e) {
    mouse.deltaPos[0] = e.clientX - mouse.pos[0]
    mouse.deltaPos[1] = e.clientY - mouse.pos[1]
    if (mouse.down) {
      translateCamera(mouse.deltaPos[0] / state.zoom, mouse.deltaPos[1] / state.zoom)
    }
    mouse.pos[0] = e.clientX
    mouse.pos[1] = e.clientY
  }

  function handleMouseWheel (e) {
    var delta = -e.deltaY / 1000
    zoomToScreenPoint(mouse.pos[0], mouse.pos[1], delta)
    e.preventDefault()
  }

  function handleResize (e) {
    frameSize[0] = eventContext.innerWidth
    frameSize[1] = eventContext.innerHeight
  }

  return camera
}
