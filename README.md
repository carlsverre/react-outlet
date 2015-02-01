# Transclusion helpers for React.js

```
npm install react-outlet --save
```

## Usage Example

```
var Outlet = require("react-outlet").Outlet;
var Plug = require("react-outlet").Plug;

var Parent = React.createClass({
    componentWillMount: function() {
        this.setState({
            header_outlet: Outlet.new_outlet_id()
        });
    },

    render: function() {
        return (
            <div>
                <Header>
                    Awesome parent
                    <Outlet outletId={ this.state.header_outlet } />
                </Header>
                <Child outlet={ this.state.header_outlet } />
            </div>
        );
    }
});

var Child = React.createClass({
    render: function() {
        return (
            <div>
                I am the child
                <Plug outletId={ this.props.outlet }>
                    I will appear in the header.
                </Plug>
            </div>
        );
    }
});
```
