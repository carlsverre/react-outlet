var React = require("react");
var registry = require("./outlet_registry");

var Plug = React.createClass({
    propTypes: {
        outletId: React.PropTypes.string.isRequired,
        children: React.PropTypes.node
    },

    componentDidMount: function() {
        this.send_children(this.props.children || null);
    },
    componentWillReceiveProps: function(next_props) {
        this.send_children(next_props.children || null);
    },

    // on dismount we send null children to reset the outlet
    componentWillUnmount: function() {
        registry.unregister_plug(this.props.outletId);
    },

    send_children: function(children) {
        registry.update(this.props.outletId, children);
    },

    // no actual render representation
    render: function() { return null; }
});

module.exports = Plug;
