/* eslint react/no-find-dom-node: 0, react/no-render-return-value: 0 */

jest.autoMockOff();

describe("react-outlet", function() {
    var React = require("react");
    var ReactDOM = require("react-dom");
    var TestUtils = require("react-addons-test-utils");
    var PropTypes = require("prop-types");
    var createReactClass = require("create-react-class");

    var Outlet, Plug, outlet_registry;

    var TestDiv = createReactClass({
        propTypes: {
            children: PropTypes.node
        },

        render: function() {
            return <div>{this.props.children}</div>;
        }
    });

    beforeEach(function() {
        Outlet = require("../src/outlet");
        Plug = require("../src/plug");
        outlet_registry = require("../src/outlet_registry");
    });

    describe("Outlet", function() {
        it("supports generating an unique id", function() {
            expect(Outlet.new_outlet_id())
                .not.toEqual(Outlet.new_outlet_id());
        });

        it("receives children from its associated Plug", function() {
            var id = Outlet.new_outlet_id();

            expect(outlet_registry.is_occupied(id)).toBeFalsy();

            var tree = TestUtils.renderIntoDocument(
                <TestDiv>
                    <Outlet outletId={ id } className="outlet-content" />
                    <Plug outletId={ id }>winner</Plug>
                </TestDiv>
            );

            expect(outlet_registry.is_occupied(id)).toBeTruthy();

            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            expect(ReactDOM.findDOMNode(outlet_content).textContent).toEqual("winner");

            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(ReactDOM.findDOMNode(plug)).toBeNull();
        });

        it("it receives updates from its associated Plug", function() {
            var id = Outlet.new_outlet_id();

            var PlugWrap = createReactClass({
                propTypes: { outletId: PropTypes.string },

                getInitialState: function() { return { content: undefined, renderPlug: false }; },

                render: function() {
                    if (this.state.renderPlug) {
                        return <Plug outletId={ this.props.outletId }>{ this.state.content }</Plug>;
                    } else {
                        return null;
                    }
                }
            });

            var tree = TestUtils.renderIntoDocument(
                <TestDiv>
                    <Outlet outletId={ id } className="outlet-content" />
                    <PlugWrap outletId={ id } />
                </TestDiv>
            );

            expect(outlet_registry.is_occupied(id)).toBeFalsy();

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            }).toThrow();

            var plug_wrap = TestUtils.findRenderedComponentWithType(tree, PlugWrap);

            plug_wrap.setState({ renderPlug: true });

            expect(outlet_registry.is_occupied(id)).toBeFalsy();

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            }).toThrow();

            plug_wrap.setState({ content: "foobar" });

            expect(outlet_registry.is_occupied(id)).toBeTruthy();

            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");

            expect(ReactDOM.findDOMNode(outlet_content).textContent).toBe("foobar");

            plug_wrap.setState({ content: undefined });

            expect(outlet_registry.is_occupied(id)).toBeFalsy();

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            }).toThrow();

            plug_wrap.setState({ content: <b>testing</b> });
            outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            expect(ReactDOM.findDOMNode(outlet_content).textContent).toBe("testing");

            expect(outlet_registry.is_occupied(id)).toBeTruthy();

            plug_wrap.setState({ renderPlug: false });

            expect(outlet_registry.is_occupied(id)).toBeFalsy();

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-content");
            }).toThrow();
        });

        it("it receives updates from its associated Plug across React trees", function() {
            var id = Outlet.new_outlet_id();

            var PlugWrap = createReactClass({
                propTypes: { outletId: PropTypes.string },
                getInitialState: function() { return { content: undefined }; },

                render: function() {
                    return <Plug outletId={ this.props.outletId }>{ this.state.content }</Plug>;
                }
            });

            var tree = TestUtils.renderIntoDocument(<PlugWrap outletId={ id } />);
            var tree2 = TestUtils.renderIntoDocument(<Outlet outletId={ id } className="outlet-content" />);

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree2, "outlet-content");
            }).toThrow();

            var plug_wrap = TestUtils.findRenderedComponentWithType(tree, PlugWrap);

            plug_wrap.setState({ content: "foobar" });
            var outlet_content = TestUtils.findRenderedDOMComponentWithClass(tree2, "outlet-content");
            expect(ReactDOM.findDOMNode(outlet_content).textContent).toBe("foobar");

            plug_wrap.setState({ content: undefined });

            expect(function() {
                TestUtils.findRenderedDOMComponentWithClass(tree2, "outlet-content");
            }).toThrow();
        });

        it("supports multiple plug/outlet pairs at the same time", function() {
            var id = Outlet.new_outlet_id();
            var id2 = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <TestDiv>
                    <Outlet outletId={ id } className="outlet-first" />
                    <Plug outletId={ id }>first</Plug>
                    <Plug outletId={ id2 }>second</Plug>
                    <Outlet outletId={ id2 } className="outlet-second" />
                </TestDiv>
            );

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-first")
            ).textContent).toBe("first");

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedDOMComponentWithClass(tree, "outlet-second")
            ).textContent).toBe("second");
        });

        it("fails to register an outlet for an existing id", function() {
            var id = Outlet.new_outlet_id();

            var test = function() {
                TestUtils.renderIntoDocument(
                    <TestDiv>
                        <Outlet outletId={ id } />
                        <Outlet outletId={ id } />
                    </TestDiv>
                );
            };

            expect(test).toThrow();
        });

        it("cleans-up after itself", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");

            ReactDOM.render(<Outlet outletId={ id } />, container);

            // ensure that the outlet registered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();

            // cause the tree to be unmounted
            expect(ReactDOM.unmountComponentAtNode(container)).toBeTruthy();

            // ensure that the outlet unregistered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });

        it("cleans up after itself in complex scenarios", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");
            var container2 = document.createElement("div");

            // outlet is rendered in one tree
            ReactDOM.render(<Outlet outletId={ id } />, container);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();

            // plug is rendered in another tree
            ReactDOM.render(<Plug outletId={ id } />, container2);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();

            // unmount the outlet
            expect(ReactDOM.unmountComponentAtNode(container)).toBeTruthy();

            // outlet should still exist in the registry
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeFalsy();

            expect(ReactDOM.unmountComponentAtNode(container2)).toBeTruthy();

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });

        it("comes back from the dead", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");
            var container2 = document.createElement("div");
            var container3 = document.createElement("div");

            var outlet_tree = ReactDOM.render(<Outlet outletId={ id } />, container);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();

            // plug is rendered in another tree
            ReactDOM.render(<Plug outletId={ id }>testing</Plug>, container2);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeTruthy();

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedComponentWithType(outlet_tree, Outlet)
            ).textContent).toBe("testing");

            // unmount the outlet
            expect(ReactDOM.unmountComponentAtNode(container)).toBeTruthy();

            // mount the outlet in another tree
            var outlet_tree_2 = ReactDOM.render(<Outlet outletId={ id } />, container3);

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedComponentWithType(outlet_tree_2, Outlet)
            ).textContent).toBe("testing");

            // unmount the plug
            expect(ReactDOM.unmountComponentAtNode(container2)).toBeTruthy();

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedComponentWithType(outlet_tree_2, Outlet)
            )).toBeNull();

            // outlet should still exist in the registry
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("component")).toBeFalsy();

            expect(ReactDOM.unmountComponentAtNode(container3)).toBeTruthy();

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });

        it("supports clearing all outlets from the registry", function() {
            var id = Outlet.new_outlet_id();
            TestUtils.renderIntoDocument(
                <TestDiv>
                    <Outlet outletId={ id } className="outlet-content" />
                </TestDiv>
            );
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            Outlet.reset();
            expect(outlet_registry.outlets != null
                && typeof outlet_registry.outlets === "object"
                && !Array.isArray(outlet_registry.outlets)
            ).toBeTruthy();
            expect(Object.keys(outlet_registry.outlets).length).toEqual(0);
        });

        it("supports changing its outlet id", function() {
            var id = Outlet.new_outlet_id();
            var id2 = Outlet.new_outlet_id();

            var container = document.createElement("div");
            ReactDOM.render(<Outlet outletId={ id } />, container);

            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();
            expect(outlet_registry.outlets[id].hasOwnProperty("callback")).toBeTruthy();

            ReactDOM.render(<Outlet outletId={ id2 } />, container);

            // id has been removed
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();

            // ...and has been replaced with id2
            expect(outlet_registry.outlets.hasOwnProperty(id2)).toBeTruthy();
            expect(outlet_registry.outlets[id2].hasOwnProperty("callback")).toBeTruthy();
        });
    });

    describe("Plug", function() {
        it("works fine when no outlet is defined", function() {
            var id = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <Plug outletId={ id }>foobar</Plug>
            );

            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(ReactDOM.findDOMNode(plug)).toBeNull();
        });

        it("saves its children for later outlet renders", function() {
            var id = Outlet.new_outlet_id();

            var tree = TestUtils.renderIntoDocument(
                <Plug outletId={ id }>foobar</Plug>
            );

            var plug = TestUtils.findRenderedComponentWithType(tree, Plug);
            expect(ReactDOM.findDOMNode(plug)).toBeNull();

            var tree2 = TestUtils.renderIntoDocument(
                <Outlet outletId={ id } className="tardy-outlet" />
            );

            expect(ReactDOM.findDOMNode(
                TestUtils.findRenderedDOMComponentWithClass(tree2, "tardy-outlet")
            ).textContent).toBe("foobar");
        });

        it("cleans up after itself", function() {
            var id = Outlet.new_outlet_id();
            var container = document.createElement("div");

            ReactDOM.render(<Plug outletId={ id } />, container);

            // ensure that the plug registered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeTruthy();

            // cause the tree to be unmounted
            expect(ReactDOM.unmountComponentAtNode(container)).toBeTruthy();

            // ensure that the plug unregistered itself
            expect(outlet_registry.outlets.hasOwnProperty(id)).toBeFalsy();
        });
    });
});
