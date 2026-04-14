module.exports = function(RED) {
    function WatchdogNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var timeoutVal  = parseInt(config.timeout, 10) || 60;
        var unit        = config.timeoutUnit || 's';
        var startAlarm  = config.startAlarm === true;
        var multipliers = { 'ms': 1, 's': 1000, 'min': 60000, 'h': 3600000 };
        node.timeoutMs  = timeoutVal * (multipliers[unit] || 1000);

        node.alarming    = false;
        node.lastMessage = null;
        node.timer       = null;

        function updateStatus() {
            if (!node.lastMessage) {
                node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for first message...' });
            } else if (node.alarming) {
                var elapsed = ((Date.now() - node.lastMessage) / 1000).toFixed(0);
                node.status({ fill: 'red', shape: 'dot', text: 'ALARM (' + elapsed + 's without message)' });
            } else {
                var ago = ((Date.now() - node.lastMessage) / 1000).toFixed(0);
                node.status({ fill: 'green', shape: 'dot', text: 'OK (last: ' + ago + 's ago)' });
            }
        }

        function triggerAlarm() {
            if (!node.alarming) {
                node.alarming = true;
                var elapsed = node.lastMessage ? (Date.now() - node.lastMessage) / 1000 : null;
                node.send([null, {
                    payload: true,
                    watchdog: {
                        alarm:       true,
                        timeout:     timeoutVal,
                        lastMessage: node.lastMessage ? new Date(node.lastMessage).toISOString() : null,
                        elapsed:     elapsed
                    }
                }]);
                updateStatus();
            }
        }

        function resetTimer() {
            if (node.timer) clearTimeout(node.timer);
            node.timer = setTimeout(triggerAlarm, node.timeoutMs);
        }

        if (startAlarm) resetTimer();
        updateStatus();

        node.on('input', function(msg) {
            if (msg.reset === true) {
                resetTimer();
                return;
            }

            var wasAlarming  = node.alarming;
            node.lastMessage = Date.now();
            node.alarming    = false;
            resetTimer();

            node.send([msg, wasAlarming ? {
                payload: false,
                watchdog: {
                    alarm:       false,
                    timeout:     timeoutVal,
                    lastMessage: new Date(node.lastMessage).toISOString(),
                    elapsed:     0
                }
            } : null]);

            updateStatus();
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('watchdog', WatchdogNode);
};
