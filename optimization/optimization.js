module.exports = function(RED) {
    function OptimizationNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.occupancyTime  = config.occupancyTime  || '08:00';
        node.thermalMass    = parseFloat(config.thermalMass)   || 30;
        node.heatingPower   = parseFloat(config.heatingPower)  || 1.0;
        node.outdoorFactor  = parseFloat(config.outdoorFactor) || 0.05;
        node.maxPreHeat     = parseFloat(config.maxPreHeat)    || 240;
        node.topicRoom      = config.topicRoom     || 'room';
        node.topicOutdoor   = config.topicOutdoor  || 'outdoor';
        node.topicSetpoint  = config.topicSetpoint || 'setpoint';

        node.roomTemp   = undefined;
        node.outdoor    = undefined;
        node.setpoint   = undefined;
        node.active     = false;

        node.status({ fill: 'grey', shape: 'ring', text: 'Waiting for inputs...' });

        function calcRequiredMinutes(roomTemp, outdoor, setpoint, occTime, override) {
            var occ = override || occTime;
            var diff = setpoint - roomTemp;
            if (diff <= 0) return 0;
            var factor = 1 + node.outdoorFactor * Math.max(0, roomTemp - outdoor);
            var minutes = (diff * node.thermalMass) / (node.heatingPower * factor);
            return Math.min(node.maxPreHeat, Math.round(minutes));
        }

        function evaluate(occupancyOverride) {
            if (node.roomTemp === undefined || node.outdoor === undefined || node.setpoint === undefined) return;

            var occ = occupancyOverride || node.occupancyTime;
            var now = new Date();
            var parts = occ.split(':');
            var occH = parseInt(parts[0], 10), occM = parseInt(parts[1], 10) || 0;
            var occTotal = occH * 60 + occM;
            var nowTotal = now.getHours() * 60 + now.getMinutes();

            var required = calcRequiredMinutes(node.roomTemp, node.outdoor, node.setpoint, occ, occupancyOverride);
            var startTotal = occTotal - required;
            var minutesUntilStart = startTotal - nowTotal;

            var startH = Math.floor(((startTotal % 1440) + 1440) % 1440 / 60);
            var startM = ((startTotal % 1440) + 1440) % 1440 % 60;
            var startTime = String(startH).padStart(2,'0') + ':' + String(startM).padStart(2,'0');

            var shouldBeActive = minutesUntilStart <= 0 && nowTotal < occTotal;
            if (nowTotal >= occTotal) shouldBeActive = false;

            var info = {
                roomTemp:          node.roomTemp,
                outdoor:           node.outdoor,
                setpoint:          node.setpoint,
                requiredMinutes:   required,
                startTime:         startTime,
                occupancyTime:     occ,
                active:            shouldBeActive,
                minutesUntilStart: Math.max(0, minutesUntilStart)
            };

            node.send([{ payload: shouldBeActive, optimization: info }, { payload: info, optimization: info }]);

            if (shouldBeActive) {
                node.status({ fill: 'green', shape: 'dot', text: 'ACTIVE – heating to ' + node.setpoint + '°C' });
            } else if (required === 0) {
                node.status({ fill: 'green', shape: 'dot', text: 'READY – room at setpoint' });
            } else if (nowTotal >= occTotal) {
                node.status({ fill: 'grey', shape: 'dot', text: 'Next: tomorrow at ' + startTime });
            } else {
                node.status({ fill: 'blue', shape: 'dot', text: 'Start in ' + minutesUntilStart + 'min (at ' + startTime + ')' });
            }
        }

        node.ticker = setInterval(function() { evaluate(); }, 60000);

        node.on('input', function(msg) {
            if (msg.force === true) {
                node.send([{ payload: true }, null]);
                node.status({ fill: 'yellow', shape: 'dot', text: 'FORCED' });
                return;
            }
            if (msg.topic === node.topicRoom)     node.roomTemp = parseFloat(msg.payload);
            if (msg.topic === node.topicOutdoor)  node.outdoor  = parseFloat(msg.payload);
            if (msg.topic === node.topicSetpoint) node.setpoint = parseFloat(msg.payload);
            evaluate(msg.occupancyTime);
        });

        node.on('close', function() { clearInterval(node.ticker); });
    }

    RED.nodes.registerType('optimization', OptimizationNode);
};
