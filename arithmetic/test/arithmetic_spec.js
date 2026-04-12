var helper = require('node-red-node-test-helper');
var arithmeticNode = require('../arithmetic');

helper.init(require.resolve('node-red'));

describe('arithmetic node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(operator, decimals) {
        return [
            { id: 'n1', type: 'arithmetic', name: 'test', topicA: 'a', topicB: 'b', operator: operator || '+', decimals: decimals !== undefined ? decimals : 2, wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should add A + B', function(done) {
        helper.load(arithmeticNode, flow('+'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(15); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 10 });
            n1.receive({ topic: 'b', payload: 5  });
        });
    });

    it('should subtract A - B', function(done) {
        helper.load(arithmeticNode, flow('-'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(5); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 10 });
            n1.receive({ topic: 'b', payload: 5  });
        });
    });

    it('should block division by zero', function(done) {
        helper.load(arithmeticNode, flow('÷'), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            n1.receive({ topic: 'a', payload: 10 });
            n1.receive({ topic: 'b', payload: 0  });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should respect decimal places', function(done) {
        helper.load(arithmeticNode, flow('+', 0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(3); done(); } catch(e) { done(e); }
            });
            n1.receive({ topic: 'a', payload: 1.5 });
            n1.receive({ topic: 'b', payload: 1.5 });
        });
    });

    it('should not output while waiting for B', function(done) {
        helper.load(arithmeticNode, flow('+'), function() {
            var n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            helper.getNode('n1').receive({ topic: 'a', payload: 5 });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });
});
