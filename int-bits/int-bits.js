module.exports = function(RED) {
    function IntBitsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.bits  = Math.min(32, parseInt(config.bits, 10) || 8); // 32-bit integer operations
        node.order = config.order || 'lsb';

        node.status({ fill:'grey', shape:'dot', text:'Ready (' + node.bits + ' bits, ' + node.order + ')' });

        node.on('input', function(msg, send, done) {
            if (Array.isArray(msg.payload)) {
                // bits-to-int: array [1,0,1,...] LSB or MSB first
                var inputBits = msg.payload.slice();
                if (inputBits.length > 32) node.warn('Only the first 32 bits are used');
                var arr = inputBits.slice(0, 32);
                if (node.order === 'msb') arr.reverse();
                var result = 0;
                for (var j = 0; j < arr.length; j++) {
                    if (arr[j]) result |= (1 << j);
                }
                result = result >>> 0;
                msg.payload = result;
                msg.intBits = { mode:'bits-to-int', bits:inputBits, result:result, bitCount:node.bits, order:node.order };
                node.status({ fill:'green', shape:'dot', text:'[…] → ' + result });
            } else {
                // int-to-bits
                var n = parseInt(msg.payload, 10);
                if (isNaN(n)) { node.warn('Input is not an integer or array: ' + msg.payload); done(); return; }
                n = Math.floor(Math.abs(n)) >>> 0;

                var bitsArr = [];
                for (var i = 0; i < node.bits; i++) {
                    bitsArr.push((n & (1 << i)) ? 1 : 0);
                }
                if (node.order === 'msb') bitsArr.reverse();

                msg.payload = bitsArr;
                msg.intBits = { mode:'int-to-bits', input:n, bits:bitsArr, bitCount:node.bits, order:node.order };

                var preview = bitsArr.join(',');
                node.status({ fill:'green', shape:'dot', text:n + ' → [' + preview + ']' });
            }
            send(msg);
            done();
        });
    }

    RED.nodes.registerType('int-bits', IntBitsNode);
};
