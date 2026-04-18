module.exports = function(RED) {
    function HysteresisNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.setpoint = parseFloat(config.setpoint);
        this.hysteresis = parseFloat(config.hysteresis);
        this.mode = config.mode || "high";
        this.initialState = config.initialState;

        // Set initial state
        if (this.initialState === "true") {
            this.currentState = true;
        } else if (this.initialState === "false") {
            this.currentState = false;
        } else {
            this.currentState = undefined;
        }

        // Show initial status
        updateStatus(node, undefined, this.currentState);

        node.on('input', function(msg, send, done) {
            var value = msg.payload;

            // Validate input is a number
            if (typeof value !== 'number' || isNaN(value)) {
                node.error("Input is not a valid number: " + value, msg);
                node.status({ fill: "red", shape: "ring", text: "Invalid input" });
                if (done) done();
                return;
            }

            var previousState = node.currentState;

            // Hysteresis logic
            if (node.mode === "high") {
                // Mode HIGH: ON when >= setpoint, OFF when <= setpoint - hysteresis
                if (value >= node.setpoint) {
                    node.currentState = true;
                } else if (value <= node.setpoint - node.hysteresis) {
                    node.currentState = false;
                }
            } else {
                // Mode LOW: ON when <= setpoint, OFF when >= setpoint + hysteresis
                if (value <= node.setpoint) {
                    node.currentState = true;
                } else if (value >= node.setpoint + node.hysteresis) {
                    node.currentState = false;
                }
            }
            // Between thresholds: state remains unchanged

            updateStatus(node, value, node.currentState);

            msg.payload = node.currentState;
            msg.value = value;
            msg.previousState = previousState;
            msg.setpoint = node.setpoint;
            msg.hysteresis = node.hysteresis;
            msg.mode = node.mode;
            send(msg);
            if (done) done();
        });
    }

    function updateStatus(node, value, state) {
        var stateText = state === undefined ? "?" : (state ? "ON" : "OFF");
        var valueText = value !== undefined ? value.toFixed(1) : "-";
        var fill = state === undefined ? "grey" : (state ? "green" : "blue");
        node.status({ fill: fill, shape: "dot", text: valueText + " | " + stateText });
    }

    RED.nodes.registerType("hysteresis", HysteresisNode);
}
