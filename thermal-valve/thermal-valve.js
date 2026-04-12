module.exports = function(RED) {
    function ThermalValveNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var ctRaw  = parseFloat(config.cycleTime) || 300;
        var ctUnit = config.cycleTimeUnit || 's';
        node.cycleTime  = ctUnit === 'min' ? ctRaw * 60 : ctRaw;
        node.minOnTime  = parseFloat(config.minOnTime)  || 0;
        node.minOffTime = parseFloat(config.minOffTime) || 0;
        node.invert     = config.invert === true;

        node.input      = 0;      // 0–100%
        node.bypass     = null;   // null = no bypass
        node.cyclePos   = 0;      // seconds elapsed in current cycle
        node.output     = false;
        node.lastOutput = null;

        updateStatus(node);

        // 1-second tick
        node.ticker = setInterval(function() {
            node.cyclePos++;
            if (node.cyclePos > node.cycleTime) node.cyclePos = 1;

            var newOutput = calcOutput(node);
            if (node.invert) newOutput = !newOutput;

            if (newOutput !== node.lastOutput) {
                node.lastOutput = newOutput;
                node.output     = newOutput;
                updateStatus(node);
                node.send(buildMsg(node, newOutput));
            }
        }, 1000);

        node.on('input', function(msg) {
            if (msg.clearBypass === true) {
                node.bypass = null;
            } else if (msg.bypass !== undefined) {
                node.bypass = (msg.bypass === true || msg.bypass === 'true') ? true : false;
            }

            if (msg.bypass === undefined && msg.clearBypass !== true) {
                var val = parseFloat(msg.payload);
                if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); return; }
                node.input = Math.max(0, Math.min(100, val));
            }

            updateStatus(node);
        });

        node.on('close', function() {
            clearInterval(node.ticker);
        });

        function calcOutput(n) {
            if (n.bypass !== null) return n.bypass;

            var pct = n.input / 100;
            if (pct <= 0) return false;
            if (pct >= 1) return true;

            var onTime  = pct * n.cycleTime;
            var offTime = n.cycleTime - onTime;

            // Apply min on/off time constraints
            if (onTime  > 0 && onTime  < n.minOnTime)  return false;
            if (offTime > 0 && offTime < n.minOffTime) return true;

            return n.cyclePos <= onTime;
        }

        function buildMsg(n, output) {
            var onTime  = (n.input / 100) * n.cycleTime;
            var offTime = n.cycleTime - onTime;
            return {
                payload: output,
                thermalValve: {
                    input:         n.input,
                    output:        output,
                    onTime:        Math.round(onTime),
                    offTime:       Math.round(offTime),
                    cycleTime:     n.cycleTime,
                    cyclePosition: n.cyclePos,
                    bypass:        n.bypass !== null ? n.bypass : false,
                    inverted:      n.invert
                }
            };
        }

        function updateStatus(n) {
            if (n.bypass !== null) {
                n.status({ fill: 'yellow', shape: 'dot', text: 'BYPASS ' + (n.bypass ? 'ON' : 'OFF') });
            } else if (n.output) {
                var remaining = Math.round((n.input / 100) * n.cycleTime) - n.cyclePos;
                if (remaining < 0) remaining = 0;
                n.status({ fill: 'green', shape: 'dot', text: 'OPEN ' + n.input + '% (' + remaining + 's remaining)' });
            } else {
                var onTime  = (n.input / 100) * n.cycleTime;
                var remaining2 = Math.round(n.cycleTime - n.cyclePos);
                if (remaining2 < 0) remaining2 = 0;
                n.status({ fill: 'grey', shape: 'dot', text: 'CLOSED ' + n.input + '% (' + remaining2 + 's remaining)' });
            }
        }
    }

    RED.nodes.registerType('thermal-valve', ThermalValveNode);
};
