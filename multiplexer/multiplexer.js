module.exports = function(RED) {
    function MultiplexerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.numChannels      = parseInt(config.channels, 10) || 8;
        node.selectedChannel  = parseInt(config.initialChannel, 10) || 0;
        node.channelValues    = {};

        updateStatus(node);

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.channelValues   = {};
                node.selectedChannel = parseInt(config.initialChannel, 10) || 0;
                updateStatus(node);
                return;
            }

            var topic = (msg.topic !== undefined) ? String(msg.topic) : '';

            if (topic === 'select') {
                var ch = parseInt(msg.payload, 10);
                if (isNaN(ch) || ch < 0 || ch >= node.numChannels) {
                    node.warn('Channel out of range: ' + msg.payload + ' (0–' + (node.numChannels - 1) + ')');
                    return;
                }
                node.selectedChannel = ch;
            } else if (/^ch[0-7]$/.test(topic)) {
                var idx = parseInt(topic.slice(2), 10);
                if (idx >= node.numChannels) {
                    node.warn('Channel ' + topic + ' out of range (configured: ' + node.numChannels + ')');
                    return;
                }
                node.channelValues[topic] = msg.payload;
            } else {
                node.warn('Unknown topic: ' + topic + ' (use "select" or "ch0"–"ch' + (node.numChannels - 1) + '")');
                return;
            }

            var selKey = 'ch' + node.selectedChannel;
            if (!(selKey in node.channelValues)) {
                node.status({ fill:'grey', shape:'ring', text:'CH' + node.selectedChannel + ' → (no value yet)' });
                return;
            }

            var val = node.channelValues[selKey];
            msg.payload      = val;
            msg.multiplexer  = {
                selectedChannel: node.selectedChannel,
                value:           val,
                channels:        Object.assign({}, node.channelValues)
            };
            node.status({ fill:'green', shape:'dot', text:'CH' + node.selectedChannel + ' → ' + val });
            node.send(msg);
        });

        function updateStatus(n) {
            var selKey = 'ch' + n.selectedChannel;
            if (selKey in n.channelValues) {
                n.status({ fill:'green', shape:'dot', text:'CH' + n.selectedChannel + ' → ' + n.channelValues[selKey] });
            } else {
                n.status({ fill:'grey', shape:'ring', text:'CH' + n.selectedChannel + ' → (no value yet)' });
            }
        }
    }

    RED.nodes.registerType('multiplexer', MultiplexerNode);
};
