module.exports = function(RED) {
    function WeeklyScheduleNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.schedule  = config.schedule  || [];
        node.onValue   = config.onValue  !== undefined ? config.onValue  : true;
        node.offValue  = config.offValue !== undefined ? config.offValue : false;
        node.timezone  = config.timezone  || '';

        node.override  = null; // null = no override, true = forced on, false = forced off
        node.lastState = null;

        updateStatus(node);

        // Periodic check every 10 seconds for Output 2 (state change)
        node.timer = setInterval(function() {
            var active   = isActive(node);
            var current  = (node.override !== null) ? node.override : active;

            if (current !== node.lastState) {
                node.lastState = current;
                var changeMsg  = buildMsg(node, active, current);
                updateStatus(node);
                node.send([null, changeMsg]);
            }
        }, 10000);

        node.on('input', function(msg) {
            if (msg.override !== undefined) {
                node.override = (msg.override === true || msg.override === 'true') ? true : false;
            }
            if (msg.clearOverride === true) {
                node.override = null;
            }

            var active  = isActive(node);
            var current = (node.override !== null) ? node.override : active;

            if (current !== node.lastState) {
                node.lastState = current;
                node.send([buildMsg(node, active, current), buildMsg(node, active, current)]);
            } else {
                node.send([buildMsg(node, active, current), null]);
            }

            updateStatus(node);
        });

        node.on('close', function() {
            clearInterval(node.timer);
        });

        function isActive(n) {
            var now  = new Date();
            var day  = now.getDay();                   // 0=Sun, 6=Sat
            var hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());

            for (var i = 0; i < n.schedule.length; i++) {
                var entry = n.schedule[i];
                if (parseInt(entry.day, 10) !== day) continue;
                var from = entry.from || '00:00';
                var to   = entry.to   || '24:00';
                if (to === '24:00') to = '23:59';

                if (from <= to) {
                    if (hhmm >= from && hhmm <= to) return true;
                } else {
                    // midnight crossing
                    if (hhmm >= from || hhmm <= to) return true;
                }
            }
            return false;
        }

        function buildMsg(n, active, current) {
            var now     = new Date();
            var hhmm    = pad(now.getHours()) + ':' + pad(now.getMinutes());
            var payload = current ? n.onValue : n.offValue;
            return {
                payload:  payload,
                schedule: {
                    active:   active,
                    day:      now.getDay(),
                    time:     hhmm,
                    override: n.override !== null ? n.override : false
                }
            };
        }

        function updateStatus(n) {
            var active  = isActive(n);
            var current = (n.override !== null) ? n.override : active;
            if (n.override !== null) {
                n.status({ fill: 'yellow', shape: 'dot', text: 'OVERRIDE ' + (n.override ? 'ON' : 'OFF') });
            } else if (current) {
                n.status({ fill: 'green', shape: 'dot', text: 'ACTIVE' });
            } else {
                n.status({ fill: 'grey', shape: 'dot', text: 'INACTIVE' });
            }
        }

        function pad(n) { return n < 10 ? '0' + n : String(n); }
    }

    RED.nodes.registerType('weekly-schedule', WeeklyScheduleNode);
};
