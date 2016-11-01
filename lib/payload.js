
(function() {
  var Payload, serial,
    hasProp = {}.hasOwnProperty;

  serial = 0;

  Payload = (function() {
    Payload.prototype.locale_format = /^[a-z]{2}_[A-Z]{2}$/;

    function Payload(data) {
      var i, key, len, prefix, ref, ref1, subkey, sum, type, value;
      if (typeof data !== 'object') {
        throw new Error('Invalid payload');
      }
      this.id = serial++;
      this.compiled = false;
      this.title = {};
      this.msg = {};
      this.data = {};
      this["var"] = {};
      this.incrementBadge = true;
      for (key in data) {
        if (!hasProp.call(data, key)) continue;
        value = data[key];
        if (typeof key !== 'string' || key.length === 0) {
          throw new Error("Invalid field (empty)");
        }
        if (typeof value !== 'string') {
          throw new Error("Invalid value for `" + key + "'");
        }
        switch (key) {
          case 'title':
            this.title["default"] = value;
            break;
          case 'msg':
            this.msg["default"] = value;
            break;
          case 'sound':
            this.sound = value;
            break;
          case 'incrementBadge':
            this.incrementBadge = value !== 'false';
            break;
          case 'badge':
            this.badge = value;
            break;
          case 'category':
            this.category = value;
            break;
          case 'contentAvailable':
            this.contentAvailable = value !== 'false';
            break;
          default:
            if ((ref = key.split('.', 2), prefix = ref[0], subkey = ref[1], ref).length === 2) {
              this[prefix][subkey] = value;
            } else {
              throw new Error("Invalid field: " + key);
            }
        }
      }
      sum = 0;
      ref1 = ['title', 'msg', 'data'];
      for (i = 0, len = ref1.length; i < len; i++) {
        type = ref1[i];
        sum += ((function() {
          var ref2, results;
          ref2 = this[type];
          results = [];
          for (key in ref2) {
            if (!hasProp.call(ref2, key)) continue;
            results.push(key);
          }
          return results;
        }).call(this)).length;
      }
      if (sum === 0) {
        throw new Error('Empty payload');
      }
    }

    Payload.prototype.localizedTitle = function(lang) {
      return this.localized('title', lang);
    };

    Payload.prototype.localizedMessage = function(lang) {
      return this.localized('msg', lang);
    };

    Payload.prototype.localized = function(type, lang) {
      if (!this.compiled) {
        this.compile();
      }
      if (this[type][lang] != null) {
        return this[type][lang];
      } else if (Payload.prototype.locale_format.test(lang) && (this[type][lang.slice(0, 2)] != null)) {
        return this[type][lang.slice(0, 2)];
      } else if (this[type]["default"]) {
        return this[type]["default"];
      }
    };

    Payload.prototype.compile = function() {
      var i, lang, len, msg, ref, ref1, type;
      ref = ['title', 'msg'];
      for (i = 0, len = ref.length; i < len; i++) {
        type = ref[i];
        ref1 = this[type];
        for (lang in ref1) {
          if (!hasProp.call(ref1, lang)) continue;
          msg = ref1[lang];
          this[type][lang] = this.compileTemplate(msg);
        }
      }
      return this.compiled = true;
    };

    Payload.prototype.compileTemplate = function(tmpl) {
      return tmpl.replace(/\$\{(.*?)\}/g, (function(_this) {
        return function(match, keyPath) {
          return _this.variable(keyPath);
        };
      })(this));
    };

    Payload.prototype.variable = function(keyPath) {
      var key, prefix, ref, ref1, ref2;
      if (keyPath === 'event.name') {
        if ((ref = this.event) != null ? ref.name : void 0) {
          return (ref1 = this.event) != null ? ref1.name : void 0;
        } else {
          throw new Error("The ${" + keyPath + "} does not exist");
        }
      }
      ref2 = keyPath.split('.', 2), prefix = ref2[0], key = ref2[1];
      if (prefix !== 'var' && prefix !== 'data') {
        throw new Error("Invalid variable type for ${" + keyPath + "}");
      }
      if (this[prefix][key] == null) {
        throw new Error("The ${" + keyPath + "} does not exist");
      }
      return this[prefix][key];
    };

    return Payload;

  })();

  exports.Payload = Payload;

}).call(this);
