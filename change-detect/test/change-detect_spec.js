var helper = require('node-red-node-test-helper');
var changeDetectNode = require('../change-detect');

helper.init(require.resolve('node-red'));

describe('change-detect node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(tolerance, initialValue) {
        return [
            { id: 'n1', type: 'change-detect', name: 'test', tolerance: tolerance || 0, initialValue: initialValue || '', wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should always forward the first message', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(42); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: 42 });
        });
    });

    it('should block when value has not changed', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: 20 });
            n1.receive({ payload: 20 });
            setTimeout(function() {
                try { count.should.equal(1); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should forward when value changes', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: 20 });
            n1.receive({ payload: 21 });
            setTimeout(function() {
                try { count.should.equal(2); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should respect tolerance for numbers', function(done) {
        helper.load(changeDetectNode, flow(0.5), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: 20.0 });
            n1.receive({ payload: 20.3 }); // within tolerance
            n1.receive({ payload: 20.7 }); // outside tolerance
            setTimeout(function() {
                try { count.should.equal(2); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should detect boolean changes', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: true });
            n1.receive({ payload: false });
            setTimeout(function() {
                try { count.should.equal(2); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should deep compare objects', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: { a: 1 } });
            n1.receive({ payload: { a: 1 } }); // same
            n1.receive({ payload: { a: 2 } }); // changed
            setTimeout(function() {
                try { count.should.equal(2); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should reset on msg.reset', function(done) {
        helper.load(changeDetectNode, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), count = 0;
            n2.on('input', function() { count++; });
            n1.receive({ payload: 20 });
            n1.receive({ payload: null, reset: true });
            n1.receive({ payload: 20 }); // should forward again after reset
            setTimeout(function() {
                try { count.should.equal(2); done(); } catch(e) { done(e); }
            }, 50);
        });
    });
});
