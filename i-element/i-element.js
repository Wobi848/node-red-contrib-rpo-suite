module.exports = function(RED) {
    function IElementNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var multipliers = { 's': 1, 'min': 60, 'h': 3600 };
        var tiRaw = parseFloat(config.Ti); if (isNaN(tiRaw) || tiRaw <= 0) tiRaw = 60;
        node.Ti     = tiRaw * (multipliers[config.TiUnit] || 1);
        node.outMin = parseFloat(config.outMin); if (isNaN(node.outMin)) node.outMin = 0;
        node.outMax = parseFloat(config.outMax); if (isNaN(node.outMax)) node.outMax = 100;
        node.decimals = parseInt(config.decimals, 10); if (isNaN(node.decimals)) node.decimals = 2;

        node.integral = 0;
        node.lastTime = null;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.integral = 0;
                node.lastTime = null;
                node.status({ fill: 'grey', shape: 'ring', text: 'Reset → 0' });
                return;
            }
            if (msg.set !== undefined) {
                node.integral = parseFloat(msg.set) || 0;
                node.lastTime = Date.now();
                node.status({ fill: 'blue', shape: 'dot', text: 'Set → ' + node.integral });
                return;
            }

            var x = parseFloat(msg.payload);
            if (isNaN(x)) { node.warn('Non-numeric input: ' + msg.payload); return; }

            var Ti = msg.Ti !== undefined ? parseFloat(msg.Ti) : node.Ti;
            if (isNaN(Ti) || Ti <= 0) Ti = node.Ti;

            var now = Date.now();
            if (node.lastTime === null) {
                node.lastTime = now;
                node.status({ fill: 'grey', shape: 'ring', text: 'First value received' });
                return;
            }

            var dt = (now - node.lastTime) / 1000;
            node.lastTime = now;

            node.integral += (x * dt) / Ti;

            var clamped = false, clampedAt = null;
            if (node.integral > node.outMax) { node.integral = node.outMax; clamped = true; clampedAt = 'max'; }
            if (node.integral < node.outMin) { node.integral = node.outMin; clamped = true; clampedAt = 'min'; }

            var result = parseFloat(node.integral.toFixed(node.decimals));

            var info = {
                input:     x,
                integral:  result,
                Ti:        Ti,
                dt:        parseFloat(dt.toFixed(3)),
                clamped:   clamped,
                clampedAt: clampedAt,
                decimals:  node.decimals
            };

            var out = RED.util.cloneMessage(msg);
            out.payload  = result;
            out.iElement = info;
            node.send(out);

            var fill = clamped ? 'yellow' : 'green';
            var text = clamped ? '∫ ' + result + ' (clamped ' + clampedAt + ')' : '∫ ' + result + ' (Ti: ' + Ti + 's)';
            node.status({ fill: fill, shape: 'dot', text: text });
        });
    }

    RED.nodes.registerType('i-element', IElementNode);
};
