
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function empty() {
        return text('');
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
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

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    /* src/PortIcon.svelte generated by Svelte v3.24.1 */

    const file = "src/PortIcon.svelte";

    function create_fragment(ctx) {
    	let div;
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(span, "class", "portCode svelte-1jvf9q9");
    			add_location(span, file, 24, 2, 548);
    			attr_dev(div, "class", "portCodeIcon svelte-1jvf9q9");
    			add_location(div, file, 23, 0, 519);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { text } = $$props;
    	const writable_props = ["text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PortIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortIcon", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ text });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text];
    }

    class PortIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortIcon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<PortIcon> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<PortIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<PortIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/BackButton.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/BackButton.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let porticon;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	porticon = new PortIcon({ props: { text: "<" }, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(porticon.$$.fragment);
    			attr_dev(div, "class", "svelte-1ke37t8");
    			add_location(div, file$1, 17, 0, 403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(porticon, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*backButton*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(porticon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(porticon.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(porticon);
    			if (detaching && div_transition) div_transition.end();
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

    	const backButton = _ => {
    		dispatchEvent("backButton");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BackButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BackButton", $$slots, []);

    	$$self.$capture_state = () => ({
    		fly,
    		createEventDispatcher,
    		PortIcon,
    		dispatchEvent,
    		backButton
    	});

    	return [backButton];
    }

    class BackButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BackButton",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/PortListItem.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/PortListItem.svelte";

    // (74:2) {#if showIcon}
    function create_if_block(ctx) {
    	let div;
    	let porticon;
    	let div_outro;
    	let current;

    	porticon = new PortIcon({
    			props: { text: /*port*/ ctx[0].code },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(porticon.$$.fragment);
    			add_location(div, file$2, 74, 4, 1673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(porticon, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const porticon_changes = {};
    			if (dirty & /*port*/ 1) porticon_changes.text = /*port*/ ctx[0].code;
    			porticon.$set(porticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(porticon.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(porticon.$$.fragment, local);

    			if (local) {
    				div_outro = create_out_transition(div, /*iconSender*/ ctx[2], { key: /*port*/ ctx[0].code });
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(porticon);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(74:2) {#if showIcon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let li;
    	let t0;
    	let div;
    	let p0;
    	let t2;
    	let p1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcon*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*portName*/ ctx[5]}`;
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = `${/*portTown*/ ctx[4]}`;
    			attr_dev(p0, "class", "portName svelte-1ceuszz");
    			add_location(p0, file$2, 79, 4, 1805);
    			attr_dev(p1, "class", "portTown svelte-1ceuszz");
    			add_location(p1, file$2, 80, 4, 1844);
    			attr_dev(div, "class", "portDetails svelte-1ceuszz");
    			add_location(div, file$2, 78, 2, 1775);
    			attr_dev(li, "class", "svelte-1ceuszz");
    			toggle_class(li, "reversed", /*iconRight*/ ctx[6][/*port*/ ctx[0].code]);
    			toggle_class(li, "first", /*index*/ ctx[1] === 0);
    			add_location(li, file$2, 68, 0, 1552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if (if_block) if_block.m(li, null);
    			append_dev(li, t0);
    			append_dev(li, div);
    			append_dev(div, p0);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*clickHandler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showIcon*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showIcon*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(li, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*iconRight, port*/ 65) {
    				toggle_class(li, "reversed", /*iconRight*/ ctx[6][/*port*/ ctx[0].code]);
    			}

    			if (dirty & /*index*/ 2) {
    				toggle_class(li, "first", /*index*/ ctx[1] === 0);
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
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
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
    	
    	const dispatchEvent = createEventDispatcher();

    	const portSelected = selectedPort => {
    		dispatchEvent("portSelected", selectedPort.code);
    	};

    	let { port } = $$props;
    	let { index } = $$props;
    	let { iconSender } = $$props;
    	let showIcon = true;
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

    	const clickHandler = _ => {
    		$$invalidate(3, showIcon = false);
    		portSelected(port);
    	};

    	const writable_props = ["port", "index", "iconSender"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PortListItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortListItem", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("port" in $$props) $$invalidate(0, port = $$props.port);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("iconSender" in $$props) $$invalidate(2, iconSender = $$props.iconSender);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		PortIcon,
    		dispatchEvent,
    		portSelected,
    		port,
    		index,
    		iconSender,
    		showIcon,
    		splitIndex,
    		portTown,
    		portName,
    		iconRight,
    		clickHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("port" in $$props) $$invalidate(0, port = $$props.port);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("iconSender" in $$props) $$invalidate(2, iconSender = $$props.iconSender);
    		if ("showIcon" in $$props) $$invalidate(3, showIcon = $$props.showIcon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [port, index, iconSender, showIcon, portTown, portName, iconRight, clickHandler];
    }

    class PortListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { port: 0, index: 1, iconSender: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortListItem",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*port*/ ctx[0] === undefined && !("port" in props)) {
    			console.warn("<PortListItem> was created without expected prop 'port'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console.warn("<PortListItem> was created without expected prop 'index'");
    		}

    		if (/*iconSender*/ ctx[2] === undefined && !("iconSender" in props)) {
    			console.warn("<PortListItem> was created without expected prop 'iconSender'");
    		}
    	}

    	get port() {
    		throw new Error("<PortListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set port(value) {
    		throw new Error("<PortListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<PortListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<PortListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconSender() {
    		throw new Error("<PortListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconSender(value) {
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
        // console.log(`Communicator#request`)
        const fetch_options = Object.assign({ method: method }, params);
        // console.log(`Communicator#request  request: ${method}: ${url}`, fetch_options)
        // return fetch(url, fetch_options)
        let response = await fetch(url, fetch_options);
        let networkAttempts = 0;
        while (networkAttempts < 5) {
            // console.log(`Communicator#request  Requesting...`)
            if (response.status !== 200) {
                networkAttempts = networkAttempts + 1;
                // console.log(`Communicator#request  Error detected, retry #${networkAttempts}`)
                response = await request(method, url, params);
            }
            else {
                // console.log(`Communicator#request  Reponse valid`)
                break;
            }
        }
        return response;
    };
    const Communicator = {
        getAllPorts: async () => {
            // console.log(`Communicator#getAllPorts  Contacting berries...`)
            let response = await request('GET', '/api/cc-route-info', {});
            if (response.status === 200) {
                // console.log(`Communicator#getAllPorts  Results valid, returning restults`)
                const parsedJson = await response.json();
                return JSON.parse(parsedJson["page"]);
            }
            else {
                // console.log(`Communicator#getAllPorts  Something wrong, return empty array`)
                return [];
            }
        },
        getRouteInfo: async (uri) => {
            // console.log(`Communicator#getRouteInfo  fetching route: ${uri}`)
            let response = await request('GET', `/api/current-conditions/${uri}`, {});
            if (response.status === 200) {
                // console.log(`Communicator#getRouteInfo  Results valid, returning restults`)
                const parsedJson = await response.json();
                return parsedJson["page"];
            }
            else {
                // console.log(`Communicator#getRouteInfo  Something wrong, return empty array`)
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
        Communicator.getAllPorts().then(newPortsData => {
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

    const scrollShadow = (node) => {
        node.style.transitionProperty = 'all';
        node.style.transitionDuration = '1s';
        node.style.transitionTimingFunction = 'linear';
        node.classList.add('scroll-shadow');
        const handleScrollShadows = () => {
            // console.log(`check shadows`)
            // console.log(` node.scrollTop =${node.scrollTop}`)
            // console.log(` node.clientHeight =${node.clientHeight}`)
            // console.log(` node.scrollHeight =${node.scrollHeight}`)
            if (node.scrollTop !== 0) {
                // console.log('top shadow on')
                node.classList.add('scroll-shadow-top');
            }
            else {
                // console.log('top shadow off')
                node.classList.remove('scroll-shadow-top');
            }
            if (node.scrollHeight - node.scrollTop !== node.clientHeight) {
                // console.log('bottom shadow on')
                node.classList.add('scroll-shadow-bottom');
            }
            else {
                // console.log('bottom shadow off')
                node.classList.remove('scroll-shadow-bottom');
            }
        };
        const throttledScrollEvent = (e) => {
            let throttlingScrollEvents = false;
            if (!throttlingScrollEvents) {
                window.requestAnimationFrame(() => {
                    handleScrollShadows();
                    throttlingScrollEvents = false;
                });
                throttlingScrollEvents = true;
            }
        };
        handleScrollShadows();
        node.addEventListener('scroll', throttledScrollEvent);
        return {
            destroy() {
                node.removeEventListener('scroll', throttledScrollEvent);
            }
        };
    };

    /* src/PortList.svelte generated by Svelte v3.24.1 */
    const file$3 = "src/PortList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (48:0) {:else}
    function create_else_block(ctx) {
    	let ul;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			attr_dev(ul, "class", "svelte-15yvbbe");
    			add_location(ul, file$3, 48, 2, 1164);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(48:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:0) {#if $ports.size}
    function create_if_block$1(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let scrollShadow_action;
    	let ul_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*sortedPorts*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*port*/ ctx[7];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-15yvbbe");
    			add_location(ul, file$3, 37, 2, 935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(scrollShadow_action = scrollShadow.call(null, ul));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconSender, sortedPorts*/ 3) {
    				const each_value = /*sortedPorts*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!ul_transition) ul_transition = create_bidirectional_transition(ul, fly, { y: 500 }, true);
    				ul_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!ul_transition) ul_transition = create_bidirectional_transition(ul, fly, { y: 500 }, false);
    			ul_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && ul_transition) ul_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(37:0) {#if $ports.size}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#each sortedPorts as port, index (port)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let portlistitem;
    	let current;

    	portlistitem = new PortListItem({
    			props: {
    				iconSender: /*iconSender*/ ctx[0],
    				port: /*port*/ ctx[7],
    				index: /*index*/ ctx[9]
    			},
    			$$inline: true
    		});

    	portlistitem.$on("portSelected", /*portSelected_handler*/ ctx[4]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(portlistitem.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(portlistitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const portlistitem_changes = {};
    			if (dirty & /*iconSender*/ 1) portlistitem_changes.iconSender = /*iconSender*/ ctx[0];
    			if (dirty & /*sortedPorts*/ 2) portlistitem_changes.port = /*port*/ ctx[7];
    			if (dirty & /*sortedPorts*/ 2) portlistitem_changes.index = /*index*/ ctx[9];
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
    			if (detaching) detach_dev(first);
    			destroy_component(portlistitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:4) {#each sortedPorts as port, index (port)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$ports*/ ctx[2].size) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
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
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $ports;
    	validate_store(ports, "ports");
    	component_subscribe($$self, ports, $$value => $$invalidate(2, $ports = $$value));
    	
    	let { filter = "" } = $$props;
    	let { iconSender } = $$props;
    	const portsSortOrder = ["LNG", "HSB", "NAN", "DUK", "TSA", "SWB"];
    	const portsSort = (a, b) => portsSortOrder.indexOf(a.code) - portsSortOrder.indexOf(b.code);
    	let sortedPorts = [];
    	const writable_props = ["filter", "iconSender"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PortList> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PortList", $$slots, []);

    	function portSelected_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("filter" in $$props) $$invalidate(3, filter = $$props.filter);
    		if ("iconSender" in $$props) $$invalidate(0, iconSender = $$props.iconSender);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		PortListItem,
    		ports,
    		scrollShadow,
    		filter,
    		iconSender,
    		portsSortOrder,
    		portsSort,
    		sortedPorts,
    		$ports
    	});

    	$$self.$inject_state = $$props => {
    		if ("filter" in $$props) $$invalidate(3, filter = $$props.filter);
    		if ("iconSender" in $$props) $$invalidate(0, iconSender = $$props.iconSender);
    		if ("sortedPorts" in $$props) $$invalidate(1, sortedPorts = $$props.sortedPorts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, $ports*/ 12) {
    			 {
    				if (filter) {
    					$$invalidate(1, sortedPorts = $ports.get(filter).destinationRoutes.sort(portsSort));
    				} else {
    					let allRoutes = Array.from($ports.values());
    					$$invalidate(1, sortedPorts = allRoutes.sort(portsSort));
    				}
    			}
    		}
    	};

    	return [iconSender, sortedPorts, $ports, filter, portSelected_handler];
    }

    class PortList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { filter: 3, iconSender: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PortList",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*iconSender*/ ctx[0] === undefined && !("iconSender" in props)) {
    			console.warn("<PortList> was created without expected prop 'iconSender'");
    		}
    	}

    	get filter() {
    		throw new Error("<PortList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filter(value) {
    		throw new Error("<PortList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconSender() {
    		throw new Error("<PortList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconSender(value) {
    		throw new Error("<PortList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Clock.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/Clock.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let time_1;
    	let t;
    	let time_1_datetime_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			time_1 = element("time");
    			t = text(/*formattedTime*/ ctx[1]);
    			attr_dev(time_1, "datetime", time_1_datetime_value = /*date*/ ctx[0].toISOString());
    			attr_dev(time_1, "class", "clocktext svelte-b045gi");
    			add_location(time_1, file$4, 37, 2, 724);
    			attr_dev(div, "class", "clock svelte-b045gi");
    			add_location(div, file$4, 36, 0, 702);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, time_1);
    			append_dev(time_1, t);
    		},
    		p: noop,
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
    	let { time } = $$props;
    	const date = new Date(time);

    	const formattedTime = date.toLocaleTimeString("en", {
    		hour: "2-digit",
    		minute: "2-digit",
    		hour12: true
    	});

    	const writable_props = ["time"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Clock", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	$$self.$capture_state = () => ({ time, date, formattedTime });

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [date, formattedTime, time];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { time: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$4.name
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

    const file$5 = "src/ProgressBar.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			attr_dev(span, "class", "value svelte-aiv3z9");
    			set_style(span, "--progress-value", /*progress*/ ctx[1] + "%");
    			attr_dev(span, "data-label", /*labelText*/ ctx[0]);
    			add_location(span, file$5, 50, 2, 1031);
    			attr_dev(div, "class", "progress svelte-aiv3z9");
    			add_location(div, file$5, 49, 0, 1006);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*labelText*/ 1) {
    				attr_dev(span, "data-label", /*labelText*/ ctx[0]);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { value = 0 } = $$props;
    	let { fullText = "100" } = $$props;
    	const progress = value > 100 ? 100 : value;
    	let labelText = "";

    	if (progress > 30 && progress < 100) {
    		labelText = `${progress}%`;
    	} else if (progress === 100) {
    		labelText = fullText;
    	}

    	const writable_props = ["value", "fullText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProgressBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ProgressBar", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("fullText" in $$props) $$invalidate(3, fullText = $$props.fullText);
    	};

    	$$self.$capture_state = () => ({ value, fullText, progress, labelText });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("fullText" in $$props) $$invalidate(3, fullText = $$props.fullText);
    		if ("labelText" in $$props) $$invalidate(0, labelText = $$props.labelText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [labelText, progress, value, fullText];
    }

    class ProgressBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { value: 2, fullText: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressBar",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get value() {
    		throw new Error("<ProgressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ProgressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fullText() {
    		throw new Error("<ProgressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fullText(value) {
    		throw new Error("<ProgressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PastDepatureListView.svelte generated by Svelte v3.24.1 */
    const file$6 = "src/PastDepatureListView.svelte";

    // (53:6) {:else}
    function create_else_block$1(ctx) {
    	let progressbar;
    	let current;

    	progressbar = new ProgressBar({
    			props: {
    				value: Math.round(/*percentComplete*/ ctx[2]),
    				fullText: "Arrived"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(progressbar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(progressbar, target, anchor);
    			current = true;
    		},
    		p: noop,
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
    			destroy_component(progressbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(53:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:6) {#if percentComplete === 100}
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Arrived";
    			add_location(span, file$6, 51, 8, 1581);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(51:6) {#if percentComplete === 100}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let li;
    	let div0;
    	let clock0;
    	let t0;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let div2;
    	let clock1;
    	let current;

    	clock0 = new Clock({
    			props: { time: /*departureTime*/ ctx[0] },
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*percentComplete*/ ctx[2] === 100) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	clock1 = new Clock({
    			props: { time: /*arrivalTime*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			create_component(clock0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			if_block.c();
    			t1 = space();
    			div2 = element("div");
    			create_component(clock1.$$.fragment);
    			attr_dev(div0, "class", "departure svelte-vwbadl");
    			add_location(div0, file$6, 46, 4, 1438);
    			attr_dev(div1, "class", "progress svelte-vwbadl");
    			add_location(div1, file$6, 49, 4, 1514);
    			attr_dev(div2, "class", "arrival svelte-vwbadl");
    			add_location(div2, file$6, 56, 4, 1722);
    			attr_dev(li, "class", "svelte-vwbadl");
    			add_location(li, file$6, 45, 0, 1429);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			mount_component(clock0, div0, null);
    			append_dev(li, t0);
    			append_dev(li, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(li, t1);
    			append_dev(li, div2);
    			mount_component(clock1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock0.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(clock1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock0.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(clock1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(clock0);
    			if_blocks[current_block_type_index].d();
    			destroy_component(clock1);
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

    	// departure = {time: number, status: {time: number, status: string}}
    	const { time: departureTime, status: statusObj } = departure;

    	const { time: arrivalTime, status: statusStr } = statusObj;

    	const arrived = (statusStr === null || statusStr === void 0
    	? void 0
    	: statusStr.toUpperCase()) === "ARRIVED";

    	const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
    	const now = new Date(nowStr).getTime();
    	const percentComplete = Math.round((now - departureTime) / (arrivalTime - departureTime) * 100);

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PastDepatureListView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PastDepatureListView", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("departure" in $$props) $$invalidate(3, departure = $$props.departure);
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
    		if ("departure" in $$props) $$invalidate(3, departure = $$props.departure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [departureTime, arrivalTime, percentComplete, departure];
    }

    class PastDepatureListView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { departure: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PastDepatureListView",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*departure*/ ctx[3] === undefined && !("departure" in props)) {
    			console.warn("<PastDepatureListView> was created without expected prop 'departure'");
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
    const file$7 = "src/FutureDepatureListView.svelte";

    // (83:4) {#if Number.isInteger(departure.deckSpace.mixed)}
    function create_if_block$3(ctx) {
    	let span1;
    	let t;
    	let span0;
    	let progressbar;
    	let current;

    	progressbar = new ProgressBar({
    			props: {
    				value: 100 - (/*departure*/ ctx[0].deckSpace.mixed || 0),
    				fullText: "Full"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			t = text("Mixed:\n        ");
    			span0 = element("span");
    			create_component(progressbar.$$.fragment);
    			attr_dev(span0, "class", "progress svelte-t7fu6d");
    			add_location(span0, file$7, 85, 8, 1861);
    			attr_dev(span1, "class", "svelte-t7fu6d");
    			add_location(span1, file$7, 83, 6, 1831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t);
    			append_dev(span1, span0);
    			mount_component(progressbar, span0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const progressbar_changes = {};
    			if (dirty & /*departure*/ 1) progressbar_changes.value = 100 - (/*departure*/ ctx[0].deckSpace.mixed || 0);
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
    			if (detaching) detach_dev(span1);
    			destroy_component(progressbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(83:4) {#if Number.isInteger(departure.deckSpace.mixed)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let li;
    	let div0;
    	let clock;
    	let t0;
    	let div1;
    	let span1;
    	let t1;
    	let span0;
    	let progressbar;
    	let t2;
    	let show_if = Number.isInteger(/*departure*/ ctx[0].deckSpace.mixed);
    	let current;

    	clock = new Clock({
    			props: { time: /*departure*/ ctx[0].time },
    			$$inline: true
    		});

    	progressbar = new ProgressBar({
    			props: {
    				value: 100 - /*departure*/ ctx[0].status.percentAvailable,
    				fullText: "Full"
    			},
    			$$inline: true
    		});

    	let if_block = show_if && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			create_component(clock.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			span1 = element("span");
    			t1 = text("Total:\n        ");
    			span0 = element("span");
    			create_component(progressbar.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "departure svelte-t7fu6d");
    			add_location(div0, file$7, 69, 2, 1462);
    			attr_dev(span0, "class", "progress svelte-t7fu6d");
    			add_location(span0, file$7, 75, 8, 1593);
    			attr_dev(span1, "class", "svelte-t7fu6d");
    			add_location(span1, file$7, 73, 6, 1563);
    			attr_dev(div1, "class", "deckspace svelte-t7fu6d");
    			add_location(div1, file$7, 72, 2, 1533);
    			attr_dev(li, "class", "svelte-t7fu6d");
    			add_location(li, file$7, 68, 0, 1455);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			mount_component(clock, div0, null);
    			append_dev(li, t0);
    			append_dev(li, div1);
    			append_dev(div1, span1);
    			append_dev(span1, t1);
    			append_dev(span1, span0);
    			mount_component(progressbar, span0, null);
    			append_dev(div1, t2);
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
    			if (dirty & /*departure*/ 1) show_if = Number.isInteger(/*departure*/ ctx[0].deckSpace.mixed);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*departure*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { departure: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FutureDepatureListView",
    			options,
    			id: create_fragment$7.name
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
            const statusArray = statusString.split(' ');
            // console.log(`arsing past status time, parseTime(${timeStr} ${meridiem})`)
            let status, timeStr, meridiem;
            if (statusArray.length === 3) {
                [status, timeStr, meridiem] = statusArray;
            }
            else {
                [timeStr, meridiem] = statusArray;
                status = 'ETA';
            }
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
            if (percentString.toUpperCase() === 'FULL') {
                return 0;
            }
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
                                // console.log('wtf is the deckspace [total, standard, mixed]:', totalSpace, standardSpace, mixedSpace )
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
        // console.log('routeStauts attempt to read from store...')
        ports.subscribe((value) => {
            // console.log(`reading store value, looking for ${originCode}`, value)
            const wtf = value.get(originCode);
            // console.log('wtf is wtf', wtf)
            origin = value.get(originCode) || {};
            // - sort out the possibly undefined problem here
            // - get to finishing this stores rewrite
            // - try to get it back to where it was before but
            //   with a better codebase this time (hopefully)
            // - swing back around on the concept of baseline
            //   designing
        });
        // console.log('origin should now be set:', origin)
        const destination = origin.destinationRoutes.find(destination => destination.code == destinationCode) || {};
        const routeStatusUrl = `${origin.travelRouteName}-${destination.travelRouteName}/${origin.code}-${destination.code}`;
        const routeStatusPageString = await Communicator.getRouteInfo(routeStatusUrl);
        const parser = RoutePageParser(routeStatusPageString);
        const routeStatus = parser.departures();
        return routeStatus;
    };

    /* src/CircleSpinner.svelte generated by Svelte v3.24.1 */

    const file$8 = "src/CircleSpinner.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-1251uj4");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$8, 26, 0, 736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "0.75s" } = $$props;
    	const writable_props = ["size", "unit", "duration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CircleSpinner> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CircleSpinner", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    	};

    	$$self.$capture_state = () => ({ size, unit, duration });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, unit, duration];
    }

    class CircleSpinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { size: 0, unit: 1, duration: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CircleSpinner",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get size() {
    		throw new Error("<CircleSpinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<CircleSpinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<CircleSpinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<CircleSpinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<CircleSpinner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<CircleSpinner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/RouteViewer.svelte generated by Svelte v3.24.1 */
    const file$9 = "src/RouteViewer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (91:0) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[15].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Something went wrong: ");
    			t1 = text(t1_value);
    			add_location(p, file$9, 91, 2, 2496);
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
    		source: "(91:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (69:0) {:then routeStatus}
    function create_then_block(ctx) {
    	let section_1;
    	let ul0;
    	let t0;
    	let div;
    	let clock;
    	let t1;
    	let ul1;
    	let scrollShadow_action;
    	let section_1_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*routeStatus*/ ctx[8].past;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	clock = new Clock({
    			props: { time: /*now*/ ctx[2] },
    			$$inline: true
    		});

    	let each_value = /*routeStatus*/ ctx[8].future;
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
    			section_1 = element("section");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div = element("div");
    			create_component(clock.$$.fragment);
    			t1 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul0, "class", "pastDepartures svelte-hc6pvr");
    			add_location(ul0, file$9, 76, 4, 2065);
    			attr_dev(div, "class", "currentTime svelte-hc6pvr");
    			add_location(div, file$9, 81, 4, 2229);
    			attr_dev(ul1, "class", "futureDepartures svelte-hc6pvr");
    			add_location(ul1, file$9, 84, 4, 2296);
    			attr_dev(section_1, "class", "routes svelte-hc6pvr");
    			add_location(section_1, file$9, 69, 2, 1922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section_1, anchor);
    			append_dev(section_1, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(section_1, t0);
    			append_dev(section_1, div);
    			mount_component(clock, div, null);
    			append_dev(section_1, t1);
    			append_dev(section_1, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			/*section_1_binding*/ ctx[6](section_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollShadow_action = scrollShadow.call(null, section_1)),
    					listen_dev(section_1, "introstart", /*scrollToNow*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*routeStatusPromise*/ 2) {
    				each_value_1 = /*routeStatus*/ ctx[8].past;
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

    			if (dirty & /*routeStatusPromise*/ 2) {
    				each_value = /*routeStatus*/ ctx[8].future;
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

    			add_render_callback(() => {
    				if (!section_1_transition) section_1_transition = create_bidirectional_transition(section_1, fly, { y: 500 }, true);
    				section_1_transition.run(1);
    			});

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

    			if (!section_1_transition) section_1_transition = create_bidirectional_transition(section_1, fly, { y: 500 }, false);
    			section_1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section_1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(clock);
    			destroy_each(each_blocks, detaching);
    			/*section_1_binding*/ ctx[6](null);
    			if (detaching && section_1_transition) section_1_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(69:0) {:then routeStatus}",
    		ctx
    	});

    	return block;
    }

    // (78:6) {#each routeStatus.past as pastDeparture}
    function create_each_block_1(ctx) {
    	let pastdepaturelistview;
    	let current;

    	pastdepaturelistview = new PastDepatureListView({
    			props: { departure: /*pastDeparture*/ ctx[12] },
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
    		source: "(78:6) {#each routeStatus.past as pastDeparture}",
    		ctx
    	});

    	return block;
    }

    // (86:6) {#each routeStatus.future as futureDeparture}
    function create_each_block$1(ctx) {
    	let futuredeparturelistview;
    	let current;

    	futuredeparturelistview = new FutureDepatureListView({
    			props: { departure: /*futureDeparture*/ ctx[9] },
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
    		source: "(86:6) {#each routeStatus.future as futureDeparture}",
    		ctx
    	});

    	return block;
    }

    // (61:27)    <div     class='spinnerContainer'     in:blur={{duration: 200}}
    function create_pending_block(ctx) {
    	let div;
    	let circlespinner;
    	let div_intro;
    	let div_outro;
    	let current;
    	circlespinner = new CircleSpinner({ props: { size: 60 }, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(circlespinner.$$.fragment);
    			attr_dev(div, "class", "spinnerContainer svelte-hc6pvr");
    			add_location(div, file$9, 61, 2, 1762);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(circlespinner, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circlespinner.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, blur, { duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circlespinner.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, blur, { duration: 100 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(circlespinner);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(61:27)    <div     class='spinnerContainer'     in:blur={{duration: 200}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 8,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*routeStatusPromise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[8] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { originCode } = $$props;
    	let { destinationCode } = $$props;
    	let routeStatusPromise = routeStatus(originCode, destinationCode);
    	const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" });
    	const now = new Date(nowStr).getTime();
    	let section;

    	const scrollToNow = () => {
    		const pastDepartures = section.querySelector(".pastDepartures");

    		if (pastDepartures) {
    			const listItems = pastDepartures.children;
    			const firstListItem = listItems.item(0);
    			const listItemHeight = firstListItem.offsetHeight;
    			const pastDeparturesBottom = pastDepartures.offsetHeight;
    			const scrollToNowPos = pastDeparturesBottom - listItemHeight * 2;
    			section.scroll({ top: scrollToNowPos });
    		}
    	};

    	const writable_props = ["originCode", "destinationCode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouteViewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouteViewer", $$slots, []);

    	function section_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			section = $$value;
    			$$invalidate(0, section);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("originCode" in $$props) $$invalidate(4, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(5, destinationCode = $$props.destinationCode);
    	};

    	$$self.$capture_state = () => ({
    		PastDepatureListView,
    		FutureDepartureListView: FutureDepatureListView,
    		routeStaus: routeStatus,
    		scrollShadow,
    		Clock,
    		blur,
    		fly,
    		CircleSpinner,
    		originCode,
    		destinationCode,
    		routeStatusPromise,
    		nowStr,
    		now,
    		section,
    		scrollToNow
    	});

    	$$self.$inject_state = $$props => {
    		if ("originCode" in $$props) $$invalidate(4, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(5, destinationCode = $$props.destinationCode);
    		if ("routeStatusPromise" in $$props) $$invalidate(1, routeStatusPromise = $$props.routeStatusPromise);
    		if ("section" in $$props) $$invalidate(0, section = $$props.section);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		section,
    		routeStatusPromise,
    		now,
    		scrollToNow,
    		originCode,
    		destinationCode,
    		section_1_binding
    	];
    }

    class RouteViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { originCode: 4, destinationCode: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouteViewer",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*originCode*/ ctx[4] === undefined && !("originCode" in props)) {
    			console.warn("<RouteViewer> was created without expected prop 'originCode'");
    		}

    		if (/*destinationCode*/ ctx[5] === undefined && !("destinationCode" in props)) {
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
    const file$a = "src/App.svelte";

    // (156:6) {#if originCode}
    function create_if_block_4(ctx) {
    	let div;
    	let porticon;
    	let div_intro;
    	let current;

    	porticon = new PortIcon({
    			props: { text: /*originCode*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(porticon.$$.fragment);
    			add_location(div, file$a, 156, 8, 3722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(porticon, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const porticon_changes = {};
    			if (dirty & /*originCode*/ 1) porticon_changes.text = /*originCode*/ ctx[0];
    			porticon.$set(porticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(porticon.$$.fragment, local);

    			if (local) {
    				if (!div_intro) {
    					add_render_callback(() => {
    						div_intro = create_in_transition(div, /*originReceive*/ ctx[4], { key: /*originCode*/ ctx[0] });
    						div_intro.start();
    					});
    				}
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(porticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(porticon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(156:6) {#if originCode}",
    		ctx
    	});

    	return block;
    }

    // (164:6) {#if destinationCode}
    function create_if_block_3(ctx) {
    	let div;
    	let porticon;
    	let div_intro;
    	let current;

    	porticon = new PortIcon({
    			props: { text: /*destinationCode*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(porticon.$$.fragment);
    			add_location(div, file$a, 164, 8, 3940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(porticon, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const porticon_changes = {};
    			if (dirty & /*destinationCode*/ 2) porticon_changes.text = /*destinationCode*/ ctx[1];
    			porticon.$set(porticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(porticon.$$.fragment, local);

    			if (local) {
    				if (!div_intro) {
    					add_render_callback(() => {
    						div_intro = create_in_transition(div, /*destinationReceive*/ ctx[6], { key: /*destinationCode*/ ctx[1] });
    						div_intro.start();
    					});
    				}
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(porticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(porticon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(164:6) {#if destinationCode}",
    		ctx
    	});

    	return block;
    }

    // (180:4) {:else}
    function create_else_block$2(ctx) {
    	let portlist;
    	let current;

    	portlist = new PortList({
    			props: { iconSender: /*originSend*/ ctx[3] },
    			$$inline: true
    		});

    	portlist.$on("portSelected", /*portSelected_handler_1*/ ctx[9]);

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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(180:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (174:25) 
    function create_if_block_2(ctx) {
    	let portlist;
    	let current;

    	portlist = new PortList({
    			props: {
    				filter: /*originCode*/ ctx[0],
    				iconSender: /*destinationSend*/ ctx[5]
    			},
    			$$inline: true
    		});

    	portlist.$on("portSelected", /*portSelected_handler*/ ctx[8]);

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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(174:25) ",
    		ctx
    	});

    	return block;
    }

    // (172:4) {#if originCode && destinationCode}
    function create_if_block_1(ctx) {
    	let routeviewer;
    	let current;

    	routeviewer = new RouteViewer({
    			props: {
    				originCode: /*originCode*/ ctx[0],
    				destinationCode: /*destinationCode*/ ctx[1]
    			},
    			$$inline: true
    		});

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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(172:4) {#if originCode && destinationCode}",
    		ctx
    	});

    	return block;
    }

    // (186:4) {#if originCode || destinationCode}
    function create_if_block$4(ctx) {
    	let backbutton;
    	let current;
    	backbutton = new BackButton({ $$inline: true });
    	backbutton.$on("backButton", /*onBackButton*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(backbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(backbutton, target, anchor);
    			current = true;
    		},
    		p: noop,
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(186:4) {#if originCode || destinationCode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div3;
    	let header;
    	let t1;
    	let div2;
    	let div0;
    	let t2;
    	let h1;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let main;
    	let current_block_type_index;
    	let if_block2;
    	let t6;
    	let current;
    	let if_block0 = /*originCode*/ ctx[0] && create_if_block_4(ctx);
    	let if_block1 = /*destinationCode*/ ctx[1] && create_if_block_3(ctx);
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*originCode*/ ctx[0] && /*destinationCode*/ ctx[1]) return 0;
    		if (/*originCode*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block3 = (/*originCode*/ ctx[0] || /*destinationCode*/ ctx[1]) && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			header = element("header");
    			header.textContent = "Feasy Berries";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			h1 = element("h1");
    			t3 = text(/*title*/ ctx[2]);
    			t4 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t5 = space();
    			main = element("main");
    			if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(header, "class", "svelte-1kb8msc");
    			add_location(header, file$a, 150, 2, 3592);
    			attr_dev(div0, "class", "originIcon svelte-1kb8msc");
    			add_location(div0, file$a, 154, 4, 3666);
    			attr_dev(h1, "class", "svelte-1kb8msc");
    			add_location(h1, file$a, 161, 4, 3853);
    			attr_dev(div1, "class", "destinationIcon svelte-1kb8msc");
    			add_location(div1, file$a, 162, 4, 3874);
    			attr_dev(div2, "class", "titleContainer svelte-1kb8msc");
    			add_location(div2, file$a, 153, 2, 3633);
    			attr_dev(main, "class", "svelte-1kb8msc");
    			add_location(main, file$a, 170, 2, 4093);
    			attr_dev(div3, "class", "root svelte-1kb8msc");
    			add_location(div3, file$a, 149, 0, 3571);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, header);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, h1);
    			append_dev(h1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, main);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t6);
    			if (if_block3) if_block3.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*originCode*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*originCode*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*title*/ 4) set_data_dev(t3, /*title*/ ctx[2]);

    			if (/*destinationCode*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*destinationCode*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

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
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(main, t6);
    			}

    			if (/*originCode*/ ctx[0] || /*destinationCode*/ ctx[1]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*originCode, destinationCode*/ 3) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$4(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const [originSend, originReceive] = crossfade({});
    	const [destinationSend, destinationReceive] = crossfade({});
    	let originCode = "";
    	let destinationCode = "";

    	const onBackButton = _e => {
    		if (destinationCode) {
    			$$invalidate(1, destinationCode = "");
    		} else {
    			$$invalidate(0, originCode = "");
    		}
    	};

    	let title;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const portSelected_handler = e => $$invalidate(1, destinationCode = e.detail);
    	const portSelected_handler_1 = e => $$invalidate(0, originCode = e.detail);

    	$$self.$capture_state = () => ({
    		crossfade,
    		BackButton,
    		PortIcon,
    		PortList,
    		RouteViewer,
    		originSend,
    		originReceive,
    		destinationSend,
    		destinationReceive,
    		originCode,
    		destinationCode,
    		onBackButton,
    		title
    	});

    	$$self.$inject_state = $$props => {
    		if ("originCode" in $$props) $$invalidate(0, originCode = $$props.originCode);
    		if ("destinationCode" in $$props) $$invalidate(1, destinationCode = $$props.destinationCode);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*originCode, destinationCode*/ 3) {
    			 {
    				if (originCode && destinationCode) {
    					$$invalidate(2, title = "When?");
    				} else if (originCode) {
    					$$invalidate(2, title = "Destination?");
    				} else {
    					$$invalidate(2, title = "Origin?");
    				}
    			}
    		}
    	};

    	return [
    		originCode,
    		destinationCode,
    		title,
    		originSend,
    		originReceive,
    		destinationSend,
    		destinationReceive,
    		onBackButton,
    		portSelected_handler,
    		portSelected_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
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
