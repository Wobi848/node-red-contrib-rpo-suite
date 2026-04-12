var helper = require('node-red-node-test-helper');
var toggleNode = require('../toggle');

helper.init(require.resolve('node-red'));

describe('toggle node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(initialState, persistent) {
        return [
            { id: 'n1', type: 'toggle', name: 'test', initialState: initialState || 'false', persistent: persistent || false, wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should toggle to true on first truthy input', function(done) {
        helper.load(toggleNode, flow('false'), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: 1 });
        });
    });

    it('should toggle back to false on second truthy input', function(done) {
        helper.load(toggleNode, flow('false'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function(msg) {
                count++;
                if (count === 2) {
                    try { msg.payload.should.equal(false); done(); } catch(e) { done(e); }
                }
            });
            n1.receive({ payload: true });
            n1.receive({ payload: true });
        });
    });

    it('should ignore falsy input silently', function(done) {
        helper.load(toggleNode, flow('false'), function() {
            var n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            helper.getNode('n1').receive({ payload: 0 });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should force output with msg.set', function(done) {
        helper.load(toggleNode, flow('false'), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: null, set: true });
        });
    });

    it('should reset to initialState with msg.reset', function(done) {
        helper.load(toggleNode, flow('true'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function(msg) {
                count++;
                if (count === 2) {
                    try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
                }
            });
            n1.receive({ payload: true }); // toggles to false
            n1.receive({ payload: null, reset: true }); // resets to true
        });
    });

    it('should start with initialState = true', function(done) {
        helper.load(toggleNode, flow('true'), function() {
            var n1 = helper.getNode('n1');
            n1.state.should.equal(true);
            done();
        });
    });

    it('should increment toggleCount', function(done) {
        helper.load(toggleNode, flow('false'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function(msg) {
                count++;
                if (count === 3) {
                    try { msg.toggle.toggleCount.should.equal(3); done(); } catch(e) { done(e); }
                }
            });
            n1.receive({ payload: true });
            n1.receive({ payload: true });
            n1.receive({ payload: true });
        });
    });
});
