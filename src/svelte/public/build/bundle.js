
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/BackButton.svelte generated by Svelte v3.24.1 */
    const file = "src/BackButton.svelte";

    function create_fragment(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = `${`<`}`;
    			attr_dev(button, "class", "backButton svelte-cp8b1n");
    			add_location(button, file, 13, 0, 236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*backButton*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatchEvent = createEventDispatcher();

    	const backButton = _e => {
    		dispatchEvent("backButton");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BackButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BackButton", $$slots, []);

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatchEvent,
    		backButton
    	});

    	return [backButton];
    }

    class BackButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BackButton",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/PortListItem.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/PortListItem.svelte";

    function create_fragment$1(ctx) {
    	let li;
    	let div0;
    	let span0;
    	let t0_value = /*port*/ ctx[0].code + "";
    	let t0;
    	let t1;
    	let div1;
    	let span1;
    	let t3;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = `${/*portName*/ ctx[3]}`;
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = `${/*portTown*/ ctx[2]}`;
    			attr_dev(span0, "class", "portCode svelte-1kqf2go");
    			add_location(span0, file$1, 68, 4, 1509);
    			attr_dev(div0, "class", "portCodeIcon svelte-1kqf2go");
    			add_location(div0, file$1, 67, 2, 1478);
    			attr_dev(span1, "class", "portName svelte-1kqf2go");
    			add_location(span1, file$1, 71, 4, 1592);
    			attr_dev(span2, "class", "portTown svelte-1kqf2go");
    			add_location(span2, file$1, 72, 4, 1637);
    			attr_dev(div1, "class", "portDetails svelte-1kqf2go");
    			add_location(div1, file$1, 70, 2, 1562);
    			attr_dev(li, "class", "svelte-1kqf2go");
    			toggle_class(li, "reversed", /*iconRight*/ ctx[4][/*port*/ ctx[0].code]);
    			add_location(li, file$1, 63, 0, 1389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(li, t1);
    			append_dev(li, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t3);
    			append_dev(div1, span2);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*port*/ 1 && t0_value !== (t0_value = /*port*/ ctx[0].code + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*iconRight, port*/ 17) {
    				toggle_class(li, "reversed", /*iconRight*/ ctx[4][/*port*/ ctx[0].code]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
    	const dispatchEvent = createEventDispatcher();

    	const portSelected = selectedPort => {
    		dispatchEvent("portSelected", selectedPort.code);
    	};

    	let { port } = $$props;
    	const splitIndex = port.name.indexOf("(");
    	const portTown = port.name.slice(0, splitIndex - 1);
    	const portName = port.name.slice(splitIndex + 1, -1);

    	const iconRight = {
    		"LNG": false,
    		"HSB": true,
    		"NAN": false,
    		"DUK": false,
    		"TSA": true,
    		"SWB": false
    	};

    	const writable_props = ["port"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PortListItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortListItem", $$slots, []);
    	const click_handler = _ => portSelected(port);

    	$$self.$$set = $$props => {
    		if ("port" in $$props) $$invalidate(0, port = $$props.port);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatchEvent,
    		portSelected,
    		port,
    		splitIndex,
    		portTown,
    		portName,
    		iconRight
    	});

    	$$self.$inject_state = $$props => {
    		if ("port" in $$props) $$invalidate(0, port = $$props.port);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [port, portSelected, portTown, portName, iconRight, click_handler];
    }

    class PortListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { port: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortListItem",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*port*/ ctx[0] === undefined && !("port" in props)) {
    			console.warn("<PortListItem> was created without expected prop 'port'");
    		}
    	}

    	get port() {
    		throw new Error("<PortListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set port(value) {
    		throw new Error("<PortListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const request = async (method, url, params) => {
        console.log(`Communicator#request`);
        const fetch_options = Object.assign({ method: method }, params);
        console.log(`Communicator#request  request: ${method}: ${url}`, fetch_options);
        // return fetch(url, fetch_options)
        let response = await fetch(url, fetch_options);
        let networkAttempts = 0;
        while (networkAttempts < 5) {
            console.log(`Communicator#request  Requesting...`);
            if (response.status !== 200) {
                networkAttempts = networkAttempts + 1;
                console.log(`Communicator#request  Error detected, retry #${networkAttempts}`);
                response = await request(method, url, params);
            }
            else {
                console.log(`Communicator#request  Reponse valid`);
                break;
            }
        }
        return response;
    };
    const Communicator = {
        getAllPorts: async () => {
            console.log(`Communicator#getAllPorts  Contacting berries...`);
            let response = await request('GET', '/api/cc-route-info', {});
            if (response.status === 200) {
                console.log(`Communicator#getAllPorts  Results valid, returning restults`);
                const parsedJson = await response.json();
                return JSON.parse(parsedJson["page"]);
            }
            else {
                console.log(`Communicator#getAllPorts  Something wrong, return empty array`);
                return [];
            }
        },
        getRouteInfo: async (uri) => {
            console.log(`Communicator#getRouteInfo  fetching route: ${uri}`);
            let response = await request('GET', `/api/current-conditions/${uri}`, {});
            if (response.status === 200) {
                console.log(`Communicator#getRouteInfo  Results valid, returning restults`);
                const parsedJson = await response.json();
                return parsedJson["page"];
            }
            else {
                console.log(`Communicator#getRouteInfo  Something wrong, return empty array`);
                return '';
            }
        }
    };

    const initialValue = new Map;
    const createPortsStore = () => {
        const dataStore = readable(initialValue, createOnSubscribe());
        return {
            subscribe: dataStore.subscribe,
            refresh: () => { }
        };
    };
    const fetchData = async (set) => {
        console.log(`portsStore#fetchData:  fetching ports...`);
        Communicator.getAllPorts().then(newPortsData => {
            console.log(`portsStore#fetchData:  got ports`);
            const finalData = newPortsData.reduce((memo, route) => {
                memo.set(route.code, route);
                return memo;
            }, initialValue);
            set(finalData);
        });
    };
    const createOnSubscribe = () => {
        return (set) => {
            fetchData(set);
            return unsubscribe;
        };
    };
    const unsubscribe = () => { };
    const ports = createPortsStore();

    /* src/PortList.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/PortList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (53:2) {#if backButton}
    function create_if_block(ctx) {
    	let backbutton;
    	let current;
    	backbutton = new BackButton({ $$inline: true });
    	backbutton.$on("backButton", /*backButton_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(backbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(backbutton, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(backbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(backbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(backbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:2) {#if backButton}",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#each sortedPorts as port}
    function create_each_block(ctx) {
    	let portlistitem;
    	let current;

    	portlistitem = new PortListItem({
    			props: { port: /*port*/ ctx[9] },
    			$$inline: true
    		});

    	portlistitem.$on("portSelected", /*portSelected_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(portlistitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portlistitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const portlistitem_changes = {};
    			if (dirty & /*sortedPorts*/ 4) portlistitem_changes.port = /*port*/ ctx[9];
    			portlistitem.$set(portlistitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portlistitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portlistitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portlistitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(57:4) {#each sortedPorts as port}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let header;
    	let t0;
    	let t1;
    	let t2;
    	let ul;
    	let current;
    	let if_block = /*backButton*/ ctx[1] && create_if_block(ctx);
    	let each_value = /*sortedPorts*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			header = element("header");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(header, "class", "svelte-108qigy");
    			add_location(header, file$2, 51, 2, 1275);
    			attr_dev(ul, "class", "svelte-108qigy");
    			add_location(ul, file$2, 55, 2, 1362);
    			attr_dev(section, "class", "portList svelte-108qigy");
    			add_location(section, file$2, 50, 0, 1246);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, header);
    			append_dev(header, t0);
    			append_dev(section, t1);
    			if (if_block) if_block.m(section, null);
    			append_dev(section, t2);
    			append_dev(section, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (/*backButton*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*backButton*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(section, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*sortedPorts*/ 4) {
    				each_value = /*sortedPorts*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $ports;
    	validate_store(ports, "ports");
    	component_subscribe($$self, ports, $$value => $$invalidate(6, $ports = $$value));
    	
    	let { filter = "" } = $$props;
    	let { title = "" } = $$props;
    	let { backButton = false } = $$props;
    	const portsSortOrder = ["LNG", "HSB", "NAN", "DUK", "TSA", "SWB"];
    	const portsSort = (a, b) => portsSortOrder.indexOf(a.code) - portsSortOrder.indexOf(b.code);
    	let sortedPorts = [];
    	const writable_props = ["filter", "title", "backButton"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<PortList> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortList", $$slots, []);

    	function backButton_handler(event) {
    		bubble($$self, event);
    	}

    	function portSelected_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("filter" in $$props) $$invalidate(3, filter = $$props.filter);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("backButton" in $$props) $$invalidate(1, backButton = $$props.backButton);
    	};

    	$$self.$capture_state = () => ({
    		BackButton,
    		PortListItem,
    		ports,
    		filter,
    		title,
    		backButton,
    		portsSortOrder,
    		portsSort,
    		sortedPorts,
    		$ports
    	});

    	$$self.$inject_state = $$props => {
    		if ("filter" in $$props) $$invalidate(3, filter = $$props.filter);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("backButton" in $$props) $$invalidate(1, backButton = $$props.backButton);
    		if ("sortedPorts" in $$props) $$invalidate(2, sortedPorts = $$props.sortedPorts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, $ports*/ 72) {
    			 {
    				if (filter) {
    					$$invalidate(2, sortedPorts = $ports.get(filter).destinationRoutes.sort(portsSort));
    				} else {
    					console.log("PortList#no filter sortem", $ports);
    					let allRoutes = Array.from($ports.values());
    					$$invalidate(2, sortedPorts = allRoutes.sort(portsSort));
    				}
    			}
    		}
    	};

    	return [
    		title,
    		backButton,
    		sortedPorts,
    		filter,
    		backButton_handler,
    		portSelected_handler
    	];
    }

    class PortList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { filter: 3, title: 0, backButton: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortList",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get filter() {
    		throw new Error("<PortList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<PortList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<PortList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PortList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backButton() {
    		throw new Error("<PortList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backButton(value) {
    		throw new Error("<PortList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Clock.svelte generated by Svelte v3.24.1 */

    const file$3 = "src/Clock.svelte";

    function create_fragment$3(ctx) {
    	let span1;
    	let t0;
    	let span0;
    	let t2;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			t0 = text(/*hours*/ ctx[0]);
    			span0 = element("span");
    			span0.textContent = ":";
    			t2 = text(/*secondsAndMeridiem*/ ctx[1]);
    			attr_dev(span0, "class", "blink svelte-1wmevsi");
    			add_location(span0, file$3, 38, 27, 820);
    			attr_dev(span1, "class", "clock svelte-1wmevsi");
    			add_location(span1, file$3, 38, 0, 793);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span1, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { time } = $$props;

    	const formatTime = time => {
    		const date = new Date(time);

    		return date.toLocaleTimeString("en", {
    			hour: "2-digit",
    			minute: "2-digit",
    			hour12: true
    		});
    	};

    	const formattedTime = formatTime(time);
    	const [hours, secondsAndMeridiem] = formattedTime.split(":");
    	const writable_props = ["time"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Clock", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	$$self.$capture_state = () => ({
    		time,
    		formatTime,
    		formattedTime,
    		hours,
    		secondsAndMeridiem
    	});

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hours, secondsAndMeridiem, time];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { time: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*time*/ ctx[2] === undefined && !("time" in props)) {
    			console.warn("<Clock> was created without expected prop 'time'");
    		}
    	}

    	get time() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ProgressBar.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/ProgressBar.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let span;
    	let span_data_label_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			attr_dev(span, "class", "value svelte-60rvhw");
    			set_style(span, "--progress-value", /*progress*/ ctx[1] + "%");
    			attr_dev(span, "data-label", span_data_label_value = /*value*/ ctx[0] > 20 ? `${/*progress*/ ctx[1]}%` : "");
    			add_location(span, file$4, 66, 2, 1320);
    			attr_dev(div, "class", "progress svelte-60rvhw");
    			add_location(div, file$4, 65, 0, 1295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && span_data_label_value !== (span_data_label_value = /*value*/ ctx[0] > 20 ? `${/*progress*/ ctx[1]}%` : "")) {
    				attr_dev(span, "data-label", span_data_label_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { value = 0 } = $$props;
    	const progress = value > 100 ? 100 : value;
    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProgressBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ProgressBar", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ value, progress });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, progress];
    }

    class ProgressBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressBar",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get value() {
    		throw new Error("<ProgressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ProgressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PastDepatureListView.svelte generated by Svelte v3.24.1 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/PastDepatureListView.svelte";

    function create_fragment$5(ctx) {
    	let li;
    	let div0;
    	let t0;
    	let clock0;
    	let t1;
    	let progressbar;
    	let t2;
    	let div1;
    	let t3_value = (/*arrived*/ ctx[2] ? "Arrived" : "ETA") + "";
    	let t3;
    	let t4;
    	let clock1;
    	let current;

    	clock0 = new Clock({
    			props: { time: /*departureTime*/ ctx[0] },
    			$$inline: true
    		});

    	progressbar = new ProgressBar({
    			props: {
    				value: Math.round(/*percentComplete*/ ctx[3])
    			},
    			$$inline: true
    		});

    	clock1 = new Clock({
    			props: { time: /*arrivalTime*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			t0 = text("Departed\n      ");
    			create_component(clock0.$$.fragment);
    			t1 = space();
    			create_component(progressbar.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(clock1.$$.fragment);
    			attr_dev(div0, "class", "departure svelte-1w81tqt");
    			add_location(div0, file$5, 45, 4, 1418);
    			attr_dev(div1, "class", "arrival svelte-1w81tqt");
    			add_location(div1, file$5, 50, 4, 1565);
    			attr_dev(li, "class", "svelte-1w81tqt");
    			add_location(li, file$5, 44, 0, 1409);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, t0);
    			mount_component(clock0, div0, null);
    			append_dev(li, t1);
    			mount_component(progressbar, li, null);
    			append_dev(li, t2);
    			append_dev(li, div1);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			mount_component(clock1, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock0.$$.fragment, local);
    			transition_in(progressbar.$$.fragment, local);
    			transition_in(clock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock0.$$.fragment, local);
    			transition_out(progressbar.$$.fragment, local);
    			transition_out(clock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(clock0);
    			destroy_component(progressbar);
    			destroy_component(clock1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	
    	let { departure } = $$props;

    	// departure = {time: number, status: {time: number, status: string}}
    	const { time: departureTime, status: statusObj } = departure;

    	const { time: arrivalTime, status: statusStr } = statusObj;

    	const arrived = (statusStr === null || statusStr === void 0
    	? void 0
    	: statusStr.toUpperCase()) === "ARRIVED";

    	const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
    	const now = new Date(nowStr).getTime();
    	const percentComplete = (now - departureTime) / (arrivalTime - departureTime) * 100;
    	console.log(`departureTime:${departureTime}, now:${now}, arrivalTime:${arrivalTime}, percentComplete:${percentComplete}`);

    	const formatTime = time => {
    		const date = new Date(time);

    		return date.toLocaleTimeString("en", {
    			hour: "2-digit",
    			minute: "2-digit",
    			hour12: true
    		});
    	};

    	const writable_props = ["departure"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<PastDepatureListView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PastDepatureListView", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("departure" in $$props) $$invalidate(4, departure = $$props.departure);
    	};

    	$$self.$capture_state = () => ({
    		Clock,
    		ProgressBar,
    		departure,
    		departureTime,
    		statusObj,
    		arrivalTime,
    		statusStr,
    		arrived,
    		nowStr,
    		now,
    		percentComplete,
    		formatTime
    	});

    	$$self.$inject_state = $$props => {
    		if ("departure" in $$props) $$invalidate(4, departure = $$props.departure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [departureTime, arrivalTime, arrived, percentComplete, departure];
    }

    class PastDepatureListView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { departure: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PastDepatureListView",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*departure*/ ctx[4] === undefined && !("departure" in props)) {
    			console_1$1.warn("<PastDepatureListView> was created without expected prop 'departure'");
    		}
    	}

    	get departure() {
    		throw new Error("<PastDepatureListView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set departure(value) {
    		throw new Error("<PastDepatureListView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/FutureDepatureListView.svelte generated by Svelte v3.24.1 */

    const { console: console_1$2 } = globals;
    const file$6 = "src/FutureDepatureListView.svelte";

    // (71:4) {#if departure.deckSpace.mixed}
    function create_if_block$1(ctx) {
    	let span;
    	let t;
    	let progressbar;
    	let current;

    	progressbar = new ProgressBar({
    			props: {
    				value: 100 - /*departure*/ ctx[0].deckSpace.mixed
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text("Mixed: ");
    			create_component(progressbar.$$.fragment);
    			attr_dev(span, "class", "svelte-2uxrz2");
    			add_location(span, file$6, 71, 6, 1529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			mount_component(progressbar, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const progressbar_changes = {};
    			if (dirty & /*departure*/ 1) progressbar_changes.value = 100 - /*departure*/ ctx[0].deckSpace.mixed;
    			progressbar.$set(progressbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progressbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progressbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(progressbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(71:4) {#if departure.deckSpace.mixed}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let li;
    	let div0;
    	let t0;
    	let clock;
    	let t1;
    	let div1;
    	let span;
    	let t2;
    	let progressbar;
    	let t3;
    	let current;

    	clock = new Clock({
    			props: { time: /*departure*/ ctx[0].time },
    			$$inline: true
    		});

    	progressbar = new ProgressBar({
    			props: {
    				value: 100 - /*departure*/ ctx[0].status.percentAvailable
    			},
    			$$inline: true
    		});

    	let if_block = /*departure*/ ctx[0].deckSpace.mixed && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			t0 = text("Departs\n    ");
    			create_component(clock.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			span = element("span");
    			t2 = text("Total: ");
    			create_component(progressbar.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "departure svelte-2uxrz2");
    			add_location(div0, file$6, 64, 2, 1290);
    			attr_dev(span, "class", "svelte-2uxrz2");
    			add_location(span, file$6, 69, 6, 1403);
    			attr_dev(div1, "class", "deckspace svelte-2uxrz2");
    			add_location(div1, file$6, 68, 2, 1373);
    			attr_dev(li, "class", "svelte-2uxrz2");
    			add_location(li, file$6, 63, 0, 1283);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, t0);
    			mount_component(clock, div0, null);
    			append_dev(li, t1);
    			append_dev(li, div1);
    			append_dev(div1, span);
    			append_dev(span, t2);
    			mount_component(progressbar, span, null);
    			append_dev(div1, t3);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const clock_changes = {};
    			if (dirty & /*departure*/ 1) clock_changes.time = /*departure*/ ctx[0].time;
    			clock.$set(clock_changes);
    			const progressbar_changes = {};
    			if (dirty & /*departure*/ 1) progressbar_changes.value = 100 - /*departure*/ ctx[0].status.percentAvailable;
    			progressbar.$set(progressbar_changes);

    			if (/*departure*/ ctx[0].deckSpace.mixed) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*departure*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);
    			transition_in(progressbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			transition_out(progressbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(clock);
    			destroy_component(progressbar);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	
    	let { departure } = $$props;
    	console.log(`FutureDeparture`, departure);

    	// departure = {
    	//   time: number,
    	//   status: {
    	//     percentAvailable: number
    	//   },
    	//   ferry: {
    	//     name: string,
    	//     url: string
    	//   },
    	//   deckSpace: {
    	//     total: number,
    	//     standard: number,
    	//     mixed: number
    	//   }
    	// }
    	const formatTime = time => {
    		const date = new Date(time);

    		return date.toLocaleTimeString("en", {
    			hour: "2-digit",
    			minute: "2-digit",
    			hour12: true
    		});
    	};

    	const writable_props = ["departure"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<FutureDepatureListView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FutureDepatureListView", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("departure" in $$props) $$invalidate(0, departure = $$props.departure);
    	};

    	$$self.$capture_state = () => ({
    		Clock,
    		ProgressBar,
    		departure,
    		formatTime
    	});

    	$$self.$inject_state = $$props => {
    		if ("departure" in $$props) $$invalidate(0, departure = $$props.departure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [departure];
    }

    class FutureDepatureListView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { departure: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FutureDepatureListView",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*departure*/ ctx[0] === undefined && !("departure" in props)) {
    			console_1$2.warn("<FutureDepatureListView> was created without expected prop 'departure'");
    		}
    	}

    	get departure() {
    		throw new Error("<FutureDepatureListView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set departure(value) {
    		throw new Error("<FutureDepatureListView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const cleanString = (str) => {
        // console.log(`cleanString():`, str)
        if (str) {
            return str.trim().replace(/\r?\n|\r|/g, '').replace(/  +/g, ' ');
        }
        return '';
    };
    // const parking available = querySelector('.t-parking-padding').querySelector('header').textContent.trim().replace(/\r?\n|\r|/g,'').replace(/  +/g, ' ')
    // const sailingDuration = tableRows[0].querySelector('b').textContent.trim()
    const RoutePageParser = (page) => {
        // console.log(`RoutePageParser:`, page)
        let parser = new DOMParser();
        const doc = parser.parseFromString(page, "text/html");
        // console.log(`RoutePageParser doc:`, doc)
        const parseTime = (fullTimeString) => {
            // console.log(`parseTime(${fullTimeString})`)
            const [timeString, meridiem] = fullTimeString.split(' ');
            let [hours, minutes] = timeString.split(':').map((x) => parseInt(x));
            if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
                // console.log('its pm')
                hours = hours + 12;
            }
            const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
            // console.log('whats anowstr', nowStr)
            const now = new Date(nowStr);
            // console.log('now:', now)
            const timeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            // console.log(`Today at ${hours} ${minutes}: `, timeToday)
            return timeToday.getTime();
        };
        const parsePastStatus = (statusString) => {
            const [status, timeStr, meridiem] = statusString.split(' ');
            console.log(`arsing past status time, parseTime(${timeStr} ${meridiem})`);
            const time = parseTime(`${timeStr} ${meridiem}`);
            return {
                status: status.slice(0, -1),
                time: time
            };
        };
        const parseFutureStatus = (statusString) => {
            const [percentStr, _availableStr] = statusString.split(' ');
            return {
                percentAvailable: parseInt(percentStr.slice(0, -1))
            };
        };
        const parsePercent = (percentString) => {
            if (percentString && percentString.length > 2) {
                return parseInt(percentString.slice(0, -1));
            }
            return undefined;
        };
        const departures = () => {
            let departures = {
                future: [],
                past: []
            };
            const departuresTable = doc.querySelector('.detail-departure-table');
            if (departuresTable) {
                const tableRows = departuresTable.querySelectorAll('tr');
                for (let i = 0; i < tableRows.length; i++) {
                    // console.log(`RoutePageParser#departures  tableRow[${i}]`)
                    if (i < 2) {
                        // console.log('RoutePageParser#departures  skip row')
                        continue;
                    }
                    let tableRow = tableRows[i];
                    if (!tableRow.classList.contains('toggle-div')) {
                        // console.log(`RoutePageParser#departures  row should contain time and status`)
                        // describes a departure
                        const [timeElement, statusElement, togglerElement] = Array.from(tableRow.querySelectorAll('td'));
                        const timeString = cleanString(timeElement.textContent);
                        const statusString = cleanString(statusElement.textContent);
                        if (togglerElement.classList.contains('toggle-arrow')) {
                            // console.log('RoutePageParser#departures  row has further info')
                            // a future departure
                            const extraInfo = tableRows[i + 1];
                            // console.log('RoutePageParser#departures  further info should be here:', extraInfo)
                            const ferryData = extraInfo.querySelector('.sailing-ferry-name');
                            const deckSpaceData = extraInfo.querySelector('#deckSpace');
                            let deckSpaceObject;
                            if (deckSpaceData) {
                                const [totalSpace, standardSpace, mixedSpace] = Array.from(deckSpaceData.querySelectorAll('.progress-bar'));
                                console.log('wtf is the deckspace [total, standard, mixed]:', totalSpace, standardSpace, mixedSpace);
                                deckSpaceObject = {
                                    total: parsePercent(cleanString(totalSpace === null || totalSpace === void 0 ? void 0 : totalSpace.children[0].textContent)),
                                    standard: parsePercent(cleanString(standardSpace === null || standardSpace === void 0 ? void 0 : standardSpace.children[0].textContent)),
                                    mixed: parsePercent(cleanString(mixedSpace === null || mixedSpace === void 0 ? void 0 : mixedSpace.children[0].textContent))
                                };
                            }
                            else {
                                deckSpaceObject = {};
                            }
                            const futureDeparture = {
                                time: parseTime(cleanString(timeElement.textContent)),
                                status: parseFutureStatus(cleanString(statusElement.textContent)),
                                ferry: {
                                    name: cleanString((ferryData === null || ferryData === void 0 ? void 0 : ferryData.textContent) || null),
                                    url: (ferryData === null || ferryData === void 0 ? void 0 : ferryData.getAttribute("href")) || ''
                                },
                                deckSpace: deckSpaceObject
                            };
                            departures.future.push(futureDeparture);
                        }
                        else {
                            // console.log('RoutePageParser#departures no toggle arrow, its a past departure')
                            // a past departure
                            departures.past.push({
                                time: parseTime(timeString),
                                status: parsePastStatus(statusString)
                            });
                        }
                    }
                }
            }
            else {
                departures = {
                    future: [],
                    past: []
                };
            }
            return departures;
        };
        return {
            departures: departures
        };
    };

    const routeStatus = async (originCode, destinationCode) => {
        let origin = {};
        console.log('routeStauts attempt to read from store...');
        ports.subscribe((value) => {
            console.log(`reading store value, looking for ${originCode}`, value);
            const wtf = value.get(originCode);
            console.log('wtf is wtf', wtf);
            origin = value.get(originCode) || {};
            // - sort out the possibly undefined problem here
            // - get to finishing this stores rewrite
            // - try to get it back to where it was before but
            //   with a better codebase this time (hopefully)
            // - swing back around on the concept of baseline
            //   designing
        });
        console.log('origin should now be set:', origin);
        const destination = origin.destinationRoutes.find(destination => destination.code == destinationCode) || {};
        const routeStatusUrl = `${origin.travelRouteName}-${destination.travelRouteName}/${origin.code}-${destination.code}`;
        const routeStatusPageString = await Communicator.getRouteInfo(routeStatusUrl);
        const parser = RoutePageParser(routeStatusPageString);
        const routeStatus = parser.departures();
        return routeStatus;
    };

    /* src/RouteViewer.svelte generated by Svelte v3.24.1 */
    const file$7 = "src/RouteViewer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (64:4) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[13].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Something went wrong: ");
    			t1 = text(t1_value);
    			add_location(p, file$7, 64, 6, 1772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(64:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (52:4) {:then routeStatus}
    function create_then_block(ctx) {
    	let ul0;
    	let t0;
    	let clock;
    	let t1;
    	let ul1;
    	let current;
    	let each_value_1 = /*routeStatus*/ ctx[6].past;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	clock = new Clock({
    			props: { time: /*now*/ ctx[1] },
    			$$inline: true
    		});

    	let each_value = /*routeStatus*/ ctx[6].future;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			create_component(clock.$$.fragment);
    			t1 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "pastDepartures svelte-18kan3u");
    			add_location(ul0, file$7, 52, 8, 1348);
    			attr_dev(ul1, "class", "futureDepartures svelte-18kan3u");
    			add_location(ul1, file$7, 58, 8, 1561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			insert_dev(target, t0, anchor);
    			mount_component(clock, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*routeStatusPromise*/ 1) {
    				each_value_1 = /*routeStatus*/ ctx[6].past;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*routeStatusPromise*/ 1) {
    				each_value = /*routeStatus*/ ctx[6].future;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(clock.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(clock.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(clock, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(52:4) {:then routeStatus}",
    		ctx
    	});

    	return block;
    }

    // (54:10) {#each routeStatus.past as pastDeparture}
    function create_each_block_1(ctx) {
    	let pastdepaturelistview;
    	let current;

    	pastdepaturelistview = new PastDepatureListView({
    			props: { departure: /*pastDeparture*/ ctx[10] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pastdepaturelistview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pastdepaturelistview, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pastdepaturelistview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pastdepaturelistview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pastdepaturelistview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(54:10) {#each routeStatus.past as pastDeparture}",
    		ctx
    	});

    	return block;
    }

    // (60:10) {#each routeStatus.future as futureDeparture}
    function create_each_block$1(ctx) {
    	let futuredeparturelistview;
    	let current;

    	futuredeparturelistview = new FutureDepatureListView({
    			props: { departure: /*futureDeparture*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(futuredeparturelistview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(futuredeparturelistview, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(futuredeparturelistview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(futuredeparturelistview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(futuredeparturelistview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(60:10) {#each routeStatus.future as futureDeparture}",
    		ctx
    	});

    	return block;
    }

    // (50:31)        <p>Awaiting Route data...</p>     {:then routeStatus}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Awaiting Route data...";
    			add_location(p, file$7, 50, 6, 1286);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(50:31)        <p>Awaiting Route data...</p>     {:then routeStatus}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let section1;
    	let header;
    	let t1;
    	let backbutton;
    	let t2;
    	let section0;
    	let promise;
    	let current;
    	backbutton = new BackButton({ $$inline: true });
    	backbutton.$on("backButton", /*backButton_handler*/ ctx[4]);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 13,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*routeStatusPromise*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			section1 = element("section");
    			header = element("header");
    			header.textContent = "When?";
    			t1 = space();
    			create_component(backbutton.$$.fragment);
    			t2 = space();
    			section0 = element("section");
    			info.block.c();
    			attr_dev(header, "class", "svelte-18kan3u");
    			add_location(header, file$7, 46, 2, 1167);
    			attr_dev(section0, "class", "routes svelte-18kan3u");
    			add_location(section0, file$7, 48, 2, 1223);
    			attr_dev(section1, "class", "routeViewer svelte-18kan3u");
    			add_location(section1, file$7, 45, 0, 1135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section1, anchor);
    			append_dev(section1, header);
    			append_dev(section1, t1);
    			mount_component(backbutton, section1, null);
    			append_dev(section1, t2);
    			append_dev(section1, section0);
    			info.block.m(section0, info.anchor = null);
    			info.mount = () => section0;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(backbutton.$$.fragment, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(backbutton.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section1);
    			destroy_component(backbutton);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { originCode } = $$props;
    	let { destinationCode } = $$props;
    	let routeStatusPromise = routeStatus(originCode, destinationCode);
    	const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
    	const now = new Date(nowStr).getTime();
    	const writable_props = ["originCode", "destinationCode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouteViewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouteViewer", $$slots, []);

    	function backButton_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("originCode" in $$props) $$invalidate(2, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(3, destinationCode = $$props.destinationCode);
    	};

    	$$self.$capture_state = () => ({
    		BackButton,
    		PastDepatureListView,
    		FutureDepartureListView: FutureDepatureListView,
    		routeStaus: routeStatus,
    		Clock,
    		originCode,
    		destinationCode,
    		routeStatusPromise,
    		nowStr,
    		now
    	});

    	$$self.$inject_state = $$props => {
    		if ("originCode" in $$props) $$invalidate(2, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(3, destinationCode = $$props.destinationCode);
    		if ("routeStatusPromise" in $$props) $$invalidate(0, routeStatusPromise = $$props.routeStatusPromise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [routeStatusPromise, now, originCode, destinationCode, backButton_handler];
    }

    class RouteViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { originCode: 2, destinationCode: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouteViewer",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*originCode*/ ctx[2] === undefined && !("originCode" in props)) {
    			console.warn("<RouteViewer> was created without expected prop 'originCode'");
    		}

    		if (/*destinationCode*/ ctx[3] === undefined && !("destinationCode" in props)) {
    			console.warn("<RouteViewer> was created without expected prop 'destinationCode'");
    		}
    	}

    	get originCode() {
    		throw new Error("<RouteViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set originCode(value) {
    		throw new Error("<RouteViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get destinationCode() {
    		throw new Error("<RouteViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set destinationCode(value) {
    		throw new Error("<RouteViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$8 = "src/App.svelte";

    // (88:6) {:else}
    function create_else_block(ctx) {
    	let portlist;
    	let current;

    	portlist = new PortList({
    			props: { title: "Origin?" },
    			$$inline: true
    		});

    	portlist.$on("portSelected", /*portSelected_handler_1*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(portlist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portlist, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portlist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(88:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:27) 
    function create_if_block_1(ctx) {
    	let portlist;
    	let current;

    	portlist = new PortList({
    			props: {
    				filter: /*originCode*/ ctx[0],
    				title: "Destination?",
    				backButton: true
    			},
    			$$inline: true
    		});

    	portlist.$on("portSelected", /*portSelected_handler*/ ctx[3]);
    	portlist.$on("backButton", /*onBackButton*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(portlist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portlist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const portlist_changes = {};
    			if (dirty & /*originCode*/ 1) portlist_changes.filter = /*originCode*/ ctx[0];
    			portlist.$set(portlist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portlist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(80:27) ",
    		ctx
    	});

    	return block;
    }

    // (78:6) {#if originCode && destinationCode}
    function create_if_block$2(ctx) {
    	let routeviewer;
    	let current;

    	routeviewer = new RouteViewer({
    			props: {
    				originCode: /*originCode*/ ctx[0],
    				destinationCode: /*destinationCode*/ ctx[1]
    			},
    			$$inline: true
    		});

    	routeviewer.$on("backButton", /*onBackButton*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(routeviewer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(routeviewer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const routeviewer_changes = {};
    			if (dirty & /*originCode*/ 1) routeviewer_changes.originCode = /*originCode*/ ctx[0];
    			if (dirty & /*destinationCode*/ 2) routeviewer_changes.destinationCode = /*destinationCode*/ ctx[1];
    			routeviewer.$set(routeviewer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routeviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routeviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(routeviewer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(78:6) {#if originCode && destinationCode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let header;
    	let t1;
    	let main;
    	let section;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*originCode*/ ctx[0] && /*destinationCode*/ ctx[1]) return 0;
    		if (/*originCode*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			header.textContent = "Feasy Berries";
    			t1 = space();
    			main = element("main");
    			section = element("section");
    			if_block.c();
    			attr_dev(header, "class", "svelte-19377lf");
    			add_location(header, file$8, 72, 2, 1853);
    			attr_dev(section, "class", "svelte-19377lf");
    			add_location(section, file$8, 76, 4, 1905);
    			attr_dev(main, "class", "svelte-19377lf");
    			add_location(main, file$8, 75, 2, 1894);
    			attr_dev(div, "class", "root svelte-19377lf");
    			add_location(div, file$8, 71, 0, 1832);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, header);
    			append_dev(div, t1);
    			append_dev(div, main);
    			append_dev(main, section);
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(section, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let originCode;
    	let destinationCode;

    	const onBackButton = _e => {
    		if (destinationCode) {
    			$$invalidate(1, destinationCode = "");
    		} else {
    			$$invalidate(0, originCode = "");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const portSelected_handler = e => $$invalidate(1, destinationCode = e.detail);
    	const portSelected_handler_1 = e => $$invalidate(0, originCode = e.detail);

    	$$self.$capture_state = () => ({
    		PortList,
    		RouteViewer,
    		originCode,
    		destinationCode,
    		onBackButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("originCode" in $$props) $$invalidate(0, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(1, destinationCode = $$props.destinationCode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		originCode,
    		destinationCode,
    		onBackButton,
    		portSelected_handler,
    		portSelected_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
