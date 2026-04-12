module.exports = function(RED) {
    function EdgeFilterNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var wRaw    = parseFloat(config.window) || 5;
        var wUnit   = config.windowUnit || 's';
        node.window = wUnit === 'min' ? wRaw * 60000 : wUnit === 'ms' ? wRaw : wRaw * 1000;
        node.mode   = config.mode || 'time';

        node.blocked   = false;
        node.timer     = null;
        node.lastValue = undefined;

        node.status({ fill:'green', shape:'dot', text:'Ready (window: ' + wRaw + wUnit + ')' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.blocked = false;
                if (node.timer) { clearTimeout(node.timer); node.timer = null; }
                node.lastValue = undefined;
                node.status({ fill:'green', shape:'dot', text:'Ready (reset)' });
                return;
            }

            if (node.mode === 'changed') {
                var cur = msg.payload;
                var changed = (node.lastValue === undefined) ||
                    (typeof cur === 'object' ? JSON.stringify(cur) !== JSON.stringify(node.lastValue) : cur !== node.lastValue);
                if (!changed) {
                    node.status({ fill:'grey', shape:'dot', text:'Blocked (no change)' });
                    return;
                }
                node.lastValue = cur;
            }

            if (node.blocked) {
                node.status({ fill:'red', shape:'dot', text:'Blocked (window active)' });
                return;
            }

            node.blocked = true;
            node.status({ fill:'green', shape:'dot', text:'Forwarded (window: ' + wRaw + wUnit + ')' });
            node.send(msg);

            node.timer = setTimeout(function() {
                node.blocked = false;
                node.status({ fill:'green', shape:'dot', text:'Ready (window: ' + wRaw + wUnit + ')' });
            }, node.window);
        });

        node.on('close', function() {
            if (node.timer) clearTimeout(node.timer);
        });
    }

    RED.nodes.registerType('edge-filter', EdgeFilterNode);
};
