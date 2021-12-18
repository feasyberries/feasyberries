/** @param {HTMLElement} node */
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
    } else {
      // console.log('top shadow off')
      node.classList.remove('scroll-shadow-top');
    }
    if (node.scrollHeight - node.scrollTop !== node.clientHeight) {
      // console.log('bottom shadow on')
      node.classList.add('scroll-shadow-bottom');
    } else {
      // console.log('bottom shadow off')
      node.classList.remove('scroll-shadow-bottom');
    }
  };

  /** @param {Event} _e */
  const throttledScrollEvent = (_e) => {
    /** @type {boolean} */
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

export default scrollShadow;
