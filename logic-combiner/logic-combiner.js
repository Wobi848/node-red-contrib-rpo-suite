module.exports = function(RED) {
    function LogicCombinerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.topics = config.topics || [];
        this.minTopics = parseInt(config.minTopics) || this.topics.length;
        this.initialValue = config.initialValue;
        this.state = {};
        this.rawState = {}; // Store raw values before inversion
        this.topicOrder = []; // Preserve order for calculation

        // Build topic lookup map
        this.topicMap = {};
        for (var i = 0; i < this.topics.length; i++) {
            var t = this.topics[i];
            this.topicOrder.push(t.topic);
            this.topicMap[t.topic] = {
                label: t.label || t.topic,
                invert: t.invert === true || t.invert === "true",
                operator: t.operator || "AND" // Default AND, first topic's operator is ignored
            };
        }

        // Initialize state with initialValue if set
        if (this.initialValue !== undefined && this.initialValue !== "") {
            var initVal = this.initialValue === "true" || this.initialValue === true;
            for (var topic in this.topicMap) {
                this.state[topic] = initVal;
            }
        }

        updateStatus(node);

        node.on('input', function(msg, send, done) {
            // Handle reset
            if (msg.reset === true) {
                node.state = {};
                node.rawState = {};
                if (node.initialValue !== undefined && node.initialValue !== "") {
                    var initVal = node.initialValue === "true" || node.initialValue === true;
                    for (var topic in node.topicMap) {
                        node.state[topic] = initVal;
                        node.rawState[topic] = initVal;
                    }
                }
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

            // Check if topic is configured
            var topicConfig = node.topicMap[msg.topic];
            if (!topicConfig) {
                node.warn("Topic '" + msg.topic + "' not configured");
                if (done) done();
                return;
            }

            // Convert to boolean
            var rawValue = toBoolean(msg.payload);
            node.rawState[msg.topic] = rawValue;

            // Apply inversion
            var value = rawValue;
            if (topicConfig.invert) {
                value = !value;
            }

            // Store value
            node.state[msg.topic] = value;

            // Check if we have enough topics
            var receivedCount = Object.keys(node.state).length;
            if (receivedCount >= node.minTopics) {
                // Calculate result and build states info
                var result = calculateResult(node);
                var states = buildStatesInfo(node);

                msg.payload = result;
                msg.states = states;
                send(msg);
            }

            updateStatus(node);
            if (done) done();
        });

        node.on('close', function() {
            node.state = {};
            node.rawState = {};
        });
    }

    function toBoolean(val) {
        if (val === false || val === 0 || val === "" ||
            val === null || val === undefined || Number.isNaN(val)) {
            return false;
        }
        if (typeof val === "string") {
            var lower = val.toLowerCase().trim();
            if (lower === "false" || lower === "0" || lower === "off") {
                return false;
            }
        }
        return true;
    }

    function calculateResult(node) {
        var result = null;

        for (var i = 0; i < node.topicOrder.length; i++) {
            var topic = node.topicOrder[i];
            if (node.state[topic] === undefined) {
                continue;
            }

            var value = node.state[topic];
            var config = node.topicMap[topic];

            if (result === null) {
                // First value
                result = value;
            } else {
                // Apply operator
                if (config.operator === "OR") {
                    result = result || value;
                } else {
                    // AND
                    result = result && value;
                }
            }
        }

        return result === null ? false : result;
    }

    function buildStatesInfo(node) {
        var states = {};
        for (var i = 0; i < node.topicOrder.length; i++) {
            var topic = node.topicOrder[i];
            var config = node.topicMap[topic];
            var raw = node.rawState[topic];
            var value = node.state[topic];

            states[topic] = {
                label: config.label,
                raw: raw !== undefined ? raw : null,
                inverted: config.invert,
                value: value !== undefined ? value : null,
                operator: i === 0 ? "START" : config.operator
            };
        }
        return states;
    }

    function updateStatus(node) {
        var totalTopics = Object.keys(node.topicMap).length;
        var receivedCount = Object.keys(node.state).length;

        if (totalTopics === 0) {
            node.status({ fill: "grey", shape: "ring", text: "No topics configured" });
            return;
        }

        if (receivedCount < node.minTopics) {
            node.status({
                fill: "yellow",
                shape: "ring",
                text: "Waiting (" + receivedCount + "/" + node.minTopics + " topics)"
            });
        } else {
            var result = calculateResult(node);
            node.status({
                fill: result ? "green" : "grey",
                shape: "dot",
                text: "→ " + result + " (" + receivedCount + "/" + totalTopics + " topics)"
            });
        }
    }

    RED.nodes.registerType("logic-combiner", LogicCombinerNode);
}
