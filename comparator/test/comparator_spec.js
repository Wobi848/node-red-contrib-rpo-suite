var helper = require('node-red-node-test-helper');
var comparatorNode = require('../comparator');

helper.init(require.resolve('node-red'));

describe('comparator node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(operator, tolerance) {
        return [
            { id: 'n1', type: 'comparator', name: 'test', topicA: 'a', topicB: 'b', operator: operator || '>', tolerance: tolerance || 0.01, wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should output true when A > B', function(done) {
        helper.load(comparatorNode, flow('>'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 24.5 });
            n1.receive({ topic: 'b', payload: 18.2 });
        });
    });

    it('should output false when A < B for > operator', function(done) {
        helper.load(comparatorNode, flow('>'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(false); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 10 });
            n1.receive({ topic: 'b', payload: 20 });
        });
    });

    it('should handle == with tolerance', function(done) {
        helper.load(comparatorNode, flow('==', 0.5), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 20.3 });
            n1.receive({ topic: 'b', payload: 20.0 });
        });
    });

    it('should not output when only one value known', function(done) {
        helper.load(comparatorNode, flow('>'), function() {
            var n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            helper.getNode('n1').receive({ topic: 'a', payload: 10 });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should warn and not output on non-numeric input', function(done) {
        helper.load(comparatorNode, flow('>'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            n1.receive({ topic: 'a', payload: 'hello' });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should reset stored values on msg.reset', function(done) {
        helper.load(comparatorNode, flow('>'), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ topic: 'a', payload: 10 });
            n1.receive({ topic: 'b', payload: 5  });
            n1.receive({ payload: null, reset: true });
            setTimeout(function() {
                try {
                    (n1.valueA === undefined).should.equal(true);
                    (n1.valueB === undefined).should.equal(true);
                    done();
                } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should handle all 6 operators', function(done) {
        helper.load(comparatorNode, flow('<'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 5 });
            n1.receive({ topic: 'b', payload: 10 });
        });
    });
});
