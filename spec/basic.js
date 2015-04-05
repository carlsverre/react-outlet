jest.autoMockOff();

describe('react-outlet', function() {
    var React, TestUtils;
    var Outlet, Plug, outlet_registry;

    beforeEach(function() {
        React = require('react/addons');
        TestUtils = React.addons.TestUtils;

        Outlet = require('../src/outlet');
        Plug = require('../src/plug');
        outlet_registry = require('../src/outlet_registry');
    });

    describe("Outlet", function() {
        it("supports generating an unique id", function() {
            expect(Outlet.new_outlet_id())
                .not.toEqual(Outlet.new_outlet_id());
        });

        it("receives children from its associated Plug", function() {
            var id = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <div>
                    <Outlet outletId={ id } className="outlet-content" />
                    <Plug outletId={ id }>winner</Plug>
                </div>
            );

            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            expect(outlet_content.getDOMNode().textContent).toEqual('winner');
            
            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(plug.getDOMNode()).toBeNull();
        });

        it("it receives updates from its associated Plug", function() {
            var id = Outlet.new_outlet_id();

            var PlugWrap = React.createClass({
                getInitialState: function() { return { content: undefined }; },

                render: function() {
                    return <Plug outletId={ this.props.outletId }>{ this.state.content }</Plug>;
                }
            });

            var tree = TestUtils.renderIntoDocument(
                <div>
                    <Outlet outletId={ id } className="outlet-content" />
                    <PlugWrap outletId={ id } />
                </div>
            );

            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            expect(outlet_content.getDOMNode().textContent).toBe("");

            var plug_wrap = TestUtils.findRenderedComponentWithType(tree, PlugWrap);
            plug_wrap.setState({ content: "foobar" });

            expect(outlet_content.getDOMNode().textContent).toBe("foobar");
        });

        it("it receives updates from its associated Plug across React trees", function() {
            var id = Outlet.new_outlet_id();

            var PlugWrap = React.createClass({
                getInitialState: function() { return { content: undefined }; },

                render: function() {
                    return <Plug outletId={ this.props.outletId }>{ this.state.content }</Plug>;
                }
            });

            var tree = TestUtils.renderIntoDocument(<PlugWrap outletId={ id } />);

            var tree2 = TestUtils.renderIntoDocument(<Outlet outletId={ id } className="outlet-content" />);

            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree2, "outlet-content");
            expect(outlet_content.getDOMNode().textContent).toBe("");

            var plug_wrap = TestUtils.findRenderedComponentWithType(tree, PlugWrap);
            plug_wrap.setState({ content: "foobar" });

            expect(outlet_content.getDOMNode().textContent).toBe("foobar");
        });

        it("supports multiple plug/outlet pairs at the same time", function() {
            var id = Outlet.new_outlet_id();
            var id2 = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <div>
                    <Outlet outletId={ id } className="outlet-first" />
                    <Plug outletId={ id }>first</Plug>
                    <Plug outletId={ id2 }>second</Plug>
                    <Outlet outletId={ id2 } className="outlet-second" />
                </div>
            );

            expect(TestUtils
                .findRenderedDOMComponentWithClass(tree, "outlet-first")
                .getDOMNode()
                .textContent).toBe("first");
            expect(TestUtils
                .findRenderedDOMComponentWithClass(tree, "outlet-second")
                .getDOMNode()
                .textContent).toBe("second");
        });

        it("fails to register an outlet for an existing id", function() {
            var id = Outlet.new_outlet_id();

            var test = function() {
                TestUtils.renderIntoDocument(
                    <div>
                        <Outlet outletId={ id } />
                        <Outlet outletId={ id } />
                    </div>
                );
            };

            expect(test).toThrow();
        });

        it("cleans-up after itself", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");

            var tree = React.render(<Outlet outletId={ id } />, container);

            // ensure that the outlet registered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();

            // cause the tree to be unmounted
            expect(React.unmountComponentAtNode(container)).toBeTruthy();

            // ensure that the outlet unregistered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });

        it("cleans up after itself in complex scenarios", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");
            var container2 = document.createElement("div");

            // outlet is rendered in one tree
            var outlet_tree = React.render(<Outlet outletId={ id } />, container);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();

            // plug is rendered in another tree
            var plug_tree = React.render(<Plug outletId={ id } />, container2);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();

            // unmount the outlet
            expect(React.unmountComponentAtNode(container)).toBeTruthy();

            // outlet should still exist in the registry
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeFalsy();

            expect(React.unmountComponentAtNode(container2)).toBeTruthy();

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });

        it("comes back from the dead", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");
            var container2 = document.createElement("div");
            var container3 = document.createElement("div");

            var outlet_tree = React.render(<Outlet outletId={ id } />, container);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();

            // plug is rendered in another tree
            var plug_tree = React.render(<Plug outletId={ id }>testing</Plug>, container2);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();

            expect(TestUtils
                .findRenderedComponentWithType(outlet_tree, Outlet)
                .getDOMNode()
                .textContent).toBe("testing");

            // unmount the outlet
            expect(React.unmountComponentAtNode(container)).toBeTruthy();

            // mount the outlet in another tree
            var outlet_tree_2 = React.render(<Outlet outletId={ id } />, container3);

            expect(TestUtils
                .findRenderedComponentWithType(outlet_tree_2, Outlet)
                .getDOMNode()
                .textContent).toBe("testing");

            // unmount the plug
            expect(React.unmountComponentAtNode(container2)).toBeTruthy();

            expect(TestUtils
                .findRenderedComponentWithType(outlet_tree_2, Outlet)
                .getDOMNode()
                .textContent).toBe("");

            // outlet should still exist in the registry
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeFalsy();

            expect(React.unmountComponentAtNode(container3)).toBeTruthy();

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });
    });

    describe("Plug", function() {
        it("works fine when no outlet is defined", function() {
            var id = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <Plug outletId={ id }>foobar</Plug>
            );

            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(plug.getDOMNode()).toBeNull();
        });

        it("saves its children for later outlet renders", function() {
            var id = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <Plug outletId={ id }>foobar</Plug>
            );

            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(plug.getDOMNode()).toBeNull();

            var tree2 = TestUtils.renderIntoDocument(
                <Outlet outletId={ id } className="tardy-outlet" />
            );

            expect(TestUtils
                .findRenderedDOMComponentWithClass(tree2, "tardy-outlet")
                .getDOMNode()
                .textContent).toBe("foobar");
        });

        it("cleans up after itself", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");

            var tree = React.render(<Plug outletId={ id } />, container);

            // ensure that the plug registered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();

            // cause the tree to be unmounted
            expect(React.unmountComponentAtNode(container)).toBeTruthy();

            // ensure that the plug unregistered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });
    });
});
