module.exports = function(RED) {
    function PWMNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var pRaw   = parseFloat(config.period) || 10;
        var pUnit  = config.periodUnit || 's';
        node.period = pUnit === 'min' ? pRaw * 60000 : pUnit === 'ms' ? pRaw : pRaw * 1000;
        node.invert = config.invert === true;
        node.input  = 0;
        node.bypass = null;
        node.output = false;
        node.timer  = null;

        node.status({ fill:'grey', shape:'dot', text:'OFF 0%' });
        scheduleCycle(node);

        node.on('input', function(msg) {
            if (msg.clearBypass === true) { node.bypass = null; return; }
            if (msg.bypass !== undefined) {
                node.bypass = (msg.bypass === true || msg.bypass === 'true') ? true : false;
                updateStatus(node);
                return;
            }
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); return; }
            node.input = Math.max(0, Math.min(100, val));
            if (node.timer) clearTimeout(node.timer);
            scheduleCycle(node);
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });

        function scheduleCycle(n) {
            var pct     = n.input / 100;
            var onTime  = pct * n.period;
            var offTime = n.period - onTime;
            var bypass  = n.bypass;

            if (bypass !== null) {
                setOutput(n, bypass, onTime, offTime);
                n.timer = setTimeout(function() { scheduleCycle(n); }, n.period);
                return;
            }

            if (pct <= 0) {
                setOutput(n, false, onTime, offTime);
                n.timer = setTimeout(function() { scheduleCycle(n); }, n.period);
            } else if (pct >= 1) {
                setOutput(n, true, onTime, offTime);
                n.timer = setTimeout(function() { scheduleCycle(n); }, n.period);
            } else {
                setOutput(n, true, onTime, offTime);
                n.timer = setTimeout(function() {
                    setOutput(n, false, onTime, offTime);
                    n.timer = setTimeout(function() { scheduleCycle(n); }, offTime);
                }, onTime);
            }
        }

        function setOutput(n, rawState, onTime, offTime) {
            var state = n.invert ? !rawState : rawState;
            if (state === n.output) return;
            n.output = state;
            var msg = {
                payload: state ? 1 : 0,
                pwm: {
                    input:    n.input,
                    output:   state,
                    dutyOn:   Math.round(onTime),
                    dutyOff:  Math.round(offTime),
                    period:   n.period,
                    bypass:   n.bypass !== null ? n.bypass : false,
                    inverted: n.invert
                }
            };
            updateStatus(n);
            n.send(msg);
        }

        function updateStatus(n) {
            if (n.bypass !== null) {
                n.status({ fill:'yellow', shape:'dot', text:'BYPASS ' + (n.bypass ? 'ON' : 'OFF') });
            } else if (n.output) {
                n.status({ fill:'green', shape:'dot', text:'ON ' + n.input + '%' });
            } else {
                n.status({ fill:'grey',  shape:'dot', text:'OFF ' + n.input + '%' });
            }
        }
    }

    RED.nodes.registerType('pwm', PWMNode);
};
