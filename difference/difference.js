module.exports = function(RED) {
    function DifferenceNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.topicA = config.topicA || "a";
        this.topicB = config.topicB || "b";
        this.absolute = config.absolute === true || config.absolute === "true";
        this.decimals = parseInt(config.decimals);
        if (isNaN(this.decimals) || this.decimals < 0) {
            this.decimals = 2;
        }
        if (this.decimals > 10) {
            this.decimals = 10;
        }

        this.valueA = null;
        this.valueB = null;

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            // Handle reset
            if (msg.reset === true) {
                node.valueA = null;
                node.valueB = null;
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

            // Check if topic matches A or B
            var isTopicA = msg.topic === node.topicA;
            var isTopicB = msg.topic === node.topicB;

            if (!isTopicA && !isTopicB) {
                node.warn("Topic '" + msg.topic + "' not configured (expected '" + node.topicA + "' or '" + node.topicB + "')");
                if (done) done();
                return;
            }

            // Validate payload is numeric
            var value = parseFloat(msg.payload);
            if (isNaN(value)) {
                node.warn("Payload is not a valid number: " + msg.payload);
                if (done) done();
                return;
            }

            // Store value
            if (isTopicA) {
                node.valueA = value;
            } else {
                node.valueB = value;
            }

            // Check if we have both values
            if (node.valueA !== null && node.valueB !== null) {
                var result = node.valueA - node.valueB;

                if (node.absolute) {
                    result = Math.abs(result);
                }

                // Round to decimals
                result = parseFloat(result.toFixed(node.decimals));

                msg.payload = result;
                msg.inputs = {
                    a: { topic: node.topicA, value: node.valueA },
                    b: { topic: node.topicB, value: node.valueB },
                    result: result,
                    absolute: node.absolute
                };

                send(msg);
            }

            updateStatus(node);
            if (done) done();
        });

        node.on('close', function() {
            node.valueA = null;
            node.valueB = null;
        });
    }

    function updateStatus(node) {
        if (node.valueA === null && node.valueB === null) {
            node.status({ fill: "yellow", shape: "ring", text: "Waiting for " + node.topicA + " and " + node.topicB + "..." });
        } else if (node.valueA === null) {
            node.status({ fill: "yellow", shape: "ring", text: "Waiting for " + node.topicA + "..." });
        } else if (node.valueB === null) {
            node.status({ fill: "yellow", shape: "ring", text: "Waiting for " + node.topicB + "..." });
        } else {
            var result = node.valueA - node.valueB;
            if (node.absolute) {
                result = Math.abs(result);
            }
            result = parseFloat(result.toFixed(node.decimals));
            node.status({
                fill: "green",
                shape: "dot",
                text: node.topicA + "(" + node.valueA + ") - " + node.topicB + "(" + node.valueB + ") = " + result
            });
        }
    }

    RED.nodes.registerType("difference", DifferenceNode);
}
