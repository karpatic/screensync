/* Small DOM/Canvas shims. ES5 on purpose: this runs before either application. */
(function (w, d) {
  'use strict';
  var modern = false;
  try { modern = 'noModule' in d.createElement('script') && new Function('return ({a:1})?.a === 1')(); } catch (ignored) {}
  var legacy = !!w.screenSyncForceLegacy || !modern || typeof d.getElementById('setup').showModal !== 'function' || /(?:\?|&)legacy=1(?:&|$)/.test(w.location.search);
  w.screenSyncLegacy = legacy;
  if (legacy) d.documentElement.className += ' legacy';
  if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector;
  if (!Element.prototype.replaceChildren) Element.prototype.replaceChildren = function () {
    while (this.firstChild) this.removeChild(this.firstChild);
    for (var i = 0; i < arguments.length; i++) this.appendChild(typeof arguments[i] === 'string' ? d.createTextNode(arguments[i]) : arguments[i]);
  };
  if (!Element.prototype.append) Element.prototype.append = function () {
    for (var i = 0; i < arguments.length; i++) this.appendChild(typeof arguments[i] === 'string' ? d.createTextNode(arguments[i]) : arguments[i]);
  };
  if (w.CanvasRenderingContext2D && !w.CanvasRenderingContext2D.prototype.ellipse) {
    w.CanvasRenderingContext2D.prototype.ellipse = function (x,y,rx,ry,rotation,start,end,anticlockwise) {
      this.save();this.translate(x,y);this.rotate(rotation);this.scale(rx,ry);this.arc(0,0,1,start,end,anticlockwise);this.restore();
    };
  }
  var dialog = d.getElementById('setup');
  if (dialog && (legacy || !dialog.showModal)) {
    dialog.className += ' legacy-dialog';
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    dialog.showModal = function () {
      this.setAttribute('open','');d.documentElement.classList.add('setup-open');
      var focus = this.querySelector('button[aria-label="Close setup"]');if(focus)focus.focus();
    };
    dialog.close = function () {this.removeAttribute('open');d.documentElement.classList.remove('setup-open');};
    // Unknown dialog elements have no native open property in Safari 9.
    if (!('open' in dialog)) Object.defineProperty(dialog,'open',{get:function(){return this.hasAttribute('open');}});
    dialog.querySelector('.dialog-heading').onsubmit = function(event){event.preventDefault();dialog.close();};
  }
}(window, document));
