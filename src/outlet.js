var React = require("react");
var registry = require("./outlet_registry");
var PropTypes = require("prop-types");
var createReactClass = require("create-react-class");

var Outlet = createReactClass({
    statics: {
        new_outlet_id: registry.generate_id.bind(registry),
        reset: registry.reset.bind(registry)
    },

    propTypes: {
        outletId: PropTypes.string.isRequired
    },

    getInitialState: function() {
        return { children: null };
    },

    componentWillMount: function() {
        registry.register(this.props.outletId, this.update);
    },

    componentWillReceiveProps: function(next_props) {
        if (this.props.outletId !== next_props.outletId) {
            registry.unregister_outlet(this.props.outletId);
            registry.register(next_props.outletId, this.update);
        }
    },

    componentWillUnmount: function() {
        registry.unregister_outlet(this.props.outletId);
    },

    update: function(children) {
        if (children) {
            var props = Object.assign({}, this.props);
            delete props.outletId;
            this.setState({ children: React.createElement("div", props, children) });
        } else {
            this.setState({ children: null });
        }
    },

    render: function() {
        return this.state.children;
    }
});

module.exports = Outlet;
