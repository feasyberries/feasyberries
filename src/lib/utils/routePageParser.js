/** @typedef {import('./feasyInterfaces.d').PastStatus} PastStatus */
/** @typedef {import('./feasyInterfaces.d').FutureStatus} FutureStatus */
/** @typedef {import('./feasyInterfaces.d').DeparturesList} DeparturesList */
/** @typedef {import('./feasyInterfaces.d').FutureDeparture} FutureDeparture */
/** @typedef {import('./feasyInterfaces.d').DeckSpace} DeckSpace */

import { parseTime } from "./timeUtils";

/**
 * @param {string | null} str
 * @returns {string}
 */
const cleanString = (str) => {
  if (str) {
    return str.trim().replace(/\r?\n|\r|/g,'').replace(/  +/g, ' ');
  }
  return '';
};

/**
 * @param {Object} obj
 * @param {string} obj.page
 * @param {number} obj.expires
 * @returns {object}
 */
const RoutePageParser = ({page, expires}) => {
  let parser = new DOMParser();
  const doc = parser.parseFromString(page, "text/html");

  /**
   * @param {string} statusString
   * @returns {PastStatus}
   */
  const parsePastStatus = (statusString) => {
    const statusArray = statusString.split(' ');
    let /** @type {string} */ status,
        /** @type {string} */ timeStr,
        /** @type {string} */ meridiem;
    if (statusArray.length === 3) {
      [status, timeStr, meridiem] = statusArray;
    } else {
      [timeStr, meridiem] = statusArray;
      status = 'ETA';
    }
    const time = parseTime(`${timeStr} ${meridiem}`);
    return {
      status: status.slice(0, -1), // removes colon
      time: time
    };
  };

  /**
   * @param {string} statusString
   * @returns {FutureStatus}
   */
  const parseFutureStatus = (statusString) => {
    if (statusString == 'Cancelled') {
      return {
        percentAvailable: 0,
        cancelled: true
      }
    }
    const [percentStr, _availableStr] = statusString.split(' ');
    return {
      percentAvailable: parseInt(percentStr.slice(0, -1))
    };
  };

  /**
   *
   * @param {string} percentString
   * @returns {number | undefined}
   */
  const parsePercent = (percentString)  => {
    if (percentString.toUpperCase() === 'FULL') {
      return 0;
    }
    if (percentString && percentString.length > 2) {
      return parseInt(percentString.slice(0, -1));
    }
    return undefined;
  };

  /** @returns {DeparturesList} */
  const departures = () => {
    /** @type {DeparturesList} */
    let departures = {
      future: [],
      past: [],
      expires: expires
    };
    const departuresTable = doc.querySelector('.detail-departure-table');
    if (departuresTable) {
      const tableRows = departuresTable.querySelectorAll('tr');
      for (let i = 0; i < tableRows.length; i++) {
        if (i < 2) {
          continue;
        }
        let tableRow = tableRows[i];
        if (!tableRow.classList.contains('toggle-div')) {
          // describes a departure
          const [timeElement, statusElement, togglerElement] = Array.from(
            tableRow.querySelectorAll('td')
          );

          const timeString = cleanString(timeElement.textContent);
          const statusString = cleanString(statusElement.textContent);

          if (togglerElement.classList.contains('toggle-arrow')) {
            // a future departure
            const extraInfo = tableRows[i+1];
            const ferryData = extraInfo.querySelector('.sailing-ferry-name');
            const deckSpaceData = extraInfo.querySelector('#deckSpace');

            /** @type {DeckSpace} */
            let deckSpaceObject;
            if (deckSpaceData) {
              const [
                totalSpace,
                standardSpace,
                mixedSpace
              ] = Array.from(deckSpaceData.querySelectorAll('.progress-bar'));
              deckSpaceObject = {
                total: parsePercent(cleanString(totalSpace?.children[0].textContent)),
                standard: parsePercent(cleanString(standardSpace?.children[0].textContent)),
                mixed: parsePercent(cleanString(mixedSpace?.children[0].textContent))
              };
            } else {
              deckSpaceObject = {};
            }

            /** @type {FutureDeparture} */
            const futureDeparture = {
              time: parseTime(cleanString(timeElement.textContent)),
              status: parseFutureStatus(cleanString(statusElement.textContent)),
              ferry: {
                name: cleanString(ferryData?.textContent || null),
                url: ferryData?.getAttribute("href") || ''
              },
              deckSpace: deckSpaceObject
            };

            departures.future.push(futureDeparture);
          } else {

            // a past departure
            departures.past.push(
              {
                time: parseTime(timeString),
                status: parsePastStatus(statusString)
              }
            );
          }
        }
      }
    }

    return departures;
  };

  return {
    departures: departures
  };
};

export default RoutePageParser;
