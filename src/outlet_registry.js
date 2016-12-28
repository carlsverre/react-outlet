function OutletRegistry() {
    this.outlets = {};
    this._unique_id_gen = 0;
}

OutletRegistry.prototype.generate_id = function() {
    this._unique_id_gen += 1;
    return "Outlet" + this._unique_id_gen.toString();
};

OutletRegistry.prototype.register = function(outlet_id, callback) {
    if (!this.outlets.hasOwnProperty(outlet_id)) {
        this.outlets[outlet_id] = {};
    } else {
        if (this.outlets[outlet_id].hasOwnProperty("callback")) {
            throw new Error("Another Outlet has already registered for outlet: " + outlet_id);
        }
    }

    var outlet = this.outlets[outlet_id];
    outlet.callback = callback;
    if (outlet.hasOwnProperty("component")) {
        // the plug registered first, do an initial update
        outlet.callback(outlet.component);
    }
};

OutletRegistry.prototype.unregister_outlet = function(outlet_id) {
    if (this.outlets.hasOwnProperty(outlet_id)) {
        var outlet = this.outlets[outlet_id];
        delete outlet.callback;
        if (!outlet.hasOwnProperty("component")) {
            delete this.outlets[outlet_id];
        }
    }
};

OutletRegistry.prototype.unregister_plug = function(outlet_id) {
    if (this.outlets.hasOwnProperty(outlet_id)) {
        var outlet = this.outlets[outlet_id];
        delete outlet.component;
        if (!outlet.hasOwnProperty("callback")) {
            delete this.outlets[outlet_id];
        } else {
            // signal the outlet to render null
            outlet.callback(null);
        }
    }
};

OutletRegistry.prototype.update = function(outlet_id, component) {
    if (!this.outlets.hasOwnProperty(outlet_id)) {
        this.outlets[outlet_id] = {};
    }
    var outlet = this.outlets[outlet_id];
    outlet.component = component;
    if (outlet.hasOwnProperty("callback")) {
        outlet.callback(component);
    }
};

OutletRegistry.prototype.is_occupied = function(outlet_id) {
    if (this.outlets.hasOwnProperty(outlet_id)) {
        return this.outlets[outlet_id].component !== undefined;
    }
    return false;
};

OutletRegistry.prototype.reset = function(){
    this.outlets = {};
};

module.exports = new OutletRegistry();
