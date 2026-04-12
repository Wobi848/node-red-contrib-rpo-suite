module.exports = function(RED) {
    function DebounceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.debounceTime = parseInt(config.debounceTime, 10) || 200;
        node.mode         = config.mode || 'trailing';
        node.timer        = null;
        node.inCooldown   = false;
        node.pendingMsg   = null;

        node.status({ fill:'grey', shape:'dot', text:'Ready (' + node.debounceTime + 'ms)' });

        node.on('input', function(msg) {
            var debounceTime = msg.debounceTime !== undefined ? parseInt(msg.debounceTime, 10) : node.debounceTime;

            if (msg.flush === true) {
                if (node.pendingMsg) {
                    clearTimeout(node.timer);
                    node.timer      = null;
                    node.pendingMsg = null;
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (flush)' });
                    node.send(msg);
                }
                return;
            }

            node.pendingMsg = msg;

            if (node.mode === 'trailing') {
                clearTimeout(node.timer);
                node.timer = setTimeout(function() {
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (' + debounceTime + 'ms)' });
                    node.send(node.pendingMsg);
                    node.pendingMsg = null;
                }, debounceTime);

            } else if (node.mode === 'leading') {
                if (!node.inCooldown) {
                    node.inCooldown = true;
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (leading)' });
                    node.send(msg);
                    node.timer = setTimeout(function() {
                        node.inCooldown = false;
                        node.status({ fill:'grey', shape:'dot', text:'Ready (' + debounceTime + 'ms)' });
                    }, debounceTime);
                } else {
                    node.status({ fill:'grey', shape:'ring', text:'Debouncing...' });
                }

            } else if (node.mode === 'both') {
                if (!node.inCooldown) {
                    node.inCooldown = true;
                    node.send(msg);
                }
                clearTimeout(node.timer);
                node.timer = setTimeout(function() {
                    node.inCooldown = false;
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (both)' });
                    node.send(node.pendingMsg);
                    node.pendingMsg = null;
                }, debounceTime);
            }
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('debounce', DebounceNode);
};
