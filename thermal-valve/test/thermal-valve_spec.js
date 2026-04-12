var helper = require('node-red-node-test-helper');
var thermalValveNode = require('../thermal-valve');

helper.init(require.resolve('node-red'));

describe('thermal-valve node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(opts) {
        opts = opts || {};
        return [
            { id: 'n1', type: 'thermal-valve', name: 'test',
              cycleTime:     opts.cycleTime || 10,
              cycleTimeUnit: 's',
              minOnTime:     opts.minOnTime  || 0,
              minOffTime:    opts.minOffTime || 0,
              invert:        opts.invert     || false,
              wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
    };

    it('should not output on non-numeric input', function(done) {
        helper.load(thermalValveNode, flow(), function() {
            var n2 = helper.getNode('n2'), received = false;
            n2.on('input', function() { received = true; });
            helper.getNode('n1').receive({ payload: 'hello' });
            setTimeout(function() {
                try { received.should.equal(false); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should clamp input above 100 to 100', function(done) {
        helper.load(thermalValveNode, flow(), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ payload: 150 });
            setTimeout(function() {
                try { n1.input.should.equal(100); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should clamp input below 0 to 0', function(done) {
        helper.load(thermalValveNode, flow(), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ payload: -10 });
            setTimeout(function() {
                try { n1.input.should.equal(0); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should set bypass=true on msg.bypass=true', function(done) {
        helper.load(thermalValveNode, flow(), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ bypass: true });
            setTimeout(function() {
                try { n1.bypass.should.equal(true); done(); } catch(e) { done(e); }
            }, 50);
        });
    });

    it('should clear bypass on msg.clearBypass=true', function(done) {
        helper.load(thermalValveNode, flow(), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ bypass: true });
            n1.receive({ clearBypass: true });
            setTimeout(function() {
                try { (n1.bypass === null).should.equal(true); done(); } catch(e) { done(e); }
            }, 50);
        });
    });
});
