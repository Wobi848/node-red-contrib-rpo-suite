const helper = require('node-red-node-test-helper');
const alarmNode = require('../alarm.js');
helper.init(require.resolve('node-red'));

describe('rpo-alarm node', function () {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  // Loads the node, sends msgs one by one (waitMs between them) and returns
  // all messages of output 1 (active) and output 2 (alarm object).
  function run(config, msgs, check, done, waitMs) {
    const flow = [
      Object.assign({ id: 'n1', type: 'rpo-alarm', name: 'Test alarm', persistent: false, wires: [['out1'], ['out2']] }, config),
      { id: 'out1', type: 'helper' },
      { id: 'out2', type: 'helper' }
    ];
    helper.load(alarmNode, flow, function () {
      const n1 = helper.getNode('n1');
      const active = [], objects = [];
      helper.getNode('out1').on('input', m => active.push(m.payload));
      helper.getNode('out2').on('input', m => objects.push(m.payload));
      let i = 0;
      (function next() {
        if (i < msgs.length) { n1.receive(msgs[i++]); setTimeout(next, waitMs || 20); return; }
        setTimeout(() => {
          try { check(active, objects, n1); done(); } catch (e) { done(e); }
        }, (waitMs || 20) + 30);
      })();
    });
  }
  const fault = v => ({ topic: 'alarm', payload: v });
  const ack = user => ({ topic: 'ack', user });

  it('should be loaded', function (done) {
    helper.load(alarmNode, [{ id: 'n1', type: 'rpo-alarm', name: 'x' }], function () {
      try { helper.getNode('n1').should.have.property('name', 'x'); done(); } catch (e) { done(e); }
    });
  });

  it('should go active on a fault', function (done) {
    run({}, [fault(true)], (active, objects) => {
      active.should.eql([true]);
      objects[0].state.should.equal('active_unacked');
      objects[0].count.should.equal(1);
    }, done);
  });

  it('should stay active when the fault is gone but not acknowledged (latch)', function (done) {
    run({}, [fault(true), fault(false)], (active, objects) => {
      active.should.eql([true]);
      objects.map(o => o.state).should.eql(['active_unacked', 'cleared_unacked']);
    }, done);
  });

  it('should go normal on acknowledge after the fault is gone', function (done) {
    run({}, [fault(true), fault(false), ack('Rappo')], (active, objects) => {
      active.should.eql([true, false]);
      objects[2].state.should.equal('normal');
      objects[2].ackedBy.should.equal('Rappo');
    }, done);
  });

  it('should stay active when acknowledged while the fault is still present', function (done) {
    run({}, [fault(true), ack(), fault(false)], (active, objects) => {
      objects.map(o => o.state).should.eql(['active_unacked', 'active_acked', 'normal']);
      active.should.eql([true, false]); // false only when the fault is gone
    }, done);
  });

  it('should ignore acknowledge in normal state', function (done) {
    run({}, [ack()], (active, objects) => {
      active.should.eql([]);
      objects.should.eql([]);
    }, done);
  });

  it('should only send on changes, not on repeated equal input', function (done) {
    run({}, [fault(true), fault(true), fault(true)], (active, objects) => {
      active.should.eql([true]);
      objects.length.should.equal(1);
    }, done);
  });

  it('should accept 1/0 and "on"/"off" as fault input', function (done) {
    run({ ackRequired: false }, [fault(1), fault('off'), fault('on'), fault(0)], (active) => {
      active.should.eql([true, false, true, false]);
    }, done);
  });

  it('should come and go with the fault when acknowledge is not required', function (done) {
    run({ ackRequired: false }, [fault(true), fault(false)], (active, objects) => {
      active.should.eql([true, false]);
      objects.map(o => o.state).should.eql(['active_acked', 'normal']);
    }, done);
  });

  it('should count repeated alarms', function (done) {
    run({ ackRequired: false }, [fault(true), fault(false), fault(true)], (active, objects) => {
      objects[objects.length - 1].count.should.equal(2);
    }, done);
  });

  it('should only alarm when the fault lasts longer than the on delay', function (done) {
    // delay 0.15 s: a 60 ms spike gives no alarm, the lasting fault afterwards does
    const flow = [
      { id: 'n1', type: 'rpo-alarm', delayOn: 0.15, persistent: false, wires: [['out1'], ['out2']] },
      { id: 'out1', type: 'helper' },
      { id: 'out2', type: 'helper' }
    ];
    helper.load(alarmNode, flow, function () {
      const n1 = helper.getNode('n1');
      const active = [];
      helper.getNode('out1').on('input', m => active.push(m.payload));
      n1.receive(fault(true));
      setTimeout(() => n1.receive(fault(false)), 60);   // spike ends before the delay
      setTimeout(() => n1.receive(fault(true)), 120);   // lasting fault
      setTimeout(() => {
        try { active.should.eql([]); } catch (e) { return done(e); }
      }, 220);                                          // delay not over yet
      setTimeout(() => {
        try { active.should.eql([true]); done(); } catch (e) { done(e); }
      }, 400);
    });
  });

  it('should not alarm on a short spike below the on delay', function (done) {
    run({ delayOn: 0.2 }, [fault(true), fault(false)], (active, objects) => {
      active.should.eql([]);
      objects.should.eql([]);
    }, done, 50);
  });

  it('should suppress the alarm while inhibited and alarm again when released with a fault', function (done) {
    run({}, [{ topic: 'inhibit', payload: true }, fault(true), { topic: 'inhibit', payload: false }], (active, objects) => {
      objects.map(o => o.state).should.eql(['inhibited', 'normal', 'active_unacked']);
      active.should.eql([true]);
    }, done);
  });

  it('should drop a latched alarm when inhibited', function (done) {
    run({}, [fault(true), { topic: 'inhibit', payload: true }], (active, objects) => {
      active.should.eql([true, false]);
      objects[1].state.should.equal('inhibited');
    }, done);
  });

  it('should reset to normal on msg.reset', function (done) {
    run({}, [fault(true), { reset: true }], (active, objects) => {
      active.should.eql([true, false]);
      objects[1].state.should.equal('normal');
    }, done);
  });

  it('should use configured topic names', function (done) {
    run({ topicAlarm: 'stoerung', topicAck: 'quittieren' },
      [{ topic: 'stoerung', payload: true }, { topic: 'stoerung', payload: false }, { topic: 'quittieren' }],
      (active) => { active.should.eql([true, false]); }, done);
  });

  it('should warn on an unknown topic', function (done) {
    run({}, [{ topic: 'foo', payload: true }], (active, objects, n1) => {
      active.should.eql([]);
      n1.warn.should.be.calledWithMatch('Unknown topic');
    }, done);
  });

  it('should keep an unacknowledged alarm after a restart', function (done) {
    // Helper node created before n1: writes the state n1 would have stored before a restart
    function seedModule(RED) {
      RED.nodes.registerType('seed-context', function (config) {
        RED.nodes.createNode(this, config);
        helper._context.get('n1', undefined).set('alarm', {
          state: 'cleared_unacked', condition: false, raw: false, inhibited: false,
          since: '2026-10-24T10:00:00.000Z', clearedAt: '2026-10-24T10:05:00.000Z', ackedAt: null, ackedBy: null, count: 4
        });
      });
    }
    const flow = [
      { id: 's1', type: 'seed-context' },
      { id: 'n1', type: 'rpo-alarm', persistent: true, wires: [['out1'], ['out2']] },
      { id: 'out1', type: 'helper' },
      { id: 'out2', type: 'helper' }
    ];
    helper.load([seedModule, alarmNode], flow, function () {
      helper.getNode('out1').on('input', msg => {
        try {
          msg.payload.should.equal(false);      // acknowledged → normal
          msg.alarm.count.should.equal(4);      // history kept from before the restart
          done();
        } catch (e) { done(e); }
      });
      helper.getNode('n1').receive({ topic: 'ack' });
    });
  });
});
