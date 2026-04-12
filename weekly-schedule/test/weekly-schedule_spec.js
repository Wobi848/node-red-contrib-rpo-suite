var helper = require('node-red-node-test-helper');
var weeklyScheduleNode = require('../weekly-schedule');

helper.init(require.resolve('node-red'));

describe('weekly-schedule node', function() {
    before(function(done)  { helper.startServer(done); });
    after(function(done)   { helper.stopServer(done); });
    afterEach(function()   { return helper.unload(); });

    var allDaysFlow = function(from, to) {
        var schedule = [];
        for (var d = 0; d < 7; d++) schedule.push({ day: d, from: from, to: to });
        return [
            { id: 'n1', type: 'weekly-schedule', name: 'test',
              schedule: schedule, onValue: true, offValue: false, timezone: '',
              wires: [['n2'], ['n3']] },
            { id: 'n2', type: 'helper' },
            { id: 'n3', type: 'helper' }
        ];
    };

    it('should output current state on every input (Output 1)', function(done) {
        helper.load(weeklyScheduleNode, allDaysFlow('00:00', '23:59'), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ payload: null });
        });
    });

    it('should force ON with msg.override=true', function(done) {
        helper.load(weeklyScheduleNode, allDaysFlow('00:00', '00:01'), function() {
            var n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                try { msg.payload.should.equal(true); done(); } catch(e) { done(e); }
            });
            helper.getNode('n1').receive({ override: true });
        });
    });

    it('should clear override on msg.clearOverride=true', function(done) {
        helper.load(weeklyScheduleNode, allDaysFlow('00:00', '23:59'), function() {
            var n1 = helper.getNode('n1');
            n1.receive({ override: false });
            n1.receive({ clearOverride: true });
            setTimeout(function() {
                try { (n1.override === null).should.equal(true); done(); } catch(e) { done(e); }
            }, 50);
        });
    });
});
