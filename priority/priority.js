module.exports = function(RED) {
    function PriorityNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var raw = config.topics;
        if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch(e) { raw = []; } }
        if (!Array.isArray(raw)) raw = [];

        node.topicDefs = raw.map(function(t) {
            return {
                topic:     t.topic || '',
                label:     t.label || t.topic || '',
                priority:  parseInt(t.priority, 10) || 1,
                nullValue: t.nullValue !== undefined ? t.nullValue : null
            };
        });

        node.defaultValue = config.defaultValue !== undefined ? config.defaultValue : null;
        node.values = {};

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting...' });

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.values = {};
                node.status({ fill: 'grey', shape: 'ring', text: 'Reset' });
                return;
            }

            var topic = msg.topic;
            var def = node.topicDefs.find(function(d) { return d.topic === topic; });
            if (!def) { node.warn('Unknown topic: ' + topic); return; }

            node.values[topic] = msg.payload;

            // Find active inputs
            var active = node.topicDefs.filter(function(d) {
                var val = node.values[d.topic];
                return val !== undefined && val !== null && val !== d.nullValue;
            });

            active.sort(function(a, b) { return a.priority - b.priority; });

            var winner = active.length > 0 ? active[0] : null;
            var outputVal = winner ? node.values[winner.topic] : node.defaultValue;

            var inputs = {};
            node.topicDefs.forEach(function(d) {
                var val = node.values[d.topic];
                inputs[d.topic] = {
                    value:    val !== undefined ? val : null,
                    priority: d.priority,
                    label:    d.label,
                    active:   val !== undefined && val !== null && val !== d.nullValue
                };
            });

            var info = {
                winner:         winner ? winner.topic : null,
                winnerPriority: winner ? winner.priority : null,
                value:          outputVal,
                inputs:         inputs
            };

            var out = RED.util.cloneMessage(msg);
            out.payload  = outputVal;
            out.priority = info;
            node.send(out);

            if (winner) {
                node.status({ fill: 'green', shape: 'dot', text: winner.label + '(P' + winner.priority + '): ' + outputVal });
            } else {
                node.status({ fill: 'grey', shape: 'dot', text: 'No active input → ' + outputVal });
            }
        });
    }

    RED.nodes.registerType('priority', PriorityNode);
};
