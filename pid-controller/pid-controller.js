module.exports = function (RED) {
  function PIDControllerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Configuration
    node.setpoint = parseFloat(config.setpoint) || 20;
    node.useXp = config.useXp === true;
    node.Ti = parseFloat(config.Ti) || 60;
    node.Td = parseFloat(config.Td) || 0;
    node.outMin = parseFloat(config.outMin) || 0;
    node.outMax = parseFloat(config.outMax) || 100;
    // If using Xp mode, convert to Kp: Kp = outputSpan / Xp (physically correct)
    var configKp = parseFloat(config.Kp) || 1.0;
    if (node.useXp && configKp > 0) {
      var outputSpan = node.outMax - node.outMin;
      node.Kp = outputSpan / configKp;
    } else {
      node.Kp = configKp;
    }
    node.rateLimit = parseFloat(config.rateLimit) || 0;
    node.reverseActing = config.reverseActing === true;
    node.centeredBand = config.centeredBand === true;
    node.manualMode = config.manualMode === true;
    node.manualValue = parseFloat(config.manualValue) || 0;
    node.decimals = parseInt(config.decimals, 10);
    if (isNaN(node.decimals) || node.decimals < 0) {
      node.decimals = 1;
    }
    node.maxInterval = parseFloat(config.maxInterval) || 0;
    node.ffEnable = config.ffEnable === true;
    node.ffGain = parseFloat(config.ffGain) || 1.0;

    // Constants
    var D_SMOOTH_FACTOR = 4; // Derivative smoothing factor (always active)

    // State
    var state = {
      integral: 0,
      lastError: 0,
      lastOutput: 0,
      lastTime: null,
      manual: node.manualMode,
      manualValue: node.manualValue,
      currentSetpoint: node.setpoint,
      initialized: false,
      smoothedPV: null // For derivative smoothing
    };

    node.on("input", function (msg) {
      // Industry-compatible aliases: msg.pv for process value
      var processValue = parseFloat(msg.pv !== undefined ? msg.pv : msg.payload);

      // Validate input
      if (isNaN(processValue)) {
        node.warn("Payload is not a valid number: " + (msg.pv !== undefined ? msg.pv : msg.payload));
        return;
      }

      // Handle reset command
      if (msg.reset === true) {
        state.integral = 0;
        state.lastError = 0;
        state.lastOutput = 0;
        state.lastTime = null;
        state.initialized = false;
        state.smoothedPV = null;
        state.currentSetpoint = node.setpoint; // Restore default setpoint
        node.status({ fill: "yellow", shape: "ring", text: "Reset" });
        return;
      }

      // Get parameters (runtime overrides if provided)
      // Setpoint is sticky - once changed via msg.setpoint or msg.sp, it stays until changed again
      // Industry-compatible aliases: msg.sp for setpoint
      if (msg.sp !== undefined) {
        state.currentSetpoint = parseFloat(msg.sp);
      } else if (msg.setpoint !== undefined) {
        state.currentSetpoint = parseFloat(msg.setpoint);
      }
      var setpoint = state.currentSetpoint;
      var outMin = node.outMin;
      var outMax = node.outMax;
      var outputSpan = outMax - outMin;
      var Kp;
      if (msg.Xp !== undefined) {
        // Xp override: convert to Kp (physically correct: outputSpan / Xp)
        var xpVal = parseFloat(msg.Xp);
        Kp = xpVal > 0 ? outputSpan / xpVal : node.Kp;
      } else if (msg.Kp !== undefined) {
        Kp = parseFloat(msg.Kp);
      } else {
        Kp = node.Kp;
      }
      var Ti = msg.Ti !== undefined ? parseFloat(msg.Ti) : node.Ti;
      var Td = msg.Td !== undefined ? parseFloat(msg.Td) : node.Td;
      var rateLimit = node.rateLimit;
      var reverseActing = node.reverseActing;

      // Calculate centered band bias (dynamic based on output range)
      var centeredBias = (outMax + outMin) / 2;

      // Handle manual mode switching
      if (msg.manual !== undefined) {
        var wasManual = state.manual;
        state.manual = msg.manual === true;

        // Bumpless transfer: manual -> auto
        if (wasManual && !state.manual) {
          // Pre-load integral so output starts at current manualValue
          if (Ti > 0 && Kp !== 0) {
            // Account for centered band bias AND feed-forward in bumpless transfer
            // Auto output = P + I + D + bias + FF, we want output = manualValue
            // At switch moment P≈0, D≈0, so: manualValue = I + bias + FF
            // Therefore: I = manualValue - bias - FF
            var ffContrib = 0;
            var ffBumpless = msg.ff !== undefined ? msg.ff : msg.feedForward;
            if (node.ffEnable && ffBumpless !== undefined) {
              var ffVal = parseFloat(ffBumpless);
              if (!isNaN(ffVal)) {
                ffContrib = node.ffGain * ffVal;
              }
            }
            var targetOutput = node.centeredBand
              ? state.manualValue - centeredBias - ffContrib
              : state.manualValue - ffContrib;
            state.integral = targetOutput / Kp;
            // Sync lastOutput to prevent rate-limit jump after bumpless transfer
            state.lastOutput = state.manualValue;
          }
        }
      }

      // Update manual value if provided
      if (msg.manualValue !== undefined) {
        state.manualValue = parseFloat(msg.manualValue);
        state.manualValue = Math.max(outMin, Math.min(outMax, state.manualValue));
      }

      // Calculate dt (time delta in seconds)
      var now = Date.now();
      var dt = 0;
      var intervalExceeded = false;
      if (state.lastTime !== null) {
        dt = (now - state.lastTime) / 1000;
        // Check max interval
        if (node.maxInterval > 0 && dt > node.maxInterval) {
          intervalExceeded = true;
          // Limit dt to maxInterval to prevent D-term jumps after long pauses
          dt = node.maxInterval;
          // Freeze integral on interval exceeded (no reset to avoid output jump)
          // Integral will resume accumulation on next normal cycle
        }
      }
      state.lastTime = now;

      // Calculate error
      var error;
      if (reverseActing) {
        error = processValue - setpoint;
      } else {
        error = setpoint - processValue;
      }

      var output;
      var P = 0;
      var I = 0;
      var D = 0;
      var FF = 0;
      var clamped = false;
      var clampedAt = null;
      var antiWindup = false;
      var rateLimited = false;
      var trackingActive = false;
      // Industry-compatible aliases: msg.external, msg.cascade for tracking
      var trackingInput = msg.trackingValue !== undefined ? msg.trackingValue :
                          msg.external !== undefined ? msg.external :
                          msg.cascade !== undefined ? msg.cascade : undefined;

      if (state.manual) {
        // Manual mode - output is manualValue
        output = state.manualValue;
      } else {
        // Auto mode - PID calculation

        // Calculate Feed-Forward value early (needed for conditional integration)
        // FF is additive and does NOT affect the integrator directly
        // Industry-compatible aliases: msg.ff for feed-forward
        var ffRaw = msg.ff !== undefined ? msg.ff : msg.feedForward;
        if (node.ffEnable && ffRaw !== undefined) {
          var ffInput = parseFloat(ffRaw);
          if (!isNaN(ffInput)) {
            FF = node.ffGain * ffInput;
            // Industry safety: limit FF to output span (prevents runaway output)
            FF = Math.max(-outputSpan, Math.min(outputSpan, FF));
          }
        }

        // First message: initialize only (no FF on first cycle for stability)
        if (!state.initialized) {
          state.lastError = error;
          state.smoothedPV = processValue;
          state.initialized = true;
          // On first message, use proportional only
          P = Kp * error;
          output = P;
          if (node.centeredBand) {
            output += centeredBias;
          }
          // FF not applied on first cycle - reset to 0 for reporting
          FF = 0;
        } else if (intervalExceeded) {
          // Max interval exceeded - use P only, reset derivative state
          P = Kp * error;
          // Keep integral frozen (use existing value)
          I = Ti > 0 ? (Kp / Ti) * state.integral : 0;
          D = 0; // No derivative when interval exceeded
          state.smoothedPV = processValue; // Reset smoothed value
          output = P + I + D;
          if (node.centeredBand) {
            output += centeredBias;
          }
          // Add FF even when interval exceeded (disturbance compensation still valid)
          output += FF;
        } else {
          // Proportional term
          P = Kp * error;

          // Derivative term with smoothing (if Td > 0)
          // Derivative on measurement (prevents derivative kick on setpoint change)
          if (Td > 0 && dt > 0) {
            // Smoothing: proper discrete EMA (time-constant based)
            // Time constant = Td / D_SMOOTH_FACTOR
            var smoothTs = Td / D_SMOOTH_FACTOR;
            // EMA alpha = dt / (smoothTs + dt) - numerically stable for any dt
            var alpha = dt / (smoothTs + dt);
            var prevSmoothed = state.smoothedPV;
            state.smoothedPV = prevSmoothed + alpha * (processValue - prevSmoothed);
            // Derivative based on smoothed PV change (ISA form: derivative on measurement)
            var derivativePV = (state.smoothedPV - prevSmoothed) / dt;
            // Convert to error derivative depending on acting direction
            var derivativeError = reverseActing ? derivativePV : -derivativePV;
            D = Kp * Td * derivativeError;
          } else {
            // Update smoothed PV even if Td=0 (for when Td becomes non-zero)
            state.smoothedPV = processValue;
          }

          // Tracking Mode OR Conditional Integration
          // Tracking forces integrator to follow external value (for cascade control)
          if (Ti > 0 && Kp !== 0) {
            var Ki = Kp / Ti;

            if (trackingInput !== undefined) {
              // Tracking Mode: force integrator to match external output
              // NaN protection: only track if input is valid number
              var trackedRaw = parseFloat(trackingInput);
              if (!isNaN(trackedRaw)) {
                trackingActive = true;
                // Clamp tracking value to output range
                var tracked = Math.max(outMin, Math.min(outMax, trackedRaw));
                // Calculate bias for centered band
                var bias = node.centeredBand ? centeredBias : 0;
                // Solve for integral: tracked = P + I + D + FF + bias
                // Therefore: I = tracked - P - D - FF - bias
                // And: state.integral = I / Ki (guard against Ki=0)
                if (Ki !== 0) {
                  state.integral = (tracked - P - D - FF - bias) / Ki;
                } else {
                  state.integral = 0;
                }
                I = Ki * state.integral;
              } else if (dt > 0) {
                // Invalid tracking input: fallback to normal integration
                // (prevents integrator freeze on bad tracking data)
                var newIntegral = state.integral + error * dt;
                var candidateI = Ki * newIntegral;
                var candidateOutput = P + candidateI + D;
                if (node.centeredBand) {
                  candidateOutput += centeredBias;
                }
                candidateOutput += FF;
                if (!((candidateOutput > outMax && error > 0) || (candidateOutput < outMin && error < 0))) {
                  state.integral = newIntegral;
                  I = candidateI;
                } else {
                  I = Ki * state.integral;
                  antiWindup = true;
                }
              }
            } else if (dt > 0) {
              // Normal Conditional Integration
              var newIntegral = state.integral + error * dt;
              var candidateI = Ki * newIntegral;
              // Include FF in candidate output to prevent windup through FF
              var candidateOutput = P + candidateI + D;
              if (node.centeredBand) {
                candidateOutput += centeredBias;
              }
              candidateOutput += FF; // FF must be in anti-windup check

              // Accept integral only if not driving further into saturation
              if (!((candidateOutput > outMax && error > 0) || (candidateOutput < outMin && error < 0))) {
                state.integral = newIntegral;
                I = candidateI;
              } else {
                // Keep existing integral (conditional integration)
                I = Ki * state.integral;
                antiWindup = true;
              }
            }

            // Integrator soft clamp: prevent extreme windup during long saturation
            // Limits integral to what can produce full output range (faster recovery)
            var integralMax = outputSpan / Ki;
            state.integral = Math.max(-integralMax, Math.min(integralMax, state.integral));
          }

          // ISA standard: output = Kp × [ e(t) + (1/Ti) × ∫e(t)dt + Td × de(t)/dt ]
          output = P + I + D;

          // Centered band mode: add bias so output is at midpoint at setpoint
          if (node.centeredBand) {
            output += centeredBias;
          }

          // Add Feed-Forward to output
          output += FF;
        }

        // Rate limiting (before clamping)
        if (rateLimit > 0 && state.initialized && dt > 0) {
          var maxChange = rateLimit * dt;
          var outputChange = output - state.lastOutput;
          if (Math.abs(outputChange) > maxChange) {
            output = state.lastOutput + Math.sign(outputChange) * maxChange;
            rateLimited = true;
          }
        }

        // Clamping
        if (output < outMin) {
          output = outMin;
          clamped = true;
          clampedAt = "min";
        } else if (output > outMax) {
          output = outMax;
          clamped = true;
          clampedAt = "max";
        }

        // Mark anti-windup when rate-limited (conditional integration already prevented windup)
        if (rateLimited && Ti > 0 && !antiWindup) {
          antiWindup = true;
        }

        state.lastError = error;
      }

      // NaN/Infinity protection - prevent bad values from propagating
      if (!isFinite(output)) {
        node.warn("PID output became " + output + ", freezing to last valid output");
        output = isFinite(state.lastOutput) ? state.lastOutput : (outMin + outMax) / 2;
        // Freeze integral instead of reset to avoid output jump
        // Back-calculate integral from frozen output
        if (Ti > 0 && Kp !== 0) {
          var Ki = Kp / Ti;
          var bias = node.centeredBand ? (outMax + outMin) / 2 : 0;
          state.integral = (output - P - D - FF - bias) / Ki;
        }
      }
      if (!isFinite(state.integral)) {
        state.integral = 0; // Last resort: reset if integral itself is bad
      }

      state.lastOutput = output;

      // Round output
      var factor = Math.pow(10, node.decimals);
      var roundedOutput = Math.round(output * factor) / factor;

      // Build output message 1
      var msg1 = Object.assign({}, msg);
      msg1.payload = roundedOutput;
      msg1.pid = {
        processValue: processValue,
        setpoint: setpoint,
        error: Math.round(error * factor) / factor,
        output: roundedOutput,
        outputRaw: output,
        P: Math.round(P * factor) / factor,
        I: Math.round(I * factor) / factor,
        D: Math.round(D * factor) / factor,
        FF: Math.round(FF * factor) / factor,
        Kp: Kp,
        Ti: Ti,
        Td: Td,
        dt: Math.round(dt * 1000) / 1000,
        clamped: clamped,
        clampedAt: clampedAt,
        antiWindup: antiWindup,
        manual: state.manual,
        reverseActing: reverseActing,
        centeredBand: node.centeredBand,
        rateLimit: rateLimit,
        rateLimited: rateLimited,
        maxInterval: node.maxInterval,
        intervalExceeded: intervalExceeded,
        ffEnable: node.ffEnable,
        ffGain: node.ffGain,
        tracking: trackingInput,
        trackingActive: trackingActive
      };

      // Build output message 2 (status)
      var msg2 = {
        payload: {
          manual: state.manual,
          setpoint: setpoint,
          processValue: processValue,
          error: Math.round(error * factor) / factor,
          output: roundedOutput,
          centeredBand: node.centeredBand,
          reverseActing: reverseActing,
          trackingActive: trackingActive
        }
      };

      // Update node status
      var statusText;
      var statusColor;
      if (state.manual) {
        statusText = "MANUAL → " + roundedOutput + "%";
        statusColor = "blue";
      } else {
        statusText = "SP:" + setpoint + " PV:" + processValue + " → " + roundedOutput + "%";
        if (intervalExceeded) {
          statusText += " (interval!)";
          statusColor = "red";
        } else if (trackingActive) {
          statusText += clamped ? " (tracking+clamp)" : " (tracking)";
          statusColor = "cyan";
        } else if (clamped) {
          statusText += " (clamped)";
          statusColor = "yellow";
        } else if (rateLimited) {
          statusText += " (rate limited)";
          statusColor = "yellow";
        } else {
          statusColor = "green";
        }
      }
      node.status({ fill: statusColor, shape: "dot", text: statusText });

      node.send([msg1, msg2]);
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("pid-controller", PIDControllerNode);
};
