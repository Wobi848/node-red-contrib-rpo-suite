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

        node.on('input', function(msg, send, done) {
            var debounceTime = msg.debounceTime !== undefined ? parseInt(msg.debounceTime, 10) : node.debounceTime;

            if (msg.flush === true) {
                if (node.pendingMsg) {
                    var pending = node.pendingMsg;
                    clearTimeout(node.timer);
                    node.timer      = null;
                    node.pendingMsg = null;
                    node.inCooldown = false;
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (flush)' });
                    send(pending);
                }
                done();
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
                    node.pendingMsg = null; // forwarded now; flush only sends a blocked message
                    node.status({ fill:'green', shape:'dot', text:'Forwarded (leading)' });
                    send(msg);
                    node.timer = setTimeout(function() {
                        node.inCooldown = false;
                        node.status({ fill:'grey', shape:'dot', text:'Ready (' + debounceTime + 'ms)' });
                    }, debounceTime);
                } else {
                    node.status({ fill:'grey', shape:'ring', text:'Debouncing...' });
                }

            } else if (node.mode === 'both') {
                // Leading edge sends immediately; the trailing edge only sends messages that
                // arrived after it, so a single message is not sent twice
                if (!node.inCooldown) {
                    node.inCooldown = true;
                    node.pendingMsg = null;
                    send(msg);
                }
                clearTimeout(node.timer);
                node.timer = setTimeout(function() {
                    node.inCooldown = false;
                    if (node.pendingMsg) {
                        node.status({ fill:'green', shape:'dot', text:'Forwarded (both)' });
                        node.send(node.pendingMsg);
                        node.pendingMsg = null;
                    }
                }, debounceTime);
            }
            done();
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('debounce', DebounceNode);
};
