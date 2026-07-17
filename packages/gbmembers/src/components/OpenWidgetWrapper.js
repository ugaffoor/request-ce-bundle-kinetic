import { Component } from 'react';

const SCRIPT_ID = 'openwidget-script';
const ORGANIZATION_ID = 'eea25ff5-b29a-4287-b366-823757bb237a';

export class OpenWidgetWrapper extends Component {
  componentDidMount() {
    window.__ow = window.__ow || {};
    window.__ow.organizationId = ORGANIZATION_ID;
    window.__ow.asyncInit = true;

    if (!window.OpenWidget) {
      (function(n, t, c) {
        function i(n) {
          return e._h ? e._h.apply(null, n) : e._q.push(n);
        }
        var e = {
          _q: [],
          _h: null,
          _v: '2.0',
          on: function() {
            i(['on', c.call(arguments)]);
          },
          once: function() {
            i(['once', c.call(arguments)]);
          },
          off: function() {
            i(['off', c.call(arguments)]);
          },
          get: function() {
            if (!e._h)
              throw new Error(
                "[OpenWidget] Can't use getters before widget is loaded.",
              );
            return i(['get', c.call(arguments)]);
          },
          call: function() {
            i(['call', c.call(arguments)]);
          },
          init: function() {
            if (!t.getElementById(SCRIPT_ID)) {
              var s = t.createElement('script');
              s.id = SCRIPT_ID;
              s.async = true;
              s.type = 'text/javascript';
              s.src = 'https://cdn.openwidget.com/openwidget.js';
              t.head.appendChild(s);
            }
          },
        };
        e.init();
        n.OpenWidget = e;
      })(window, document, Array.prototype.slice);
    } else if (!document.getElementById(SCRIPT_ID)) {
      var s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.async = true;
      s.type = 'text/javascript';
      s.src = 'https://cdn.openwidget.com/openwidget.js';
      document.head.appendChild(s);
    }
  }

  componentWillUnmount() {
    if (window.OpenWidget) {
      try {
        window.OpenWidget.call('hide');
      } catch (e) {}
    }
  }

  render() {
    return null;
  }
}
