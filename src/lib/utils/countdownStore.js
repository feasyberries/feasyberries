import { writable, get } from 'svelte/store';
import { getEpoch } from './timeUtils';

const initialParams = { expireTime: 0, onComplete: () => {} };
const countdownParams = writable(initialParams);

const internalCountdown = writable(0, set => {
  const duration = get(countdownParams).expireTime - getEpoch();
  set(duration);
  const intervalId = setInterval(() => {
    const remaining = get(internalCountdown);
    if (remaining > 0) {
      internalCountdown.update(old => old - 1);
    } else {
      get(countdownParams).onComplete();
      countdownParams.set(initialParams);
    }
  }, 1000);

  return () => clearInterval(intervalId);
});

countdownParams.subscribe((newParams) => {
  let duration = newParams.expireTime - getEpoch();
  if (duration < 0) {
    duration = 0;
  }
  internalCountdown.set(duration);
});

const startCountdownStore = (expireTime, onComplete) => {
  countdownParams.set({expireTime, onComplete});
};

const stopCountdownStore = () => {
  countdownParams.set(initialParams);
};

const countdownStore = {
  subscribe: internalCountdown.subscribe
};

export {
  countdownStore,
  startCountdownStore,
  stopCountdownStore
};
