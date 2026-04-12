module.exports = function(RED) {
    function SrLatchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.outputMode = config.outputMode || "change";
        this.initialState = config.initialState;

        // Set initial state
        if (this.initialState === "true") {
            this.state = true;
        } else if (this.initialState === "false") {
            this.state = false;
        } else {
            this.state = false; // Default to false
        }

        // Show initial status
        updateStatus(node);

        node.on('input', function(msg, send, done) {
            var action = null;
            var previousState = node.state;

            // Determine action from topic or payload
            var topic = (msg.topic || "").toLowerCase().trim();
            var payload = msg.payload;

            // Check topic first
            if (topic === "set" || topic === "s") {
                action = "set";
            } else if (topic === "reset" || topic === "r") {
                action = "reset";
            } else if (topic === "toggle" || topic === "t") {
                action = "toggle";
            }
            // If no topic action, check payload
            else if (typeof payload === "string") {
                var p = payload.toLowerCase().trim();
                if (p === "set" || p === "s" || p === "1" || p === "true" || p === "on") {
                    action = "set";
                } else if (p === "reset" || p === "r" || p === "0" || p === "false" || p === "off") {
                    action = "reset";
                } else if (p === "toggle" || p === "t") {
                    action = "toggle";
                }
            }
            // Boolean or number payload
            else if (typeof payload === "boolean") {
                action = payload ? "set" : "reset";
            } else if (payload === 1) {
                action = "set";
            } else if (payload === 0) {
                action = "reset";
            }

            // If no valid action found
            if (!action) {
                node.error("Invalid input. Use topic or payload: set/reset/toggle, true/false, 1/0", msg);
                node.status({ fill: "red", shape: "ring", text: "Invalid input" });
                if (done) done();
                return;
            }

            // Execute action
            if (action === "set") {
                node.state = true;
            } else if (action === "reset") {
                node.state = false;
            } else if (action === "toggle") {
                node.state = !node.state;
            }

            // Update status
            updateStatus(node);

            // Determine if we should send output
            var stateChanged = (previousState !== node.state);
            var shouldSend = (node.outputMode === "always") || stateChanged;

            if (shouldSend) {
                msg.payload = node.state;
                msg.action = action;
                msg.previousState = previousState;
                send(msg);
            }

            if (done) done();
        });
    }

    function updateStatus(node) {
        var stateText = node.state ? "SET (ON)" : "RESET (OFF)";
        var fill = node.state ? "green" : "blue";
        node.status({ fill: fill, shape: "dot", text: stateText });
    }

    RED.nodes.registerType("sr-latch", SrLatchNode);
}
