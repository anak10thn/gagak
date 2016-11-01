
(function() {
  var Payload, should;

  should = require('should');

  Payload = require('../lib/payload').Payload;

  describe('Payload', function() {
    describe('when empty', (function(_this) {
      return function() {
        return it('should throw an error', function() {
          (function() {
            return new Payload({});
          }).should["throw"]('Empty payload');
          (function() {
            return new Payload({
              'var.test': 'value'
            });
          }).should["throw"]('Empty payload');
          (function() {
            return new Payload({
              sound: 'value'
            });
          }).should["throw"]('Empty payload');
          (function() {
            return new Payload({
              category: 'value'
            });
          }).should["throw"]('Empty payload');
          return (function() {
            return new Payload({
              contentAvailable: 'value'
            });
          }).should["throw"]('Empty payload');
        });
      };
    })(this));
    describe('with invalid key', (function(_this) {
      return function() {
        return it('should throw an error', function() {
          return (function() {
            return new Payload({
              foo: 'bar'
            });
          }).should["throw"]('Invalid field: foo');
        });
      };
    })(this));
    describe('with simple message', (function(_this) {
      return function() {
        var payload;
        payload = new Payload({
          title: 'my title',
          msg: 'my message'
        });
        it('should fallback to default title', function() {
          return payload.localizedTitle('fr').should.equal('my title');
        });
        return it('should fallback to default message', function() {
          return payload.localizedMessage('fr').should.equal('my message');
        });
      };
    })(this));
    describe('localization', (function(_this) {
      return function() {
        var payload;
        payload = new Payload({
          title: 'my title',
          'title.fr': 'mon titre',
          'title.en_GB': 'my british title',
          msg: 'my message',
          'msg.fr': 'mon message',
          'msg.fr_CA': 'mon message canadien'
        });
        it('should fallback to default if no localization requested', function() {
          return payload.localizedTitle().should.equal('my title');
        });
        it('should localize title in french for "fr" localization', function() {
          return payload.localizedTitle('fr').should.equal('mon titre');
        });
        it('should localize message in french for "fr" localization', function() {
          return payload.localizedMessage('fr').should.equal('mon message');
        });
        it('should use language if no locale found', function() {
          return payload.localizedTitle('fr_BE').should.equal('mon titre');
        });
        return it('should use full locale variant if any', function() {
          return payload.localizedMessage('fr_CA').should.equal('mon message canadien');
        });
      };
    })(this));
    return describe('template', (function(_this) {
      return function() {
        it('should throw an error if using an undefined variable', function() {
          var payload;
          payload = new Payload({
            title: 'hello ${var.name}'
          });
          return (function() {
            return payload.compile();
          }).should["throw"]('The ${var.name} does not exist');
        });
        it('should throw an error if using an undefined variable in localized title', function() {
          var payload;
          payload = new Payload({
            'title.fr': 'hello ${var.name}'
          });
          return (function() {
            return payload.compile();
          }).should["throw"]('The ${var.name} does not exist');
        });
        it('should throw an error with invalid variable name', function() {
          var payload;
          payload = new Payload({
            title: 'hello ${name}',
            'var.name': 'world'
          });
          return (function() {
            return payload.compile();
          }).should["throw"]('Invalid variable type for ${name}');
        });
        it('should resolve (var) variable correctly', function() {
          var payload;
          payload = new Payload({
            title: 'hello ${var.name}',
            'var.name': 'world'
          });
          return payload.localizedTitle().should.equal('hello world');
        });
        return it('should resolve (data) variable correctly', function() {
          var payload;
          payload = new Payload({
            title: 'hello ${data.name}',
            'data.name': 'world'
          });
          return payload.localizedTitle().should.equal('hello world');
        });
      };
    })(this));
  });

}).call(this);
