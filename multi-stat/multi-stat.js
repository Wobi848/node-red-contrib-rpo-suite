module.exports = function(RED) {
    function MultiStatNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.decimals = parseInt(config.decimals) || 2;
        this.minTopics = parseInt(config.minTopics) || 1;
        this.state = {};

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            // Handle reset
            if (msg.reset === true) {
                node.state = {};
                updateStatus(node);
                if (done) done();
                return;
            }

            // Check for topic
            if (!msg.topic || msg.topic === "") {
                node.warn("msg.topic is required");
                if (done) done();
                return;
            }

            // Handle remove
            if (msg.remove === true) {
                delete node.state[msg.topic];
                if (Object.keys(node.state).length >= node.minTopics) {
                    sendStats(node, msg, send);
                }
                updateStatus(node);
                if (done) done();
                return;
            }

            // Check for valid number
            var value = parseFloat(msg.payload);
            if (isNaN(value)) {
                node.warn("msg.payload must be a number");
                if (done) done();
                return;
            }

            // Update state
            node.state[msg.topic] = value;

            // Check minTopics
            var topicCount = Object.keys(node.state).length;
            if (topicCount >= node.minTopics) {
                sendStats(node, msg, send);
            }

            updateStatus(node);
            if (done) done();
        });

        node.on('close', function() {
            node.state = {};
        });
    }

    function sendStats(node, msg, send) {
        var values = node.state;
        var keys = Object.keys(values);
        var count = keys.length;

        if (count === 0) {
            return;
        }

        var nums = keys.map(function(k) { return values[k]; });
        var min = Math.min.apply(null, nums);
        var max = Math.max.apply(null, nums);
        var sum = nums.reduce(function(a, b) { return a + b; }, 0);
        var avg = sum / count;

        var factor = Math.pow(10, node.decimals);
        min = Math.round(min * factor) / factor;
        max = Math.round(max * factor) / factor;
        avg = Math.round(avg * factor) / factor;

        msg.payload = {
            min: min,
            max: max,
            avg: avg,
            count: count,
            values: Object.assign({}, values)
        };

        send(msg);
    }

    function updateStatus(node) {
        var count = Object.keys(node.state).length;

        if (count === 0) {
            node.status({ fill: "grey", shape: "ring", text: "Idle" });
        } else if (count < node.minTopics) {
            node.status({ fill: "yellow", shape: "ring", text: "Waiting (" + count + "/" + node.minTopics + " Topics)" });
        } else {
            var nums = Object.values(node.state);
            var min = Math.min.apply(null, nums);
            var max = Math.max.apply(null, nums);
            var avg = nums.reduce(function(a, b) { return a + b; }, 0) / nums.length;

            var factor = Math.pow(10, node.decimals);
            min = Math.round(min * factor) / factor;
            max = Math.round(max * factor) / factor;
            avg = Math.round(avg * factor) / factor;

            node.status({
                fill: "green",
                shape: "dot",
                text: count + " Topics | Min " + min + " Max " + max + " Avg " + avg
            });
        }
    }

    RED.nodes.registerType("multi-stat", MultiStatNode);
}
