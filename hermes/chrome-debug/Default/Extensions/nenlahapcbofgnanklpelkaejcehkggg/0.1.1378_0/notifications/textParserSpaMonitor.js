// Main-world script: monkey-patches history.pushState / replaceState to
// dispatch a CustomEvent that the content script (isolated world) can listen
// for. Injected via <script src="..."> to bypass CSP restrictions on inline
// scripts.
(function () {
  var E = '__cof_spa_nav';
  var ps = history.pushState;
  var rs = history.replaceState;
  history.pushState = function () {
    var ret = ps.apply(this, arguments);
    window.dispatchEvent(new CustomEvent(E));
    return ret;
  };
  history.replaceState = function () {
    var ret = rs.apply(this, arguments);
    window.dispatchEvent(new CustomEvent(E));
    return ret;
  };
})();
