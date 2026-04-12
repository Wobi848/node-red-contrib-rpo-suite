module.exports = function(RED) {
    function SensorCheckNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var _min = parseFloat(config.min);
        var _max = parseFloat(config.max);
        var _fb  = parseFloat(config.fallback);
        var _hy  = parseFloat(config.hysteresis);
        node.min         = isNaN(_min) ? -50  : _min;
        node.max         = isNaN(_max) ? 150  : _max;
        node.fallback    = isNaN(_fb)  ? 0    : _fb;
        node.useFallback = config.useFallback !== false;
        var _to = parseFloat(config.timeout);
        node.timeout     = isNaN(_to) ? 0 : _to;
        node.hysteresis  = isNaN(_hy)  ? 0    : _hy;

        node.fault       = false;
        node.faultType   = null;
        node.timeoutTimer = null;

        updateStatus(node);
        if (node.timeout > 0) startTimeout(node);

        node.on('input', function(msg) {
            if (msg.acknowledge === true) {
                node.fault     = false;
                node.faultType = null;
                updateStatus(node);
                return;
            }

            // Reset timeout timer
            if (node.timeout > 0) {
                if (node.timeoutTimer) clearTimeout(node.timeoutTimer);
                startTimeout(node);
            }

            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); return; }

            var outOfRange = false;
            if (node.fault && node.faultType === 'outOfRange') {
                // Hysteresis: need to re-enter range by hysteresis amount to clear fault
                outOfRange = val < (node.min + node.hysteresis) || val > (node.max - node.hysteresis);
            } else {
                outOfRange = val < node.min || val > node.max;
            }

            if (outOfRange) {
                node.fault     = true;
                node.faultType = 'outOfRange';
            } else {
                node.fault     = false;
                node.faultType = null;
            }

            sendOutputs(node, msg, val);
        });

        node.on('close', function() {
            if (node.timeoutTimer) clearTimeout(node.timeoutTimer);
        });

        function startTimeout(n) {
            n.timeoutTimer = setTimeout(function() {
                n.fault     = true;
                n.faultType = 'timeout';
                var alarmMsg = {
                    payload:     n.useFallback ? n.fallback : null,
                    sensorCheck: buildInfo(n, null)
                };
                updateStatus(n);
                n.send([
                    n.useFallback ? { payload: n.fallback } : null,
                    { payload: true, sensorCheck: buildInfo(n, null) }
                ]);
            }, n.timeout * 1000);
        }

        function sendOutputs(n, msg, val) {
            var out1, out2;

            if (n.fault) {
                out1 = n.useFallback ? Object.assign({}, msg, { payload: n.fallback }) : null;
            } else {
                out1 = Object.assign({}, msg, { payload: val });
            }

            out2 = {
                payload:     n.fault,
                sensorCheck: buildInfo(n, val)
            };

            updateStatus(n);
            n.send([out1, out2]);
        }

        function buildInfo(n, val) {
            return {
                value:     val,
                fallback:  n.fallback,
                fault:     n.fault,
                faultType: n.faultType,
                min:       n.min,
                max:       n.max,
                timeout:   n.timeout
            };
        }

        function updateStatus(n) {
            if (n.fault) {
                if (n.faultType === 'timeout') {
                    n.status({ fill: 'red', shape: 'dot', text: 'Timeout fault' });
                } else {
                    n.status({ fill: 'red', shape: 'dot', text: 'Out of range → fallback: ' + n.fallback });
                }
            } else {
                n.status({ fill: 'green', shape: 'dot', text: 'OK' });
            }
        }
    }

    RED.nodes.registerType('sensor-check', SensorCheckNode);
};
