module.exports = function(RED) {
    function OperatingHoursNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.serviceInterval = parseFloat(config.serviceInterval) || 1000;
        node.persistent       = config.persistent !== false;
        node.decimals         = parseInt(config.decimals, 10);
        if (isNaN(node.decimals)) node.decimals = 2;

        node.running         = false;
        node.accumulatedHours = 0;
        node.starts          = 0;
        node.serviceDue      = false;
        node.startTime       = null;
        node.lastStart       = null;
        node.lastStop        = null;

        if (node.persistent) {
            var saved = node.context().get('operatingHours');
            if (saved) {
                node.accumulatedHours = saved.accumulatedHours || 0;
                node.starts           = saved.starts || 0;
                node.serviceDue       = saved.serviceDue || false;
                node.lastStart        = saved.lastStart || null;
                node.lastStop         = saved.lastStop || null;
            }
        }

        function currentHours() {
            if (node.running && node.startTime) {
                return node.accumulatedHours + (Date.now() - node.startTime) / 3600000;
            }
            return node.accumulatedHours;
        }

        function saveState() {
            if (node.persistent) {
                node.context().set('operatingHours', {
                    accumulatedHours: currentHours(),
                    starts:           node.starts,
                    serviceDue:       node.serviceDue,
                    lastStart:        node.lastStart,
                    lastStop:         node.lastStop
                });
            }
        }

        function updateStatus() {
            var h = parseFloat(currentHours().toFixed(node.decimals));
            if (node.serviceDue) {
                node.status({ fill: 'yellow', shape: 'ring', text: 'SERVICE DUE ' + h + 'h' });
            } else if (node.running) {
                node.status({ fill: 'green', shape: 'dot', text: 'RUNNING ' + h + 'h (' + node.starts + ' starts)' });
            } else {
                node.status({ fill: 'grey', shape: 'dot', text: 'STOPPED ' + h + 'h (' + node.starts + ' starts)' });
            }
        }

        function sendOutput(msg) {
            var h         = currentHours();
            var hRounded  = parseFloat(h.toFixed(node.decimals));
            var remaining = parseFloat(Math.max(0, node.serviceInterval - h).toFixed(node.decimals));

            node.serviceDue = h >= node.serviceInterval;

            var info = {
                running:               node.running,
                runtimeHours:          hRounded,
                starts:                node.starts,
                serviceInterval:       node.serviceInterval,
                serviceHoursRemaining: remaining,
                serviceDue:            node.serviceDue,
                lastStart:             node.lastStart,
                lastStop:              node.lastStop
            };

            var msg1 = RED.util.cloneMessage(msg);
            msg1.payload        = info;
            msg1.operatingHours = info;

            var msg2 = node.serviceDue ? { payload: true, operatingHours: info } : null;

            node.send([msg1, msg2]);
            updateStatus();
            saveState();
        }

        updateStatus();

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.running          = false;
                node.accumulatedHours = 0;
                node.starts           = 0;
                node.serviceDue       = false;
                node.startTime        = null;
                node.lastStart        = null;
                node.lastStop         = null;
                saveState();
                sendOutput(msg);
                return;
            }

            if (msg.resetService === true) {
                node.serviceDue       = false;
                node.accumulatedHours = 0;
                if (node.running && node.startTime) node.startTime = Date.now();
                saveState();
                sendOutput(msg);
                return;
            }

            var isRunning = !!msg.payload;

            if (isRunning && !node.running) {
                node.running   = true;
                node.starts++;
                node.startTime = Date.now();
                node.lastStart = new Date(node.startTime).toISOString();
            } else if (!isRunning && node.running) {
                node.accumulatedHours += (Date.now() - node.startTime) / 3600000;
                node.running   = false;
                node.startTime = null;
                node.lastStop  = new Date().toISOString();
            }

            sendOutput(msg);
        });

        node.on('close', function() {
            if (node.running && node.startTime) {
                node.accumulatedHours += (Date.now() - node.startTime) / 3600000;
                node.running = false;
            }
            saveState();
        });
    }

    RED.nodes.registerType('operating-hours', OperatingHoursNode);
};
