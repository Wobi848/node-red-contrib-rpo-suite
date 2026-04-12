module.exports = function(RED) {
    function ArithmeticNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicA   = config.topicA   || 'a';
        node.topicB   = config.topicB   || 'b';
        node.operator = config.operator || '+';
        node.decimals = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;

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

            var op  = msg.operator !== undefined ? msg.operator : node.operator;
            var dec = node.decimals;
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
                case '+': result = a + b; break;
                case '-': result = a - b; break;
                case '×': result = a * b; break;
                case '÷':
                    if (b === 0) { node.warn('Division by zero'); node.status({ fill: 'yellow', shape: 'dot', text: 'Division by zero' }); return; }
                    result = a / b;
                    break;
                case '%':
                    if (b === 0) { node.warn('Modulo by zero'); node.status({ fill: 'yellow', shape: 'dot', text: 'Modulo by zero' }); return; }
                    result = a % b;
                    break;
                case '^': result = Math.pow(a, b); break;
                default: node.warn('Unknown operator: ' + op); return;
            }

            result = parseFloat(result.toFixed(dec));

            msg.payload    = result;
            msg.arithmetic = { a: a, b: b, operator: op, result: result, decimals: dec };

            node.status({ fill: 'green', shape: 'dot', text: a + ' ' + op + ' ' + b + ' = ' + result });
            node.send(msg);
        });

        function updateStatus(n) {
            if (n.valueA === undefined || n.valueB === undefined) {
                var waiting = (n.valueA === undefined) ? 'A' : 'B';
                n.status({ fill: 'grey', shape: 'ring', text: 'Waiting for ' + waiting + '...' });
            }
        }
    }

    RED.nodes.registerType('arithmetic', ArithmeticNode);
};
