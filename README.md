# React Outlet [![Travis][travis-badge]][travis] [![npm package][npm-badge]][npm]

## Transclusion helpers for React.js

```
npm install react-outlet --save
```

React-Outlet provides two components which aid in cross-component transclusion
for React.js, namely an Outlet and Plug component.

Outlets are tied to Plugs via an outletId property.  There is a 1-1 relationship
between an Outlet and Plug.

An example use-case is a parent page which contains two panels.  One panel displays a
child component while the other panel contains a couple of other components.
Perhaps the parent wants to give the child component the ability to render an
additional component in the side panel.  Rather than pushing down the entire
layout into the child (and potentially duplicating a ton of code between
multiple children), with React-Outlet the parent can simply pass an outletId to
the child.  The child can then render arbitrary content into the parent's panel
without loosing control (or causing additional renders).

All of this is done within the React lifecycle and is not async.

This same pattern can be used to build other complex components such as Modals
or Tooltips.

## Usage Example

```jsx
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

## Component API

```html
Static Methods:

Outlet.new_outlet_id()
    Generate and return a new outlet id.  Should be passed into Outlet and Plug
    components as the outletId prop.
    
Outlet.reset()
    Reset the Outlet's registry.  This was added for server-side React usage.

Components:

<Outlet outletId={ outlet_id } />
    Render an outlet somewhere in the React component tree.  By default this
    will render into an empty <div />.  Any props other than outletId will be
    passed to the underlying <div /> so the outlet is easily classable.

    The outletId prop ties this Outlet to a Plug.

<Plug outletId={ outlet_id }>{ ... children go here ... }</Plug>
    When a plug has children the children will appear in the associated Outlet
    (associated means the outlet has the same outletId as this plug).  You can
    still use all of the normal React features such as event listeners and so on
    on the Plug's children.
```

## Related work in the React.js community

I want to give a shout out to Joe Critchley (@joecritchley) who had some great ideas for various outlet/portal implementations.  Here are some links to his various implementations:

* with-outlets.js (https://gist.github.com/joecritch/8755865)
    * A great example of how to give a parent component more fine-grained control of a components children.
* Better component transclusion (http://joecritchley.svbtle.com/transclusion-in-react)
    * A blog post about something similar to with-outlets.js
* "Portals" in React.js (http://joecritchley.svbtle.com/portals-in-reactjs)
    * An implementation of outlets similar to React-Outlet which uses DOM injection to transfer children around.

[travis-badge]: https://img.shields.io/travis/carlsverre/react-outlet.svg?style=flat-square
[travis]: https://travis-ci.org/carlsverre/react-outlet
[npm-badge]: https://img.shields.io/npm/v/react-outlet.svg?style=flat-square
[npm]: https://www.npmjs.org/package/react-outlet
