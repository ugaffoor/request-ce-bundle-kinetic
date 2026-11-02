import React, { Component } from 'react';

const SCRIPT_ID = 'openwidget-script';
const ORGANIZATION_ID = 'eea25ff5-b29a-4287-b366-823757bb237a';
const STORAGE_KEY = 'openwidget_corner';

const CORNERS = [
  { bottom: '20px', right: '20px', top: 'auto', left: 'auto' }, // bottom-right (default)
  { bottom: '20px', left: '20px', top: 'auto', right: 'auto' }, // bottom-left
  { top: '20px', left: '20px', bottom: 'auto', right: 'auto' }, // top-left
  { top: '20px', right: '20px', bottom: 'auto', left: 'auto' }, // top-right
];

const NORTH_AMERICAN_TIMEZONES = new Set([
  // United States
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Adak',
  'America/Honolulu',
  'America/Detroit',
  'America/Boise',
  'America/Juneau',
  'America/Nome',
  'America/Sitka',
  'America/Yakutat',
  'America/Metlakatla',
  'America/Indiana/Indianapolis',
  'America/Indiana/Knox',
  'America/Indiana/Marengo',
  'America/Indiana/Petersburg',
  'America/Indiana/Tell_City',
  'America/Indiana/Vevay',
  'America/Indiana/Vincennes',
  'America/Indiana/Winamac',
  'America/Kentucky/Louisville',
  'America/Kentucky/Monticello',
  'America/North_Dakota/Beulah',
  'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem',
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'US/Alaska',
  'US/Hawaii',
  'US/Arizona',
  'US/Michigan',
  'US/Indiana-Starke',
  'US/East-Indiana',
  // Canada
  'America/Toronto',
  'America/Vancouver',
  'America/Winnipeg',
  'America/Halifax',
  'America/Regina',
  'America/Edmonton',
  'America/St_Johns',
  'America/Whitehorse',
  'America/Yellowknife',
  'America/Inuvik',
  'America/Iqaluit',
  'America/Goose_Bay',
  'America/Glace_Bay',
  'America/Moncton',
  'America/Thunder_Bay',
  'America/Rankin_Inlet',
  'America/Resolute',
  'America/Cambridge_Bay',
  'America/Creston',
  'America/Dawson',
  'America/Dawson_Creek',
  'America/Fort_Nelson',
  'America/Swift_Current',
  'Canada/Atlantic',
  'Canada/Central',
  'Canada/Eastern',
  'Canada/Mountain',
  'Canada/Newfoundland',
  'Canada/Pacific',
  'Canada/Saskatchewan',
  'Canada/Yukon',
]);

export const isNorthAmericanUser = () => {
  try {
    return NORTH_AMERICAN_TIMEZONES.has(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  } catch (e) {
    return false;
  }
};

export class OpenWidgetWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cornerIdx: parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10),
      widgetReady: false,
    };
    this.applyCorner = this.applyCorner.bind(this);
    this.cycleCorner = this.cycleCorner.bind(this);
  }

  applyCorner(idx) {
    const corner = CORNERS[idx];
    // OpenWidget injects its container — try common container IDs/selectors
    const container =
      document.getElementById('chat-widget-container') ||
      document.querySelector('[id^="chat-widget"]');
    if (container) {
      Object.assign(container.style, corner);
    }
  }

  cycleCorner() {
    const next = (this.state.cornerIdx + 1) % CORNERS.length;
    localStorage.setItem(STORAGE_KEY, String(next));
    this.setState({ cornerIdx: next }, () => this.applyCorner(next));
  }

  startWidgetObserver() {
    const observer = new MutationObserver(() => {
      const container =
        document.getElementById('chat-widget-container') ||
        document.querySelector('[id^="chat-widget"]');
      if (container) {
        observer.disconnect();
        this.applyCorner(this.state.cornerIdx);
        this.setState({ widgetReady: true });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  initWidget() {
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

    this.startWidgetObserver();
  }

  componentDidMount() {
    if (this.props.isAuthorized) {
      this.initWidget();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isAuthorized && this.props.isAuthorized) {
      this.initWidget();
    }
  }

  render() {
    if (!this.state.widgetReady) return null;

    const btnStyle = {
      position: 'fixed',
      zIndex: 99999,
      cursor: 'pointer',
      background: 'rgba(0,0,0,0.35)',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      fontSize: '11px',
      lineHeight: '18px',
      textAlign: 'center',
      padding: 0,
      bottom: '90px',
      right: '10px',
    };

    return (
      <button
        style={btnStyle}
        title="Move chat widget"
        onClick={this.cycleCorner}
      >
        ↕
      </button>
    );
  }
}
