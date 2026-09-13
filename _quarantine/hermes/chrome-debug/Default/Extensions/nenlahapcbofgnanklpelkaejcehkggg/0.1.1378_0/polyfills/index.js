import './localStorage.js';

self.window = self;

// devicePixelRatio/screen are populated by pageView, but need to be undefined during a fresh install
self.window.devicePixelRatio = undefined;
self.window.screen = {
  availWidth: undefined,
  availHeight: undefined,
  width: undefined,
  height: undefined,
};
