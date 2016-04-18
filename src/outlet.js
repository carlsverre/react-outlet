var React = require("react");
var registry = require("./outlet_registry");

var Outlet = React.createClass({
    statics: {
        new_outlet_id: registry.generate_id.bind(registry),
        rewind: registry.rewind.bind(registry)
    },

    propTypes: {
        outletId: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
        return { children: null };
    },

    componentWillMount: function() {
        registry.register(this.props.outletId, this.update);
    },

    componentWillReceiveProps: function(next_props) {
        if (this.props.outletId !== next_props.outletId) {
            registry.unregister(this.props.outletId);
            registry.register(next_props.outletId, this.update);
        }
    },

    componentWillUnmount: function() {
        registry.unregister_outlet(this.props.outletId);
    },

    update: function(children) {
        if (children) {
            this.setState({ children: React.createElement("div", this.props, children) });
        } else {
            this.setState({ children: null });
        }
    },

    render: function() {
        return this.state.children;
    }
});

module.exports = Outlet;
