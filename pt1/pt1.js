module.exports = function(RED) {
    function PT1Node(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var _T1raw = parseFloat(config.T1);
        var T1raw  = isNaN(_T1raw) ? 60 : _T1raw;
        var unit   = config.T1Unit || 's';
        node.decimals = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;

        // Convert T1 to seconds
        node.T1 = toSeconds(T1raw, unit);

        node.lastOutput = undefined; // unrounded filter state
        node.lastTime   = undefined;

        node.status({ fill: 'grey', shape: 'ring', text: 'Initializing...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.lastOutput = undefined;
                node.lastTime   = undefined;
                node.status({ fill: 'grey', shape: 'ring', text: 'Initializing...' });
                return;
            }

            var x = parseFloat(msg.payload);
            if (isNaN(x)) { node.warn('Input is not a number: ' + msg.payload); return; }

            var T1 = (msg.T1 !== undefined) ? parseFloat(msg.T1) : node.T1;
            if (isNaN(T1) || T1 < 0) T1 = node.T1;

            var now = Date.now();
            var state;
            var dt = 0;
            var initialized = true;

            if (node.lastOutput === undefined || node.lastTime === undefined) {
                state           = x;
                initialized     = false;
            } else {
                dt = (now - node.lastTime) / 1000;
                if (T1 === 0) {
                    state = x;
                } else {
                    var alpha = dt / (T1 + dt);
                    state     = node.lastOutput + alpha * (x - node.lastOutput);
                }
            }

            // Keep the unrounded value as filter state; rounding it would make
            // the filter stall when the per-step change is below the resolution.
            node.lastOutput = state;
            node.lastTime   = now;
            var output      = parseFloat(state.toFixed(node.decimals));

            msg.payload = output;
            msg.pt1     = {
                input:       x,
                output:      output,
                T1:          T1,
                dt:          Math.round(dt * 100) / 100,
                decimals:    node.decimals,
                initialized: initialized
            };

            node.status({ fill: 'green', shape: 'dot', text: 'in: ' + x + ' → out: ' + output + ' (T1: ' + T1 + 's)' });
            node.send(msg);
        });

        function toSeconds(val, unit) {
            if (unit === 'min') return val * 60;
            if (unit === 'h')   return val * 3600;
            return val;
        }
    }

    RED.nodes.registerType('pt1', PT1Node);
};
