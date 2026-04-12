module.exports = function(RED) {
    function PulseEdgeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.mode = config.mode || "rising";
        this.initialState = config.initialState;

        // Set initial state
        if (this.initialState === "true") {
            this.previousState = true;
        } else if (this.initialState === "false") {
            this.previousState = false;
        } else {
            this.previousState = undefined;
        }

        // Show initial status
        updateStatus(node, this.previousState);

        node.on('input', function(msg, send, done) {
            var value = msg.payload;

            // Convert number 0/1 to boolean
            if (value === 0) value = false;
            if (value === 1) value = true;

            // Validate input is a boolean
            if (typeof value !== 'boolean') {
                node.error("Input is not a boolean or 0/1: " + msg.payload, msg);
                node.status({ fill: "red", shape: "ring", text: "Invalid input" });
                if (done) done();
                return;
            }

            var previous = node.previousState;
            var sendPulse = false;

            // First message with undefined initialState: just set state, no output
            if (previous === undefined) {
                node.previousState = value;
                updateStatus(node, value);
                if (done) done();
                return;
            }

            // Detect edges
            var risingEdge = (previous === false && value === true);
            var fallingEdge = (previous === true && value === false);

            if (node.mode === "rising" && risingEdge) {
                sendPulse = true;
            } else if (node.mode === "falling" && fallingEdge) {
                sendPulse = true;
            } else if (node.mode === "both" && (risingEdge || fallingEdge)) {
                sendPulse = true;
            }

            // Update state
            node.previousState = value;
            updateStatus(node, value);

            // Send pulse if edge detected
            if (sendPulse) {
                msg.payload = true;
                msg.edge = risingEdge ? "rising" : "falling";
                msg.previousState = previous;
                send(msg);
            }

            if (done) done();
        });
    }

    function updateStatus(node, state) {
        var stateText = state === undefined ? "?" : (state ? "HIGH" : "LOW");
        var modeText = node.mode === "rising" ? "↑" : (node.mode === "falling" ? "↓" : "↑↓");
        var fill = state === undefined ? "grey" : (state ? "green" : "blue");
        node.status({ fill: fill, shape: "dot", text: stateText + " | " + modeText });
    }

    RED.nodes.registerType("pulse-edge", PulseEdgeNode);
}
