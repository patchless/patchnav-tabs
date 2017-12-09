var Tabs = require('hypertabs')
var h = require('hyperscript')
var open = require('open-external')
var isElectron = require('is-electron')
var HyperScroll = require('hyperscroll')
var fs = require('fs')
var path = require('path')

function ancestorAnchor (el) {
  if(!el) return
  if(el.tagName !== 'A') return ancestorAnchor(el.parentElement)
  return el
}

exports.needs = {
  app: {
    view: 'first',
    menu: 'map'
  }
}

exports.gives = {
  nav: {
    screen: true, goto: true
  }
}

exports.create = function (api) {
  var tabs = Tabs(setSelected)

  function setSelected (indexes) {
    var ids = indexes.map(function (index) {
      return tabs.get(index).content.id
    })
  }

  function openTab (path) {

      if(tabs.has(path))
        return tabs.select(path)

      var el = api.app.view(path)
      if(el) {
        var _el = HyperScroll(el)
        _el.id = el.id || path
        tabs.add(_el)
      }

  }

  return {
    nav: {
      screen: function () {
        var saved = api.app.menu()

        saved.forEach(function (path) {
          var el = api.app.view(path)
          if(!el) return
          var _el = HyperScroll(el)
          _el.id = el.id || path
          if(el) tabs.add(_el, false, false)
        })
        tabs.select(0)

        //handle link clicks
        window.onclick = function (ev) {
          var link = ancestorAnchor(ev.target)
          if(!link) return
          var path = link.getAttribute('href')

          ev.preventDefault()
          ev.stopPropagation()

          //let the application handle this link
          if (path === '#') return

          //open external links.
          //this ought to be made into something more runcible
          if(link.href && open.isExternal(link.href)) return open(link.href)


          openTab(path)
        }

        if (isElectron()) {
          var _require = require
          var electron = _require('electron')
          window.addEventListener('mousewheel', ev => {
            if (ev.ctrlKey) {
              const direction = (ev.deltaY / Math.abs(ev.deltaY))
              electron.webFrame.setZoomLevel(electron.webFrame.getZoomLevel() - direction)
            }
          })
        }

        tabs.appendChild(
          h('style', {innerText: fs.readFileSync(path.join(__dirname, 'style.css'))})
        )

        return tabs
      },
      goto: function (href) {
        openTab(href)
      }
    }
  }
}


