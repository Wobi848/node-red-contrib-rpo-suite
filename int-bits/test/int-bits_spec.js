const helper = require('node-red-node-test-helper');
const node   = require('../int-bits.js');
helper.init(require.resolve('node-red'));

describe('int-bits node', function() {
  before(() => helper.startServer());
  after(() => helper.stopServer());
  afterEach(() => helper.unload());

  it('should convert 5 to bits LSB [1,0,1,0,0,0,0,0]', function(done) {
    const flow = [
      { id:'n1', type:'int-bits', bits:8, order:'lsb', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.deepEqual([1,0,1,0,0,0,0,0]);
        done();
      });
      n1.receive({ payload: 5 });
    });
  });

  it('should convert bit array back to integer', function(done) {
    const flow = [
      { id:'n1', type:'int-bits', bits:8, order:'lsb', wires:[['n2']] },
      { id:'n2', type:'helper' }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      var n2 = helper.getNode('n2');
      n2.on('input', msg => {
        msg.payload.should.equal(5);
        done();
      });
      n1.receive({ payload: [1,0,1,0,0,0,0,0] });
    });
  });

  describe('metadata and 32 bits', function () {
    it('should report the input bits in msg.intBits.bits for bits-to-int', function (done) {
      const flow = [{ id:'n1', type:'int-bits', bits:8, order:'lsb', wires:[['n2']] }, { id:'n2', type:'helper' }];
      helper.load(require('../int-bits.js'), flow, function () {
        var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
        n2.on('input', msg => {
          try { msg.payload.should.equal(5); msg.intBits.bits.should.eql([1, 0, 1]); done(); } catch (e) { done(e); }
        });
        n1.receive({ payload: [1, 0, 1] });
      });
    });
    it('should limit the bit count to 32', function (done) {
      const flow = [{ id:'n1', type:'int-bits', bits:40, order:'lsb', wires:[['n2']] }, { id:'n2', type:'helper' }];
      helper.load(require('../int-bits.js'), flow, function () {
        var n1 = helper.getNode('n1'), n2 = helper.getNode('n2');
        n2.on('input', msg => {
          try { msg.payload.length.should.equal(32); msg.payload[0].should.equal(1); done(); } catch (e) { done(e); }
        });
        n1.receive({ payload: 1 });
      });
    });
  });
});
