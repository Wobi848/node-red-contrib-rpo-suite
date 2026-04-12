var helper = require('node-red-node-test-helper');
var sensorCheckNode = require('../sensor-check');

helper.init(require.resolve('node-red'));

describe('sensor-check node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var flow = function(opts) {
        opts = opts || {};
        return [
            { id: 'n1', type: 'sensor-check', name: 'test',
              min:         opts.min         !== undefined ? opts.min         : 0,
              max:         opts.max         !== undefined ? opts.max         : 50,
              fallback:    opts.fallback    !== undefined ? opts.fallback    : 20,
              useFallback: opts.useFallback !== false,
              timeout:     opts.timeout     || 0,
              hysteresis:  opts.hysteresis  || 0,
              wires: [['n2'], ['n3']] },
            { id: 'n2', type: 'helper' },
            { id: 'n3', type: 'helper' }
        ];
    };

    it('should pass through value in range, alarm=false', function(done) {
        helper.load(sensorCheckNode, flow(), function() {
            var n3 = helper.getNode('n3');
            n3.on('input', function(msg) {
                try { msg.payload.should.equal(false); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: 22.5 });
        });
    });

    it('should send fallback and alarm=true when value below min', function(done) {
        helper.load(sensorCheckNode, flow({ min: 0, max: 50, fallback: 20 }), function() {
            var n2 = helper.getNode('n2'), n3 = helper.getNode('n3'), ok = false;
            n2.on('input', function(msg) { ok = (msg.payload === 20); });
            n3.on('input', function(msg) {
                try { msg.payload.should.equal(true); ok.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: -5 });
        });
    });

    it('should send fallback and alarm=true when value above max', function(done) {
        helper.load(sensorCheckNode, flow({ min: 0, max: 50, fallback: 20 }), function() {
            var n3 = helper.getNode('n3');
            n3.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: 999 });
        });
    });

    it('should set fault=true after timeout with no message', function(done) {
        helper.load(sensorCheckNode, flow({ timeout: 0.1 }), function() {
            var n1 = helper.getNode('n1');
            setTimeout(function() {
                try {
                    n1.fault.should.equal(true);
                    n1.faultType.should.equal('timeout');
                    done();
                } catch(e) { done(e); }
            }, 200);
        });
    }).timeout(500);

    it('should acknowledge fault on msg.acknowledge=true', function(done) {
        helper.load(sensorCheckNode, flow(), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ payload: -5 }); // trigger fault
            setTimeout(function() {
                n1.receive({ payload: null, acknowledge: true });
                setTimeout(function() {
                    try { n1.fault.should.equal(false); done(); } catch(e) { done(e); }
                }, 50);
            }, 50);
        });
    });
});
