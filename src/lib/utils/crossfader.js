import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
const [send, receive] = crossfade({
  /**
   * @param {number} d
   * @returns {number}
   */
  duration: (d) => Math.sqrt(d * 200),

  /**
   * @param {HTMLElement} node
   * @param {any} _params
   */
  fallback(node, _params) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
      duration: 600,
      easing: quintOut,
      /** @param {number} t */
      css: (t) => `
        transform: ${transform} scale(${t});
        opacity: ${t};
      `
    };
  }
});

export { send, receive };
