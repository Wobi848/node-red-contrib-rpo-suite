module.exports = function(RED) {
    function AdderNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.mode      = config.mode      || 'sum';
        node.minTopics = parseInt(config.minTopics, 10) || 1;

        if (Array.isArray(config.topics)) {
            node.topics = config.topics;
        } else if (typeof config.topics === 'string') {
            try {
                node.topics = JSON.parse(config.topics);
            } catch(e) {
                node.topics = config.topics.split(',').map(function(t) {
                    var parts = t.trim().split(':');
                    return { topic:parts[0].trim(), label:parts[0].trim(), weight:parseFloat(parts[1])||1 };
                });
            }
        } else {
            node.topics = [{ topic:'a', label:'A', weight:1 }, { topic:'b', label:'B', weight:1 }];
        }
        node.decimals  = parseInt(config.decimals,  10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 2;

        // Build lookup map
        node.topicMap = {};
        node.topics.forEach(function(t) { node.topicMap[t.topic] = t; });

        node.state = {};
        updateStatus(node);

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.state = {};
                updateStatus(node);
                return;
            }

            var topic = (msg.topic !== undefined) ? String(msg.topic) : '';
            if (!(topic in node.topicMap)) {
                node.warn('Unknown topic: ' + topic);
                return;
            }
            var val = parseFloat(msg.payload);
            if (isNaN(val)) { node.warn('Input is not a number: ' + msg.payload); return; }

            node.state[topic] = val;

            var knownCount = Object.keys(node.state).length;
            if (knownCount < node.minTopics) {
                node.status({ fill:'grey', shape:'ring', text:'Waiting (' + knownCount + '/' + node.minTopics + ' topics)' });
                return;
            }

            var weightedSum = 0, totalWeight = 0;
            var inputs = {}, weights = {};
            node.topics.forEach(function(t) {
                if (t.topic in node.state) {
                    var w = parseFloat(t.weight) || 1;
                    weightedSum  += node.state[t.topic] * w;
                    totalWeight  += w;
                    inputs[t.topic]  = node.state[t.topic];
                    weights[t.topic] = w;
                }
            });

            var result = node.mode === 'average' ? weightedSum / totalWeight : weightedSum;
            result = parseFloat(result.toFixed(node.decimals));

            msg.payload = result;
            msg.adder   = { mode:node.mode, result:result, count:knownCount, inputs:inputs, weights:weights, decimals:node.decimals };

            node.status({ fill:'green', shape:'dot', text:node.mode + ': ' + result + ' (' + knownCount + ' inputs)' });
            node.send(msg);
        });

        function updateStatus(n) {
            var k = Object.keys(n.state).length;
            if (k === 0) { n.status({ fill:'grey', shape:'ring', text:'Waiting for inputs...' }); }
        }
    }

    RED.nodes.registerType('adder', AdderNode);
};
