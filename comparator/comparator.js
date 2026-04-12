module.exports = function(RED) {
    function ComparatorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicA    = config.topicA    || 'a';
        node.topicB    = config.topicB    || 'b';
        node.operator  = config.operator  || '>';
        node.tolerance = parseFloat(config.tolerance) || 0.01;

        node.valueA = undefined;
        node.valueB = undefined;

        updateStatus(node);

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.valueA = undefined;
                node.valueB = undefined;
                updateStatus(node);
                return;
            }

            var op  = msg.operator  !== undefined ? msg.operator  : node.operator;
            var tol = msg.tolerance !== undefined ? parseFloat(msg.tolerance) : node.tolerance;
            var topic = (msg.topic !== undefined) ? String(msg.topic) : '';

            if (topic === node.topicA) {
                var val = parseFloat(msg.payload);
                if (isNaN(val)) { node.warn('Input A is not a number: ' + msg.payload); return; }
                node.valueA = val;
            } else if (topic === node.topicB) {
                var val = parseFloat(msg.payload);
                if (isNaN(val)) { node.warn('Input B is not a number: ' + msg.payload); return; }
                node.valueB = val;
            } else {
                node.warn('Unknown topic: ' + topic + ' (expected "' + node.topicA + '" or "' + node.topicB + '")');
                return;
            }

            if (node.valueA === undefined) { node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for A...' }); return; }
            if (node.valueB === undefined) { node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for B...' }); return; }

            var a = node.valueA, b = node.valueB;
            var result;

            switch (op) {
                case '>':  result = a > b;                      break;
                case '<':  result = a < b;                      break;
                case '>=': result = a >= b;                     break;
                case '<=': result = a <= b;                     break;
                case '==': result = Math.abs(a - b) <= tol;     break;
                case '!=': result = Math.abs(a - b) > tol;      break;
                default:   node.warn('Unknown operator: ' + op); return;
            }

            msg.payload    = result;
            msg.comparator = { a: a, b: b, operator: op, result: result, tolerance: tol };

            if (result) {
                node.status({ fill: 'green', shape: 'dot', text: a + ' ' + op + ' ' + b + ' → true' });
            } else {
                node.status({ fill: 'grey',  shape: 'dot', text: a + ' ' + op + ' ' + b + ' → false' });
            }

            node.send(msg);
        });

        function updateStatus(n) {
            if (n.valueA === undefined || n.valueB === undefined) {
                var waiting = (n.valueA === undefined) ? 'A' : 'B';
                n.status({ fill: 'grey', shape: 'ring', text: 'Waiting for ' + waiting + '...' });
            }
        }
    }

    RED.nodes.registerType('comparator', ComparatorNode);
};
