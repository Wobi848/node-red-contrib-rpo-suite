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
});
