var helper = require('node-red-node-test-helper');
var pt1Node = require('../pt1');

helper.init(require.resolve('node-red'));

describe('pt1 node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(T1, T1Unit, decimals) {
        return [
            { id: 'n1', type: 'pt1', name: 'test', T1: T1 !== undefined ? T1 : 60, T1Unit: T1Unit || 's', decimals: decimals !== undefined ? decimals : 2, wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should pass through first value unchanged', function(done) {
        helper.load(pt1Node, flow(60), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(25); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: 25 });
        });
    });

    it('should pass through directly when T1=0', function(done) {
        helper.load(pt1Node, flow(0), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), results = [];
            n2.on('input', function(msg) { results.push(msg.payload); });
            n1.receive({ payload: 25 });
            n1.receive({ payload: 30 });
            setTimeout(function() {
                try { results[1].should.equal(30); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should smooth value between first and second reading', function(done) {
        helper.load(pt1Node, flow(60), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), results = [];
            n2.on('input', function(msg) { results.push(msg.payload); });
            n1.receive({ payload: 25 });
            setTimeout(function() {
                n1.receive({ payload: 30 });
                setTimeout(function() {
                    try {
                        results[1].should.be.above(25);
                        results[1].should.be.below(30);
                        done();
                    } catch(e) { done(e); }
                }, 50);
            }, 100);
        });
    });

    it('should warn and not output on non-numeric input', function(done) {
        helper.load(pt1Node, flow(60), function() {
            var n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            helper.getNode('n1').receive({ payload: 'not a number' });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should reset filter state on msg.reset', function(done) {
        helper.load(pt1Node, flow(60), function() {
            var n1 = helper.getNode('n1'), n2 = helper.getNode('n2'), results = [];
            n2.on('input', function(msg) { results.push(msg.payload); });
            n1.receive({ payload: 25 });
            setTimeout(function() {
                n1.receive({ payload: null, reset: true });
                n1.receive({ payload: 30 });
                setTimeout(function() {
                    try { results[1].should.equal(30); done(); } catch(e) { done(e); }
                }, 50);
            }, 100);
        });
    });
});
