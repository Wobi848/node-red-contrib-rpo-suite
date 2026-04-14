module.exports = function(RED) {
    function MinOnTimeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var minOnTime   = parseInt(config.minOnTime, 10) || 30;
        var unit        = config.minOnTimeUnit || 's';
        var multipliers = { 'ms': 1, 's': 1000, 'min': 60000 };
        node.minMs      = minOnTime * (multipliers[unit] || 1000);

        node.output     = false;
        node.input      = false;
        node.held       = false;
        node.timer      = null;
        node.timerStart = null;

        function remaining() {
            if (!node.timer || !node.timerStart) return 0;
            return Math.max(0, node.minMs - (Date.now() - node.timerStart));
        }

        function updateStatus() {
            if (node.held) {
                var r = Math.round(remaining() / 1000);
                node.status({ fill: 'yellow', shape: 'dot', text: 'ON (held ' + r + 's remaining)' });
            } else if (node.output) {
                node.status({ fill: 'green', shape: 'dot', text: 'ON' });
            } else {
                node.status({ fill: 'grey', shape: 'dot', text: 'OFF' });
            }
        }

        function sendMsg(msg) {
            msg.payload    = node.output;
            msg.minOnTime  = {
                input:      node.input,
                output:     node.output,
                held:       node.held,
                remainingMs: remaining(),
                minOnTime:  node.minMs
            };
            node.send(msg);
            updateStatus();
        }

        node.status({ fill: 'grey', shape: 'dot', text: 'OFF' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                if (node.timer) { clearTimeout(node.timer); node.timer = null; }
                node.output = false;
                node.held   = false;
                node.input  = false;
                sendMsg(msg);
                return;
            }

            if (msg.bypassMin === true) {
                if (node.timer) { clearTimeout(node.timer); node.timer = null; }
                node.input  = !!msg.payload;
                node.output = node.input;
                node.held   = false;
                sendMsg(msg);
                return;
            }

            node.input = !!msg.payload;

            if (node.input) {
                if (!node.output) node.output = true;
                node.held = false;
                if (node.timer) clearTimeout(node.timer);
                node.timerStart = Date.now();
                node.timer = setTimeout(function() {
                    node.timer = null;
                    node.held  = false;
                    if (!node.input) {
                        node.output = false;
                        node.send({ payload: false, minOnTime: { input: false, output: false, held: false, remainingMs: 0, minOnTime: node.minMs } });
                        updateStatus();
                    }
                }, node.minMs);
                sendMsg(msg);
            } else {
                if (node.timer) {
                    node.held = true;
                    updateStatus();
                } else {
                    node.output = false;
                    node.held   = false;
                    sendMsg(msg);
                }
            }
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('min-on-time', MinOnTimeNode);
};
