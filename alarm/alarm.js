module.exports = function(RED) {
    // Alarm states (see help text):
    // normal → active_unacked → active_acked / cleared_unacked → normal; inhibited while suppressed
    var STATUS = {
        normal:          { fill: 'green',  shape: 'dot',  text: 'OK' },
        active_unacked:  { fill: 'red',    shape: 'dot',  text: 'ALARM (not acknowledged)' },
        active_acked:    { fill: 'red',    shape: 'ring', text: 'ALARM (acknowledged)' },
        cleared_unacked: { fill: 'yellow', shape: 'dot',  text: 'Cleared (not acknowledged)' },
        inhibited:       { fill: 'grey',   shape: 'ring', text: 'Inhibited' }
    };

    function toBoolean(val) {
        if (val === false || val === 0 || val === "" ||
            val === null || val === undefined || Number.isNaN(val)) {
            return false;
        }
        if (typeof val === "string") {
            var lower = val.toLowerCase().trim();
            if (lower === "false" || lower === "0" || lower === "off") {
                return false;
            }
        }
        return true;
    }

    // Number from config; keeps an explicit 0 (unlike `parseFloat(x) || fallback`)
    function configNumber(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) || n < 0 ? fallback : n;
    }

    function RpoAlarmNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.topicAlarm   = config.topicAlarm   || 'alarm';
        node.topicAck     = config.topicAck     || 'ack';
        node.topicInhibit = config.topicInhibit || 'inhibit';
        node.delayOn      = configNumber(config.delayOn, 0) * 1000;
        node.delayOff     = configNumber(config.delayOff, 0) * 1000;
        node.ackRequired  = config.ackRequired !== false;
        node.persistent   = config.persistent !== false;

        var ctx = node.context();
        var stored = node.persistent ? ctx.get('alarm') : undefined;
        // condition = delayed fault condition, raw = last received fault input
        var s = Object.assign({
            state: 'normal', condition: false, raw: false, inhibited: false,
            since: null, clearedAt: null, ackedAt: null, ackedBy: null, count: 0
        }, stored || {});
        var timer = null;

        function isActive() {
            return s.state === 'active_unacked' || s.state === 'active_acked' || s.state === 'cleared_unacked';
        }

        function info() {
            return {
                name: node.name || '', state: s.state, active: isActive(),
                acked: s.state === 'active_acked' || s.state === 'normal',
                condition: s.condition, inhibited: s.inhibited,
                since: s.since, clearedAt: s.clearedAt, ackedAt: s.ackedAt, ackedBy: s.ackedBy, count: s.count
            };
        }

        function showStatus() {
            var st = STATUS[s.state];
            var text = st.text + (s.count ? ' · ' + s.count + 'x' : '');
            node.status({ fill: st.fill, shape: st.shape, text: text });
        }

        // Applies a new state; sends output 2 on every state change, output 1 when "active" changes
        function setState(newState, send) {
            if (newState === s.state) return;
            var wasActive = isActive();
            s.state = newState;
            if (node.persistent) ctx.set('alarm', s);
            showStatus();
            var data = info();
            var out1 = wasActive !== data.active ? { payload: data.active, alarm: data } : null;
            (send || node.send.bind(node))([out1, { payload: data, alarm: data }]);
        }

        // The (delayed) fault condition changed
        function conditionChanged(cond, send) {
            s.condition = cond;
            var now = new Date().toISOString();
            if (cond) {
                s.count++;
                s.since = now;
                s.clearedAt = null;
                s.ackedAt = null;
                s.ackedBy = null;
                setState(node.ackRequired ? 'active_unacked' : 'active_acked', send);
            } else {
                s.clearedAt = now;
                if (s.state === 'active_acked') setState('normal', send);
                else if (s.state === 'active_unacked') setState('cleared_unacked', send);
            }
            if (node.persistent) ctx.set('alarm', s);
        }

        // Effective fault = raw input, unless inhibited; on/off delays apply
        function evaluate(send) {
            var want = s.raw && !s.inhibited;
            if (timer) { clearTimeout(timer); timer = null; }
            if (want === s.condition) return;
            var delay = want ? node.delayOn : node.delayOff;
            if (delay <= 0) {
                conditionChanged(want, send);
                return;
            }
            timer = setTimeout(function() {
                timer = null;
                conditionChanged(want);
            }, delay);
        }

        showStatus();

        node.on('input', function(msg, send, done) {
            if (msg.reset === true) {
                if (timer) { clearTimeout(timer); timer = null; }
                s.condition = false;
                s.raw = false;
                s.inhibited = false;
                setState('normal', send);
                if (node.persistent) ctx.set('alarm', s);
                done();
                return;
            }

            var topic = msg.topic !== undefined ? String(msg.topic) : '';
            if (topic === node.topicAlarm) {
                s.raw = toBoolean(msg.payload);
                evaluate(send);
            } else if (topic === node.topicAck) {
                var now = new Date().toISOString();
                if (s.state === 'active_unacked' || s.state === 'cleared_unacked') {
                    s.ackedAt = now;
                    s.ackedBy = msg.user !== undefined ? String(msg.user) : null;
                    setState(s.state === 'active_unacked' ? 'active_acked' : 'normal', send);
                }
            } else if (topic === node.topicInhibit) {
                s.inhibited = toBoolean(msg.payload);
                if (s.inhibited) {
                    // Suppressed: the alarm is not shown, a latched alarm is dropped
                    if (timer) { clearTimeout(timer); timer = null; }
                    s.condition = false;
                    setState('inhibited', send);
                } else {
                    setState('normal', send);
                    evaluate(send);
                }
            } else {
                node.warn('Unknown topic "' + topic + '" (expected "' + node.topicAlarm + '", "' +
                          node.topicAck + '" or "' + node.topicInhibit + '")');
            }
            if (node.persistent) ctx.set('alarm', s);
            done();
        });

        node.on('close', function() {
            if (timer) clearTimeout(timer);
        });
    }

    RED.nodes.registerType('rpo-alarm', RpoAlarmNode);
};
