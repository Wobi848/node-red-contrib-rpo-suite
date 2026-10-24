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
        node.cycleStart = null;
        node.status({ fill:'grey', shape:'dot', text:'OFF 0%' });
        scheduleCycle(node);

        node.on('input', function(msg, send, done) {
            if (msg.clearBypass === true) { node.bypass = null; scheduleCycle(node); done(); return; }
            if (msg.bypass !== undefined) {
                node.bypass = (msg.bypass === true || msg.bypass === 'true') ? true : false;
                updateStatus(node);
                scheduleCycle(node);
                done();
                return;
            }
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); done(); return; }
            node.input = Math.max(0, Math.min(100, val));
            scheduleCycle(node);
            done();
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });

        // Sets the output for the current position in the running cycle and schedules the next
        // switch. A new input does not restart the cycle; otherwise frequent inputs would keep
        // the output in the ON phase forever.
        function scheduleCycle(n) {
            if (n.timer) clearTimeout(n.timer);
            var now = Date.now();
            if (n.cycleStart === null || now - n.cycleStart >= n.period) n.cycleStart = now;
            var elapsed = now - n.cycleStart;
            var onTime  = (n.input / 100) * n.period;
            var offTime = n.period - onTime;
            var state, next;
            if (n.bypass !== null) {
                state = n.bypass;
                next  = n.cycleStart + n.period;
            } else if (elapsed < onTime) {
                state = true;
                next  = n.cycleStart + onTime;
            } else {
                state = false;
                next  = n.cycleStart + n.period;
            }
            setOutput(n, state, onTime, offTime);
            n.timer = setTimeout(function() { scheduleCycle(n); }, Math.max(0, next - now));
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
