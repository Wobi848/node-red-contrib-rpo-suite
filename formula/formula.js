module.exports = function(RED) {

    // Math functions and constants available in formulas
    var MATH_FUNCS = ['sin','cos','tan','asin','acos','atan','atan2',
                      'abs','sqrt','cbrt','pow','exp','log','log2','log10',
                      'floor','ceil','round','min','max','sign','hypot'];
    var MATH_CONSTS = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E };
    var RESERVED = new Set([].concat(MATH_FUNCS, Object.keys(MATH_CONSTS)));

    // Inject math into function scope
    var MATH_INJECT = MATH_FUNCS.map(function(f) {
        return 'var ' + f + '=Math.' + f + ';';
    }).join('') + Object.keys(MATH_CONSTS).map(function(c) {
        return 'var ' + c + '=' + MATH_CONSTS[c] + ';';
    }).join('');

    function extractVars(formula) {
        var matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        var seen = {};
        return matches.filter(function(v) {
            if (RESERVED.has(v) || seen[v]) return false;
            seen[v] = true;
            return true;
        });
    }

    function isValidFormula(formula) {
        return /^[a-zA-Z0-9_+\-*\/().,% \^\s]+$/.test(formula);
    }

    function sanitize(formula) {
        return formula.replace(/\^/g, '**');
    }

    function buildEvalFn(varNames, formula) {
        var body = '"use strict";' + MATH_INJECT + 'return (' + sanitize(formula) + ');';
        return new Function(varNames, body); // eslint-disable-line no-new-func
    }

    function FormulaNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.formula   = (config.formula || 'a + b').trim();
        node.decimals  = parseInt(config.decimals, 10);
        if (isNaN(node.decimals) || node.decimals < 0) node.decimals = 4;

        node.varNames = extractVars(node.formula);

        var _min = parseInt(config.minVars, 10);
        node.minVars = (!isNaN(_min) && _min > 0) ? _min : node.varNames.length;

        node.state = {};

        if (!isValidFormula(node.formula)) {
            node.error('Invalid formula (forbidden characters): ' + node.formula);
            node.status({ fill:'red', shape:'dot', text:'Invalid formula' });
            return;
        }

        try {
            node.evalFn = buildEvalFn(node.varNames, node.formula);
        } catch(e) {
            node.error('Formula syntax error: ' + e.message);
            node.status({ fill:'red', shape:'dot', text:'Syntax error' });
            return;
        }

        updateStatus(node);

        node.on('input', function(msg) {
            if (msg.reset === true) {
                node.state = {};
                updateStatus(node);
                return;
            }

            var topic = msg.topic ? String(msg.topic) : '';
            var val   = parseFloat(msg.payload);

            if (topic && node.varNames.indexOf(topic) !== -1) {
                if (isNaN(val)) { node.warn('Not a number for variable "' + topic + '": ' + msg.payload); return; }
                node.state[topic] = val;
            } else if (!isNaN(val) && node.varNames.length === 0) {
                // Formula has no variables — evaluate immediately
            } else if (topic && node.varNames.indexOf(topic) === -1) {
                node.warn('Unknown variable "' + topic + '" — formula uses: ' + node.varNames.join(', '));
                return;
            } else if (!topic) {
                node.warn('msg.topic required (variable name)');
                return;
            }

            var have = node.varNames.filter(function(v) { return v in node.state; }).length;
            if (have < node.minVars) {
                updateStatus(node);
                return;
            }

            // Build args — unknown vars default to 0
            var args = node.varNames.map(function(v) {
                return node.state[v] !== undefined ? node.state[v] : 0;
            });

            try {
                var result = node.evalFn.apply(null, args);
                if (typeof result !== 'number' || !isFinite(result)) {
                    node.warn('Formula result is not finite: ' + result + ' (division by zero?)');
                    node.status({ fill:'yellow', shape:'dot', text:'Result: ' + result });
                    return;
                }
                result = parseFloat(result.toFixed(node.decimals));
                msg.payload = result;
                msg.formula = {
                    formula:   node.formula,
                    variables: Object.assign({}, node.state),
                    result:    result,
                    decimals:  node.decimals
                };
                node.status({ fill:'green', shape:'dot', text:node.formula + ' = ' + result });
                node.send(msg);
            } catch(e) {
                node.error('Evaluation error: ' + e.message);
                node.status({ fill:'red', shape:'dot', text:'Error: ' + e.message });
            }
        });
    }

    function updateStatus(node) {
        var have  = Object.keys(node.state).length;
        var total = node.varNames.length;
        if (total === 0) {
            node.status({ fill:'grey', shape:'dot', text:'Ready: ' + node.formula });
        } else {
            node.status({ fill:'grey', shape:'ring', text:'Vars: ' + have + '/' + total + ' (' + node.minVars + ' needed)' });
        }
    }

    RED.nodes.registerType('formula', FormulaNode);
};
