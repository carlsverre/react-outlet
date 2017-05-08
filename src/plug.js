var registry = require("./outlet_registry");
var PropTypes = require("prop-types");
var createReactClass = require("create-react-class");

var Plug = createReactClass({
    propTypes: {
        outletId: PropTypes.string.isRequired,
        children: PropTypes.node
    },

    componentDidMount: function() {
        this.send_children(this.props.children || undefined);
    },
    componentWillReceiveProps: function(next_props) {
        this.send_children(next_props.children || undefined);
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
