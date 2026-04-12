module.exports = function (RED) {
  function HeatCurveNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Configuration
    node.mode = config.mode || "slope";
    node.slope = parseFloat(config.slope) || 1.0;
    node.designOutdoor = parseFloat(config.designOutdoor) || -15;
    node.designFlow = parseFloat(config.designFlow) || 55;
    node.roomTemp = parseFloat(config.roomTemp) || 20;
    node.shift = parseFloat(config.shift) || 0;
    node.minFlow = parseFloat(config.minFlow) || 20;
    node.maxFlow = parseFloat(config.maxFlow) || 75;
    node.setbackDelta = parseFloat(config.setbackDelta) || 10;
    node.summerLockout = parseFloat(config.summerLockout) || 18;
    node.decimals = parseInt(config.decimals, 10);
    if (isNaN(node.decimals) || node.decimals < 0) {
      node.decimals = 1;
    }

    // Calculate slope from design temps if in design mode
    function calculateSlope(roomTemp, designOutdoor, designFlow) {
      var denominator = roomTemp - designOutdoor;
      if (denominator === 0) return 1.0;
      return (designFlow - roomTemp) / denominator;
    }

    // Store state for stateless messages
    var lastOutdoorTemp = null;
    var lastSetbackActive = false;

    node.on("input", function (msg) {
      var outdoorTemp = parseFloat(msg.payload);

      // If payload is invalid, try to use last known outdoor temp
      if (isNaN(outdoorTemp)) {
        if (lastOutdoorTemp !== null) {
          outdoorTemp = lastOutdoorTemp;
        } else {
          node.warn("Payload is not a valid number: " + msg.payload);
          return;
        }
      } else {
        // Store valid outdoor temp for future use
        lastOutdoorTemp = outdoorTemp;
      }

      // Get values (runtime overrides if provided)
      var roomTemp = msg.roomTemp !== undefined ? parseFloat(msg.roomTemp) : node.roomTemp;
      var shift = msg.shift !== undefined ? parseFloat(msg.shift) : node.shift;
      var minFlow = msg.minFlow !== undefined ? parseFloat(msg.minFlow) : node.minFlow;
      var maxFlow = msg.maxFlow !== undefined ? parseFloat(msg.maxFlow) : node.maxFlow;
      var setbackDelta = msg.setbackDelta !== undefined ? parseFloat(msg.setbackDelta) : node.setbackDelta;
      var summerLockout = msg.summerLockout !== undefined ? parseFloat(msg.summerLockout) : node.summerLockout;

      // Setback: update state only if explicitly set, otherwise keep last state
      var setbackActive;
      if (msg.setback !== undefined) {
        setbackActive = msg.setback === true;
        lastSetbackActive = setbackActive;
      } else {
        setbackActive = lastSetbackActive;
      }

      // Summer lockout check BEFORE curve calculation
      var heatingActive = outdoorTemp <= summerLockout;

      if (!heatingActive) {
        // Summer lockout active
        var msg1 = Object.assign({}, msg);
        msg1.payload = null;
        msg1.heatCurve = {
          outdoorTemp: outdoorTemp,
          flowTemp: null,
          heatingActive: false,
          summerLockout: summerLockout
        };

        var msg2 = { payload: false };

        node.status({ fill: "yellow", shape: "dot", text: outdoorTemp + "°C → locked out" });
        node.send([msg1, msg2]);
        return;
      }

      // Determine slope based on mode
      var slope;
      var designOutdoor = node.designOutdoor;
      var designFlow = node.designFlow;

      if (msg.slope !== undefined) {
        slope = parseFloat(msg.slope);
      } else if (msg.designOutdoor !== undefined || msg.designFlow !== undefined) {
        designOutdoor = msg.designOutdoor !== undefined ? parseFloat(msg.designOutdoor) : node.designOutdoor;
        designFlow = msg.designFlow !== undefined ? parseFloat(msg.designFlow) : node.designFlow;
        slope = calculateSlope(roomTemp, designOutdoor, designFlow);
      } else if (node.mode === "design") {
        slope = calculateSlope(roomTemp, designOutdoor, designFlow);
      } else {
        slope = node.slope;
      }

      // Calculate flow temperature
      // Formula: flowTemp = roomTemp + slope × (roomTemp - outdoorTemp) + shift
      var rawFlowTemp = roomTemp + (slope * (roomTemp - outdoorTemp)) + shift;
      var flowTempBeforeSetback = rawFlowTemp;

      // Apply night setback AFTER curve calculation, BEFORE clamp
      if (setbackActive) {
        rawFlowTemp = rawFlowTemp - setbackDelta;
      }

      // Clamp to min/max
      var clamped = false;
      var clampedAt = null;
      var flowTemp = rawFlowTemp;

      if (flowTemp < minFlow) {
        flowTemp = minFlow;
        clamped = true;
        clampedAt = "min";
      } else if (flowTemp > maxFlow) {
        flowTemp = maxFlow;
        clamped = true;
        clampedAt = "max";
      }

      // Round to decimals
      var factor = Math.pow(10, node.decimals);
      flowTemp = Math.round(flowTemp * factor) / factor;
      flowTempBeforeSetback = Math.round(flowTempBeforeSetback * factor) / factor;
      var roundedSlope = Math.round(slope * 100) / 100;

      // Build output message 1
      var msg1 = Object.assign({}, msg);
      msg1.payload = flowTemp;
      msg1.heatCurve = {
        outdoorTemp: outdoorTemp,
        flowTemp: flowTemp,
        slope: roundedSlope,
        roomTemp: roomTemp,
        shift: shift,
        minFlow: minFlow,
        maxFlow: maxFlow,
        clamped: clamped,
        clampedAt: clampedAt,
        setback: setbackActive,
        setbackDelta: setbackDelta,
        flowTempBeforeSetback: flowTempBeforeSetback,
        summerLockout: summerLockout,
        heatingActive: true
      };

      // Add design temps to output if in design mode
      if (node.mode === "design" || msg.designOutdoor !== undefined || msg.designFlow !== undefined) {
        msg1.heatCurve.designOutdoor = designOutdoor;
        msg1.heatCurve.designFlow = designFlow;
      }

      // Build output message 2
      var msg2 = { payload: true };

      // Update node status
      var statusText = outdoorTemp + "°C → " + flowTemp + "°C";
      var statusIcon = "green";

      if (setbackActive) {
        statusText += " (setback)";
        statusIcon = "blue";
      } else if (clamped) {
        statusText += " (clamped " + clampedAt + ")";
        statusIcon = "yellow";
      }

      node.status({ fill: statusIcon, shape: "dot", text: statusText });

      node.send([msg1, msg2]);
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("heat-curve", HeatCurveNode);
};
