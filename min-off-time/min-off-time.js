module.exports = function(RED) {
    function MinOffTimeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var minOffTime  = parseInt(config.minOffTime, 10) || 60;
        var unit        = config.minOffTimeUnit || 's';
        var multipliers = { 'ms': 1, 's': 1000, 'min': 60000 };
        node.minMs      = minOffTime * (multipliers[unit] || 1000);

        node.output     = true;
        node.input      = true;
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
                node.status({ fill: 'yellow', shape: 'dot', text: 'OFF (held ' + r + 's remaining)' });
            } else if (node.output) {
                node.status({ fill: 'green', shape: 'dot', text: 'ON' });
            } else {
                node.status({ fill: 'grey', shape: 'dot', text: 'OFF' });
            }
        }

        function sendMsg(msg) {
            msg.payload    = node.output;
            msg.minOffTime = {
                input:       node.input,
                output:      node.output,
                held:        node.held,
                remainingMs: remaining(),
                minOffTime:  node.minMs
            };
            node.send(msg);
            updateStatus();
        }

        node.status({ fill: 'green', shape: 'dot', text: 'ON' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                if (node.timer) { clearTimeout(node.timer); node.timer = null; }
                node.output = true;
                node.held   = false;
                node.input  = true;
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

            if (!node.input) {
                if (node.output) node.output = false;
                node.held = false;
                if (node.timer) clearTimeout(node.timer);
                node.timerStart = Date.now();
                node.timer = setTimeout(function() {
                    node.timer = null;
                    node.held  = false;
                    if (node.input) {
                        node.output = true;
                        node.send({ payload: true, minOffTime: { input: true, output: true, held: false, remainingMs: 0, minOffTime: node.minMs } });
                        updateStatus();
                    }
                }, node.minMs);
                sendMsg(msg);
            } else {
                if (node.timer) {
                    node.held = true;
                    updateStatus();
                } else {
                    node.output = true;
                    node.held   = false;
                    sendMsg(msg);
                }
            }
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('min-off-time', MinOffTimeNode);
};
