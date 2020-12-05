
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
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

    /* src/PortMapView.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/PortMapView.svelte";

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
    			attr_dev(span0, "class", "portCode svelte-v29uk8");
    			add_location(span0, file$1, 68, 4, 1470);
    			attr_dev(div0, "class", "portCodeIcon svelte-v29uk8");
    			add_location(div0, file$1, 67, 2, 1439);
    			attr_dev(span1, "class", "portName svelte-v29uk8");
    			add_location(span1, file$1, 71, 4, 1553);
    			attr_dev(span2, "class", "portTown svelte-v29uk8");
    			add_location(span2, file$1, 72, 4, 1598);
    			attr_dev(div1, "class", "portDetails svelte-v29uk8");
    			add_location(div1, file$1, 70, 2, 1523);
    			attr_dev(li, "class", "svelte-v29uk8");
    			toggle_class(li, "reversed", /*iconRight*/ ctx[4][/*port*/ ctx[0].code]);
    			add_location(li, file$1, 63, 0, 1350);
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
    		dispatchEvent("portSelected", selectedPort);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PortMapView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortMapView", $$slots, []);
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

    class PortMapView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { port: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortMapView",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*port*/ ctx[0] === undefined && !("port" in props)) {
    			console.warn("<PortMapView> was created without expected prop 'port'");
    		}
    	}

    	get port() {
    		throw new Error("<PortMapView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set port(value) {
    		throw new Error("<PortMapView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/RouteSelector.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$2 = "src/RouteSelector.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (65:2) {:else}
    function create_else_block(ctx) {
    	let header;
    	let t1;
    	let backbutton;
    	let t2;
    	let ul;
    	let current;
    	backbutton = new BackButton({ $$inline: true });
    	backbutton.$on("backButton", /*backButton_handler*/ ctx[7]);
    	let each_value_1 = /*origin*/ ctx[0].destinationRoutes;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			header = element("header");
    			header.textContent = "Destination?";
    			t1 = space();
    			create_component(backbutton.$$.fragment);
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(header, "class", "svelte-1t0nfg");
    			add_location(header, file$2, 65, 4, 1589);
    			attr_dev(ul, "class", "svelte-1t0nfg");
    			add_location(ul, file$2, 67, 4, 1656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(backbutton, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*origin, destinationSelected*/ 17) {
    				each_value_1 = /*origin*/ ctx[0].destinationRoutes;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(backbutton.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(backbutton.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			destroy_component(backbutton, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(65:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if objectIsEmpty(origin)}
    function create_if_block(ctx) {
    	let header;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*sortedPorts*/ ctx[1];
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
    			header = element("header");
    			header.textContent = "Origin?";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(header, "class", "svelte-1t0nfg");
    			add_location(header, file$2, 58, 4, 1420);
    			attr_dev(ul, "class", "svelte-1t0nfg");
    			add_location(ul, file$2, 59, 4, 1449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sortedPorts, originSelected*/ 10) {
    				each_value = /*sortedPorts*/ ctx[1];
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(58:2) {#if objectIsEmpty(origin)}",
    		ctx
    	});

    	return block;
    }

    // (69:6) {#each origin.destinationRoutes as port}
    function create_each_block_1(ctx) {
    	let portmapview;
    	let current;

    	portmapview = new PortMapView({
    			props: { port: /*port*/ ctx[9] },
    			$$inline: true
    		});

    	portmapview.$on("portSelected", /*destinationSelected*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(portmapview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portmapview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const portmapview_changes = {};
    			if (dirty & /*origin*/ 1) portmapview_changes.port = /*port*/ ctx[9];
    			portmapview.$set(portmapview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portmapview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portmapview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portmapview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(69:6) {#each origin.destinationRoutes as port}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#each sortedPorts as port}
    function create_each_block(ctx) {
    	let portmapview;
    	let current;

    	portmapview = new PortMapView({
    			props: { port: /*port*/ ctx[9] },
    			$$inline: true
    		});

    	portmapview.$on("portSelected", /*originSelected*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(portmapview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(portmapview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const portmapview_changes = {};
    			if (dirty & /*sortedPorts*/ 2) portmapview_changes.port = /*port*/ ctx[9];
    			portmapview.$set(portmapview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(portmapview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(portmapview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(portmapview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(61:6) {#each sortedPorts as port}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*origin*/ 1) show_if = !!/*objectIsEmpty*/ ctx[2](/*origin*/ ctx[0]);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if_block.c();
    			attr_dev(section, "class", "routeSelector svelte-1t0nfg");
    			add_location(section, file$2, 56, 0, 1354);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

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
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
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
    	
    	let { routesData } = $$props;
    	let { origin } = $$props;
    	let { destination } = $$props;
    	const portsSort = ["LNG", "HSB", "NAN", "DUK", "TSA", "SWB"];
    	let sortedPorts = [];

    	if (routesData.length > 0) ; else {
    		sortedPorts.length = 0;
    	}

    	console.log("dafuq these ports ", sortedPorts);

    	const objectIsEmpty = obj => {
    		return Object.keys(obj).length === 0 && obj.constructor === Object;
    	};

    	const originSelected = event => {
    		console.log("RouteSelector# setting a new origin port:", event.detail);
    		$$invalidate(0, origin = event.detail);
    	};

    	const destinationSelected = event => {
    		$$invalidate(5, destination = event.detail);
    	};

    	const writable_props = ["routesData", "origin", "destination"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RouteSelector> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouteSelector", $$slots, []);

    	function backButton_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routesData" in $$props) $$invalidate(6, routesData = $$props.routesData);
    		if ("origin" in $$props) $$invalidate(0, origin = $$props.origin);
    		if ("destination" in $$props) $$invalidate(5, destination = $$props.destination);
    	};

    	$$self.$capture_state = () => ({
    		BackButton,
    		PortMapView,
    		routesData,
    		origin,
    		destination,
    		portsSort,
    		sortedPorts,
    		objectIsEmpty,
    		originSelected,
    		destinationSelected
    	});

    	$$self.$inject_state = $$props => {
    		if ("routesData" in $$props) $$invalidate(6, routesData = $$props.routesData);
    		if ("origin" in $$props) $$invalidate(0, origin = $$props.origin);
    		if ("destination" in $$props) $$invalidate(5, destination = $$props.destination);
    		if ("sortedPorts" in $$props) $$invalidate(1, sortedPorts = $$props.sortedPorts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routesData*/ 64) {
    			 {
    				if (routesData.length > 0) {
    					$$invalidate(1, sortedPorts = routesData.sort((a, b) => portsSort.indexOf(a.code) - portsSort.indexOf(b.code)));
    				}
    			}
    		}
    	};

    	return [
    		origin,
    		sortedPorts,
    		objectIsEmpty,
    		originSelected,
    		destinationSelected,
    		destination,
    		routesData,
    		backButton_handler
    	];
    }

    class RouteSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routesData: 6, origin: 0, destination: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouteSelector",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*routesData*/ ctx[6] === undefined && !("routesData" in props)) {
    			console_1.warn("<RouteSelector> was created without expected prop 'routesData'");
    		}

    		if (/*origin*/ ctx[0] === undefined && !("origin" in props)) {
    			console_1.warn("<RouteSelector> was created without expected prop 'origin'");
    		}

    		if (/*destination*/ ctx[5] === undefined && !("destination" in props)) {
    			console_1.warn("<RouteSelector> was created without expected prop 'destination'");
    		}
    	}

    	get routesData() {
    		throw new Error("<RouteSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routesData(value) {
    		throw new Error("<RouteSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get origin() {
    		throw new Error("<RouteSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set origin(value) {
    		throw new Error("<RouteSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get destination() {
    		throw new Error("<RouteSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set destination(value) {
    		throw new Error("<RouteSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PastDepatureListView.svelte generated by Svelte v3.24.1 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/PastDepatureListView.svelte";

    // (34:4) {:else}
    function create_else_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = `${Math.round(/*percentComplete*/ ctx[3])}%`;
    			attr_dev(span, "class", "percentComplete");
    			add_location(span, file$3, 34, 6, 1154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(34:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:4) {#if arrived}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "100";
    			attr_dev(span, "class", "percentComplete");
    			add_location(span, file$3, 32, 6, 1095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(32:4) {#if arrived}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let li;
    	let span0;
    	let t1;
    	let t2;
    	let span1;

    	function select_block_type(ctx, dirty) {
    		if (/*arrived*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			span0.textContent = `${/*formatTime*/ ctx[4](/*departureTime*/ ctx[0])}`;
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = `${/*formatTime*/ ctx[4](/*arrivalTime*/ ctx[1])}`;
    			attr_dev(span0, "class", "start");
    			add_location(span0, file$3, 30, 4, 1016);
    			attr_dev(span1, "class", "end");
    			add_location(span1, file$3, 36, 4, 1236);
    			attr_dev(li, "class", "svelte-1c7vmtk");
    			add_location(li, file$3, 29, 0, 1007);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(li, t1);
    			if_block.m(li, null);
    			append_dev(li, t2);
    			append_dev(li, span1);
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
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
    		if ("departure" in $$props) $$invalidate(5, departure = $$props.departure);
    	};

    	$$self.$capture_state = () => ({
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
    		if ("departure" in $$props) $$invalidate(5, departure = $$props.departure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [departureTime, arrivalTime, arrived, percentComplete, formatTime, departure];
    }

    class PastDepatureListView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { departure: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PastDepatureListView",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*departure*/ ctx[5] === undefined && !("departure" in props)) {
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

    const file$4 = "src/FutureDepatureListView.svelte";

    function create_fragment$4(ctx) {
    	let li;
    	let span0;
    	let t0_value = /*formatTime*/ ctx[1](/*departure*/ ctx[0].time) + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*departure*/ ctx[0].ferry.name + "";
    	let t2;
    	let span1_data_url_value;
    	let t3;
    	let span2;
    	let t4_value = /*departure*/ ctx[0].deckSpace.total + "";
    	let t4;
    	let t5;
    	let span2_data_standard_available_value;
    	let span2_data_mixed_available_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = text("%");
    			attr_dev(span0, "class", "depatureTime");
    			add_location(span0, file$4, 39, 2, 654);
    			attr_dev(span1, "class", "ferry");
    			attr_dev(span1, "data-url", span1_data_url_value = /*departure*/ ctx[0].ferry.url);
    			add_location(span1, file$4, 40, 2, 719);
    			attr_dev(span2, "class", "deckSpace");
    			attr_dev(span2, "data-standard-available", span2_data_standard_available_value = /*departure*/ ctx[0].deckSpace?.standard);
    			attr_dev(span2, "data-mixed-available", span2_data_mixed_available_value = /*departure*/ ctx[0].deckSpace?.mixed);
    			add_location(span2, file$4, 43, 2, 810);
    			attr_dev(li, "class", "svelte-1xov3ty");
    			add_location(li, file$4, 38, 0, 647);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(span0, t0);
    			append_dev(li, t1);
    			append_dev(li, span1);
    			append_dev(span1, t2);
    			append_dev(li, t3);
    			append_dev(li, span2);
    			append_dev(span2, t4);
    			append_dev(span2, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*departure*/ 1 && t0_value !== (t0_value = /*formatTime*/ ctx[1](/*departure*/ ctx[0].time) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*departure*/ 1 && t2_value !== (t2_value = /*departure*/ ctx[0].ferry.name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*departure*/ 1 && span1_data_url_value !== (span1_data_url_value = /*departure*/ ctx[0].ferry.url)) {
    				attr_dev(span1, "data-url", span1_data_url_value);
    			}

    			if (dirty & /*departure*/ 1 && t4_value !== (t4_value = /*departure*/ ctx[0].deckSpace.total + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*departure*/ 1 && span2_data_standard_available_value !== (span2_data_standard_available_value = /*departure*/ ctx[0].deckSpace?.standard)) {
    				attr_dev(span2, "data-standard-available", span2_data_standard_available_value);
    			}

    			if (dirty & /*departure*/ 1 && span2_data_mixed_available_value !== (span2_data_mixed_available_value = /*departure*/ ctx[0].deckSpace?.mixed)) {
    				attr_dev(span2, "data-mixed-available", span2_data_mixed_available_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
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
    	
    	let { departure } = $$props;

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FutureDepatureListView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FutureDepatureListView", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("departure" in $$props) $$invalidate(0, departure = $$props.departure);
    	};

    	$$self.$capture_state = () => ({ departure, formatTime });

    	$$self.$inject_state = $$props => {
    		if ("departure" in $$props) $$invalidate(0, departure = $$props.departure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [departure, formatTime];
    }

    class FutureDepatureListView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { departure: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FutureDepatureListView",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*departure*/ ctx[0] === undefined && !("departure" in props)) {
    			console.warn("<FutureDepatureListView> was created without expected prop 'departure'");
    		}
    	}

    	get departure() {
    		throw new Error("<FutureDepatureListView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set departure(value) {
    		throw new Error("<FutureDepatureListView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/RouteViewer.svelte generated by Svelte v3.24.1 */
    const file$5 = "src/RouteViewer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (58:2) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Awaiting Route data...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(58:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {#if selectedRouteParser && departures }
    function create_if_block$2(ctx) {
    	let backbutton;
    	let t0;
    	let section;
    	let ul0;
    	let t1;
    	let hr;
    	let t2;
    	let ul1;
    	let current;
    	backbutton = new BackButton({ $$inline: true });
    	backbutton.$on("backButton", /*backButton_handler*/ ctx[2]);
    	let each_value_1 = /*departures*/ ctx[1].past;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*departures*/ ctx[1].future;
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
    			create_component(backbutton.$$.fragment);
    			t0 = space();
    			section = element("section");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "pastDepartures svelte-ghxnv8");
    			add_location(ul0, file$5, 45, 6, 1023);
    			add_location(hr, file$5, 50, 6, 1195);
    			attr_dev(ul1, "class", "futureDepartures svelte-ghxnv8");
    			add_location(ul1, file$5, 51, 6, 1206);
    			attr_dev(section, "class", "routes svelte-ghxnv8");
    			add_location(section, file$5, 44, 4, 992);
    		},
    		m: function mount(target, anchor) {
    			mount_component(backbutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(section, t1);
    			append_dev(section, hr);
    			append_dev(section, t2);
    			append_dev(section, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*departures*/ 2) {
    				each_value_1 = /*departures*/ ctx[1].past;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
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

    			if (dirty & /*departures*/ 2) {
    				each_value = /*departures*/ ctx[1].future;
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
    			transition_in(backbutton.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(backbutton.$$.fragment, local);
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(backbutton, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(43:2) {#if selectedRouteParser && departures }",
    		ctx
    	});

    	return block;
    }

    // (47:8) {#each departures.past as pastDeparture}
    function create_each_block_1$1(ctx) {
    	let pastdepaturelistview;
    	let current;

    	pastdepaturelistview = new PastDepatureListView({
    			props: { departure: /*pastDeparture*/ ctx[6] },
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
    		p: function update(ctx, dirty) {
    			const pastdepaturelistview_changes = {};
    			if (dirty & /*departures*/ 2) pastdepaturelistview_changes.departure = /*pastDeparture*/ ctx[6];
    			pastdepaturelistview.$set(pastdepaturelistview_changes);
    		},
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
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(47:8) {#each departures.past as pastDeparture}",
    		ctx
    	});

    	return block;
    }

    // (53:8) {#each departures.future as futureDeparture}
    function create_each_block$1(ctx) {
    	let futuredeparturelistview;
    	let current;

    	futuredeparturelistview = new FutureDepatureListView({
    			props: { departure: /*futureDeparture*/ ctx[3] },
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
    		p: function update(ctx, dirty) {
    			const futuredeparturelistview_changes = {};
    			if (dirty & /*departures*/ 2) futuredeparturelistview_changes.departure = /*futureDeparture*/ ctx[3];
    			futuredeparturelistview.$set(futuredeparturelistview_changes);
    		},
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
    		source: "(53:8) {#each departures.future as futureDeparture}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let header;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*selectedRouteParser*/ ctx[0] && /*departures*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			header = element("header");
    			header.textContent = "When?";
    			t1 = space();
    			if_block.c();
    			attr_dev(header, "class", "svelte-ghxnv8");
    			add_location(header, file$5, 41, 2, 889);
    			attr_dev(section, "class", "routeViewer svelte-ghxnv8");
    			add_location(section, file$5, 40, 0, 857);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, header);
    			append_dev(section, t1);
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
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
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
    	
    	let { selectedRouteParser } = $$props;
    	let departures;
    	const writable_props = ["selectedRouteParser"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouteViewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouteViewer", $$slots, []);

    	function backButton_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("selectedRouteParser" in $$props) $$invalidate(0, selectedRouteParser = $$props.selectedRouteParser);
    	};

    	$$self.$capture_state = () => ({
    		BackButton,
    		PastDepatureListView,
    		FutureDepartureListView: FutureDepatureListView,
    		selectedRouteParser,
    		departures
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedRouteParser" in $$props) $$invalidate(0, selectedRouteParser = $$props.selectedRouteParser);
    		if ("departures" in $$props) $$invalidate(1, departures = $$props.departures);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedRouteParser*/ 1) {
    			 {
    				if (typeof selectedRouteParser.departures === "function") {
    					$$invalidate(1, departures = selectedRouteParser.departures());
    				}
    			}
    		}
    	};

    	return [selectedRouteParser, departures, backButton_handler];
    }

    class RouteViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { selectedRouteParser: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouteViewer",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selectedRouteParser*/ ctx[0] === undefined && !("selectedRouteParser" in props)) {
    			console.warn("<RouteViewer> was created without expected prop 'selectedRouteParser'");
    		}
    	}

    	get selectedRouteParser() {
    		throw new Error("<RouteViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedRouteParser(value) {
    		throw new Error("<RouteViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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
        getAllRoutes: async () => {
            console.log(`Communicator#getAllRoutes  Contacting berries...`);
            let response = await request('GET', '/api/small', {});
            if (response.status === 200) {
                console.log(`Communicator#getAllRoutes  Results valid, returning restults`);
                const parsedJson = await response.json();
                return JSON.parse(parsedJson["page"]);
            }
            else {
                console.log(`Communicator#getAllRoutes  Something wrong, return empty array`);
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

    const cleanString = (str) => {
        console.log(`cleanString():`, str);
        if (str) {
            return str.trim().replace(/\r?\n|\r|/g, '').replace(/  +/g, ' ');
        }
        return '';
    };
    // const parking available = querySelector('.t-parking-padding').querySelector('header').textContent.trim().replace(/\r?\n|\r|/g,'').replace(/  +/g, ' ')
    // const sailingDuration = tableRows[0].querySelector('b').textContent.trim()
    const RoutePageParser = (page) => {
        console.log(`RoutePageParser:`, page);
        let parser = new DOMParser();
        const doc = parser.parseFromString(page, "text/html");
        console.log(`RoutePageParser doc:`, doc);
        const parseTime = (fullTimeString) => {
            console.log(`parseTime(${fullTimeString})`);
            const [timeString, meridiem] = fullTimeString.split(' ');
            let [hours, minutes] = timeString.split(':').map((x) => parseInt(x));
            if (meridiem.toUpperCase() === 'PM') {
                console.log('its pm');
                hours = hours + 12;
            }
            const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
            console.log('whats anowstr', nowStr);
            const now = new Date(nowStr);
            console.log('now:', now);
            const timeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            console.log(`Today at ${hours} ${minutes}: `, timeToday);
            return timeToday.getTime();
        };
        const parsePastStatus = (statusString) => {
            const [status, timeStr, meridiem] = statusString.split(' ');
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
                parseInt(percentString.slice(0, -1));
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
                    console.log(`RoutePageParser#departures  tableRow[${i}]`);
                    if (i < 2) {
                        console.log('RoutePageParser#departures  skip row');
                        continue;
                    }
                    let tableRow = tableRows[i];
                    if (!tableRow.classList.contains('toggle-div')) {
                        console.log(`RoutePageParser#departures  row should contain time and status`);
                        // describes a departure
                        const [timeElement, statusElement, togglerElement] = Array.from(tableRow.querySelectorAll('td'));
                        const timeString = cleanString(timeElement.textContent);
                        const statusString = cleanString(statusElement.textContent);
                        if (togglerElement.classList.contains('toggle-arrow')) {
                            console.log('RoutePageParser#departures  row has further info');
                            // a future departure
                            const extraInfo = tableRows[i + 1];
                            console.log('RoutePageParser#departures  further info should be here:', extraInfo);
                            const ferryData = extraInfo.querySelector('.sailing-ferry-name');
                            const deckSpaceData = extraInfo.querySelector('#deckSpace');
                            let deckSpaceObject;
                            if (deckSpaceData) {
                                const [totalSpace, standardSpace, mixedSpace] = Array.from(deckSpaceData.querySelectorAll('.progress-bar'));
                                deckSpaceObject = {
                                    total: parsePercent(cleanString(totalSpace === null || totalSpace === void 0 ? void 0 : totalSpace.textContent)),
                                    standard: parsePercent(cleanString(standardSpace === null || standardSpace === void 0 ? void 0 : standardSpace.textContent)),
                                    mixed: parsePercent(cleanString(mixedSpace === null || mixedSpace === void 0 ? void 0 : mixedSpace.textContent))
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
                            console.log('RoutePageParser#departures no toggle arrow, its a past departure');
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

    /* src/App.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1$1, console: console_1$2 } = globals;
    const file$6 = "src/App.svelte";

    // (121:6) {:else}
    function create_else_block$3(ctx) {
    	let routeselector;
    	let updating_routesData;
    	let updating_origin;
    	let updating_destination;
    	let current;

    	function routeselector_routesData_binding(value) {
    		/*routeselector_routesData_binding*/ ctx[7].call(null, value);
    	}

    	function routeselector_origin_binding(value) {
    		/*routeselector_origin_binding*/ ctx[8].call(null, value);
    	}

    	function routeselector_destination_binding(value) {
    		/*routeselector_destination_binding*/ ctx[9].call(null, value);
    	}

    	let routeselector_props = {};

    	if (/*routesData*/ ctx[2] !== void 0) {
    		routeselector_props.routesData = /*routesData*/ ctx[2];
    	}

    	if (/*origin*/ ctx[0] !== void 0) {
    		routeselector_props.origin = /*origin*/ ctx[0];
    	}

    	if (/*destination*/ ctx[1] !== void 0) {
    		routeselector_props.destination = /*destination*/ ctx[1];
    	}

    	routeselector = new RouteSelector({
    			props: routeselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(routeselector, "routesData", routeselector_routesData_binding));
    	binding_callbacks.push(() => bind(routeselector, "origin", routeselector_origin_binding));
    	binding_callbacks.push(() => bind(routeselector, "destination", routeselector_destination_binding));
    	routeselector.$on("backButton", /*onBackButton*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(routeselector.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(routeselector, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const routeselector_changes = {};

    			if (!updating_routesData && dirty & /*routesData*/ 4) {
    				updating_routesData = true;
    				routeselector_changes.routesData = /*routesData*/ ctx[2];
    				add_flush_callback(() => updating_routesData = false);
    			}

    			if (!updating_origin && dirty & /*origin*/ 1) {
    				updating_origin = true;
    				routeselector_changes.origin = /*origin*/ ctx[0];
    				add_flush_callback(() => updating_origin = false);
    			}

    			if (!updating_destination && dirty & /*destination*/ 2) {
    				updating_destination = true;
    				routeselector_changes.destination = /*destination*/ ctx[1];
    				add_flush_callback(() => updating_destination = false);
    			}

    			routeselector.$set(routeselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routeselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routeselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(routeselector, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(121:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (119:6) {#if routeIsSelected && selectedRouteParser }
    function create_if_block$3(ctx) {
    	let routeviewer;
    	let updating_selectedRouteParser;
    	let current;

    	function routeviewer_selectedRouteParser_binding(value) {
    		/*routeviewer_selectedRouteParser_binding*/ ctx[6].call(null, value);
    	}

    	let routeviewer_props = {};

    	if (/*selectedRouteParser*/ ctx[3] !== void 0) {
    		routeviewer_props.selectedRouteParser = /*selectedRouteParser*/ ctx[3];
    	}

    	routeviewer = new RouteViewer({ props: routeviewer_props, $$inline: true });
    	binding_callbacks.push(() => bind(routeviewer, "selectedRouteParser", routeviewer_selectedRouteParser_binding));
    	routeviewer.$on("backButton", /*onBackButton*/ ctx[5]);

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

    			if (!updating_selectedRouteParser && dirty & /*selectedRouteParser*/ 8) {
    				updating_selectedRouteParser = true;
    				routeviewer_changes.selectedRouteParser = /*selectedRouteParser*/ ctx[3];
    				add_flush_callback(() => updating_selectedRouteParser = false);
    			}

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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(119:6) {#if routeIsSelected && selectedRouteParser }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let header;
    	let t1;
    	let main;
    	let section;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*routeIsSelected*/ ctx[4] && /*selectedRouteParser*/ ctx[3]) return 0;
    		return 1;
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
    			attr_dev(header, "class", "svelte-1di0g8p");
    			add_location(header, file$6, 113, 2, 3646);
    			attr_dev(section, "class", "svelte-1di0g8p");
    			add_location(section, file$6, 117, 4, 3698);
    			attr_dev(main, "class", "svelte-1di0g8p");
    			add_location(main, file$6, 116, 2, 3687);
    			attr_dev(div, "class", "root svelte-1di0g8p");
    			add_location(div, file$6, 112, 0, 3625);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let origin = {};
    	let destination = {};
    	let routesData = [];
    	let selectedRouteParser = {};

    	const objectIsEmpty = obj => {
    		return Object.keys(obj).length === 0 && obj.constructor === Object;
    	};

    	let routeIsSelected = false;

    	const onBackButton = _e => {
    		if (routeIsSelected && selectedRouteParser) {
    			$$invalidate(4, routeIsSelected = false);
    			$$invalidate(3, selectedRouteParser = {});
    			$$invalidate(1, destination = {});
    		}

    		if (origin) {
    			$$invalidate(0, origin = {});
    		}
    	};

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		console.log(`App#onMount`);

    		if (routesData.length === 0) {
    			Communicator.getAllRoutes().then(newRoutesData => {
    				console.log(`App#onMount  got routes, set them as routesData...`);
    				$$invalidate(2, routesData = newRoutesData);
    			});
    		}
    	}));

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function routeviewer_selectedRouteParser_binding(value) {
    		selectedRouteParser = value;
    		((($$invalidate(3, selectedRouteParser), $$invalidate(4, routeIsSelected)), $$invalidate(0, origin)), $$invalidate(1, destination));
    	}

    	function routeselector_routesData_binding(value) {
    		routesData = value;
    		$$invalidate(2, routesData);
    	}

    	function routeselector_origin_binding(value) {
    		origin = value;
    		$$invalidate(0, origin);
    	}

    	function routeselector_destination_binding(value) {
    		destination = value;
    		$$invalidate(1, destination);
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		RouteSelector,
    		RouteViewer,
    		BackButton,
    		Communicator,
    		routePageParser: RoutePageParser,
    		origin,
    		destination,
    		routesData,
    		selectedRouteParser,
    		objectIsEmpty,
    		routeIsSelected,
    		onBackButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("origin" in $$props) $$invalidate(0, origin = $$props.origin);
    		if ("destination" in $$props) $$invalidate(1, destination = $$props.destination);
    		if ("routesData" in $$props) $$invalidate(2, routesData = $$props.routesData);
    		if ("selectedRouteParser" in $$props) $$invalidate(3, selectedRouteParser = $$props.selectedRouteParser);
    		if ("routeIsSelected" in $$props) $$invalidate(4, routeIsSelected = $$props.routeIsSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*origin, destination*/ 3) {
    			 {
    				console.log("Either origin or destination changed...");

    				if (!objectIsEmpty(origin) && !objectIsEmpty(destination)) {
    					$$invalidate(4, routeIsSelected = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*routeIsSelected, origin, destination*/ 19) {
    			 {
    				console.log("App#Reacting  to something");

    				if (routeIsSelected) {
    					console.log("App#Reacting  routeIsSelected, get and parse route info...");

    					Communicator.getRouteInfo(`${origin["travelRouteName"]}-${destination["travelRouteName"]}/${origin["code"]}-${destination["code"]}`).then(response => {
    						console.log("App#Reacting  got the response, parse it");
    						$$invalidate(3, selectedRouteParser = RoutePageParser(response));
    					});
    				}
    			}
    		}
    	};

    	return [
    		origin,
    		destination,
    		routesData,
    		selectedRouteParser,
    		routeIsSelected,
    		onBackButton,
    		routeviewer_selectedRouteParser_binding,
    		routeselector_routesData_binding,
    		routeselector_origin_binding,
    		routeselector_destination_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
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
