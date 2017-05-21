/**
 * Created by shuis on 2017/5/12.
 */
var _ = require('underscore');
var List = require('term-list-scrollable');

var defaults = {};
defaults.marker = '\033[36m› \033[0m'; // ♪
defaults.markerLength = 2;
defaults.labelMaxLength = 13;
defaults.labelKey = 'name';
defaults.viewportLength = 16;

module.exports = TermList;

function TermList(params) {
  this.configs = _.extend(defaults, _.clone(params));
  this.menu = new List(this.configs);
  this.items = [];
  this._header = '';
  this._footer = '';
}

TermList.prototype.add = function(item, index) {

  if (!item) return false;
  if (!this.menu) return false;

  var lastest = index || this.items.length;
  if (_.isObject(item)) item.index = lastest;

  var labelKey = this.configs.labelKey;
  var label = _.isString(item) ? item : item[labelKey];
  this.menu.add(lastest, label);
  this.items.push(item);

  return this;

}

TermList.prototype.adds = function(items) {
  if (!items) return false;
  if (items.length === 0) return false;
  var self = this;
  items.forEach(function(item, index) {
    self.add(item, index);
  });
  return this;
}

TermList.prototype.update = function(index, text, align) {

  var original;

  function newLabel(original, text, align) {
    var str = text ? ' ' + text : '';
    var label =
      align ?
        this.align(original, this.configs.labelMaxLength) + str :
        original + str;
    return label;
  }

  if (index === 'header') {
    //original = this._header;
    this.menu.header(text);
  } else if (index === 'footer') {
    //original = this._footer;
    this.menu.footer(text);
  } else {
    var item = this.items[index];
    var label = this.configs.labelKey;
    var line = this.menu.at(index);

    if (!item) return false;
    if (!line) return false;

    original = (typeof(item) === 'string') ? item : item[label];
    line.label = text;//newLabel(original, text, align);
  }

  this.menu.draw();
  return false;

}

TermList.prototype.header = function(label) {
  if (label === '' || label) this._header = label;
  return this.menu.header(label);
}

TermList.prototype.footer = function(label) {
  if (label === '' || label) this._footer = label;
  return this.menu.footer(label);
}

TermList.prototype.align = function(str, maxlength) {

  if (!str) return false;
  if (str.length >= maxlength) return str;

  str += fill(maxlength - str.length, ' ');
  return s;

  function fill(length, blank) {
    var aligned = blank;
    for (var i = length - 1; i >= 0; i--) {
      aligned += blank;
    };
    return aligned;
  }

}

TermList.prototype.count = function () {
  if (!this.items || this.items.length === 0) return 0;
  var count = this.items.filter(function(item) {
    return item != null;
  });
  return count.length;
}

TermList.prototype.item = function(key, value) {
  if (key && value) this.items[key] = value;
  return this.items[key];
}

TermList.prototype.on = function(event, callback) {
  this.menu.on(event, callback);
  return this;
}

TermList.prototype.start = function(by) {
  this.menu.start();
  if (by) this.menu.select(by);
  return this;
}

TermList.prototype.append = function(item) {
  if (!this.menu) return false;
  this.add(item);
  this.menu.draw();
}

TermList.prototype.stop = function() {
  if (this.menu) this.menu.stop();
  return false;
}

TermList.prototype.clear = function(index) {
  return this.update(index);
}

TermList.prototype.remove = function(index) {
  if (!this.menu) return false;
  delete this.items[index];
  return this.menu.remove(index);
}

TermList.prototype.exit = function() {
  this.menu.stop();
  return process.exit();
}

module.exports = TermList;