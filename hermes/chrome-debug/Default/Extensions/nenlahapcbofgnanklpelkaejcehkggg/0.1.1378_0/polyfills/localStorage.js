// Manual import of localStorage npm package
self.localStorage = (function () {
  var db = function LocalStorage() {};

  db.prototype._restoreFromLocalStorage = async function () {
    const data = await chrome.storage.local.get('localStorage');

    if (data.localStorage) {
      Object.keys(data.localStorage).forEach((key) => {
        const value = data.localStorage[key];
        this[key] = value;
      });
    }
  };

  db.prototype.getItem = function (key) {
     
    if (this.hasOwnProperty(key)) {
      return String(this[key]);
    }
    return null;
  };

  db.prototype.setItem = function (key, val) {
    this[key] = String(val);
    chrome.storage.local.set({localStorage: this});
  };

  db.prototype.removeItem = function (key) {
    delete this[key];
    chrome.storage.local.set({localStorage: this});
  };

  db.prototype.clear = function () {
    Object.keys(this).forEach((key) => {
      this[key] = undefined;
      delete this[key];
    });
    chrome.storage.local.set({localStorage: this});
  };

  db.prototype.key = function (i) {
    i = i || 0;
    return Object.keys(this)[i];
  };

  db.prototype.__defineGetter__('length', function () {
    return Object.keys(this).length;
  });

  return new db();
})();
// end Manual import of localStorage npm package
