const helper = require('node-red-node-test-helper');
const node   = require('../watchdog.js');
helper.init(require.resolve('node-red'));

describe('watchdog node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should pass through input message on output 1', function(done) {
    const flow = [
      { id:'n1', type:'watchdog', timeout:1, timeoutUnit:'s', startAlarm:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(42);
        done();
      });
      n1.receive({ payload: 42 });
    });
  });

  it('should trigger alarm after timeout', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'watchdog', timeout:100, timeoutUnit:'ms', startAlarm:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      n3.on('input', msg => {
        msg.payload.should.equal(true);
        msg.watchdog.alarm.should.equal(true);
        done();
      });
      n1.receive({ payload: 'heartbeat' });
    });
  });

  it('should clear alarm when message resumes', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'watchdog', timeout:100, timeoutUnit:'ms', startAlarm:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      var msgs = [];
      n3.on('input', msg => msgs.push(msg.payload));
      n1.receive({ payload: 'heartbeat' });
      setTimeout(() => {
        // alarm should have fired
        setTimeout(() => {
          n1.receive({ payload: 'resume' }); // clears alarm
          setTimeout(() => {
            msgs.should.containEql(true);
            msgs.should.containEql(false);
            done();
          }, 50);
        }, 150);
      }, 10);
    });
  });

  it('should only send output 2 on state change', function(done) {
    this.timeout(500);
    const flow = [
      { id:'n1', type:'watchdog', timeout:100, timeoutUnit:'ms', startAlarm:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      var alarmCount = 0;
      n3.on('input', msg => { if (msg.payload === true) alarmCount++; });
      n1.receive({ payload: 'ok' });
      setTimeout(() => {
        // Only 1 alarm should fire
        alarmCount.should.equal(1);
        done();
      }, 300);
    });
  });

  it('should not output on output 2 for normal messages', function(done) {
    const flow = [
      { id:'n1', type:'watchdog', timeout:1, timeoutUnit:'s', startAlarm:false, wires:[['n2'],['n3']] },
      { id:'n2', type:'helper' },
      { id:'n3', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n3 = helper.getNode('n3');
      var received = false;
      n3.on('input', () => { received = true; });
      n1.receive({ payload: 'ok' });
      n1.receive({ payload: 'ok' });
      setTimeout(() => {
        received.should.equal(false);
        done();
      }, 50);
    });
  });
});
