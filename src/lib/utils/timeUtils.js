const getEpoch = () => {
  const seconds = new Date().getTime() / 1000;
  return Math.round(seconds);
};

const vancouverTime = () => {
  const nowStr = new Date().toLocaleString(
    "en-US",
    { timeZone: "America/Vancouver" }
  );

  return new Date(nowStr).getTime();
};

/** @param {string} fullTimeString */
const parseTime = (fullTimeString) => {
  const [timeString, meridiem] = fullTimeString.split(' ');
  let [hours, minutes] = timeString.split(':').map(
    /** @param {string} x */
    x => parseInt(x)
  );
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
    hours = hours + 12;
  }

  const now = new Date(
    new Date().toLocaleString(
      "en-US",
      { timeZone: "America/Vancouver" }
    )
  );

  const timeToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );
  return timeToday.getTime();
};


/** @param {number} time */
const formatTime = (time) => {
  const date = new Date(time);
  return date.toLocaleTimeString(
    'en',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
  );
};

export {
  parseTime,
  getEpoch,
  formatTime,
  vancouverTime
};
