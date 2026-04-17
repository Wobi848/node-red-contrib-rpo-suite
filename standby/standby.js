module.exports = function(RED) {
    function StandbyNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.comfortSetpoint = parseFloat(config.comfortSetpoint); if (isNaN(node.comfortSetpoint)) node.comfortSetpoint = 22;
        node.standbyOffset   = parseFloat(config.standbyOffset);   if (isNaN(node.standbyOffset))   node.standbyOffset   = -4;
        node.frostSetpoint   = parseFloat(config.frostSetpoint);   if (isNaN(node.frostSetpoint))   node.frostSetpoint   = 8;
        node.mode            = config.initialMode || 'comfort';

        var validModes = ['comfort', 'standby', 'frost'];

        function getSetpoint(comfortSP, offset, frostSP, mode) {
            if (mode === 'comfort') return comfortSP;
            if (mode === 'standby') return comfortSP + offset;
            if (mode === 'frost')   return frostSP;
        }

        function sendOutput(msg, newMode, comfortSP, offset, frostSP, modeChanged) {
            var setpoint = getSetpoint(comfortSP, offset, frostSP, newMode);
            var info = {
                mode:            newMode,
                setpoint:        setpoint,
                comfortSetpoint: comfortSP,
                standbyOffset:   offset,
                frostSetpoint:   frostSP
            };
            var out1 = RED.util.cloneMessage(msg);
            out1.payload = setpoint;
            out1.standby = info;
            var out2 = modeChanged ? { payload: newMode, standby: info } : null;
            node.send([out1, out2]);

            var icons = { comfort: 'COMFORT', standby: 'STANDBY', frost: 'FROST' };
            var fills = { comfort: 'green', standby: 'blue', frost: 'grey' };
            node.status({ fill: fills[newMode] || 'grey', shape: 'dot', text: icons[newMode] + ' ' + setpoint + '°C' });
        }

        // Initial status
        var initSP = getSetpoint(node.comfortSetpoint, node.standbyOffset, node.frostSetpoint, node.mode);
        var fills = { comfort: 'green', standby: 'blue', frost: 'grey' };
        node.status({ fill: fills[node.mode] || 'grey', shape: 'dot', text: node.mode.toUpperCase() + ' ' + initSP + '°C' });

        node.on('input', function(msg) {
            var comfortSP = msg.comfortSetpoint !== undefined ? parseFloat(msg.comfortSetpoint) : node.comfortSetpoint;
            var offset    = msg.standbyOffset   !== undefined ? parseFloat(msg.standbyOffset)   : node.standbyOffset;
            if (isNaN(comfortSP)) comfortSP = node.comfortSetpoint;
            if (isNaN(offset))    offset    = node.standbyOffset;

            var newMode = msg.mode || msg.topic || node.mode;
            if (!validModes.includes(newMode)) {
                node.warn('Invalid mode: ' + newMode);
                newMode = node.mode;
            }

            var modeChanged = newMode !== node.mode;
            node.mode = newMode;

            sendOutput(msg, newMode, comfortSP, offset, node.frostSetpoint, modeChanged);
        });
    }

    RED.nodes.registerType('standby', StandbyNode);
};
