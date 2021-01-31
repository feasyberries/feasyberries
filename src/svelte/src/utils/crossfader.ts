import { quintOut } from 'svelte/easing'
import { crossfade } from 'svelte/transition'
const [send, receive] = crossfade({
  duration: (d: number) => Math.sqrt(d * 200),

  fallback(node: HTMLElement, params: any) {
    const style = getComputedStyle(node)
    const transform = style.transform === 'none' ? '' : style.transform

    return {
      duration: 600,
      easing: quintOut,
      css: (t: number) => `
        transform: ${transform} scale(${t});
        opacity: ${t};
      `
    }
  }
})

export { send, receive }
