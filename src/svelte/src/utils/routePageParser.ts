import type {
  PastStatus,
  FutureStatus,
  DeparturesList,
  FutureDeparture,
} from './FeasyInterfaces'

const cleanString = (str: string | null): string => {
  // console.log(`cleanString():`, str)
  if (str) {
    return str.trim().replace(/\r?\n|\r|/g,'').replace(/  +/g, ' ')
  }
  return ''
}

// const parking available = querySelector('.t-parking-padding').querySelector('header').textContent.trim().replace(/\r?\n|\r|/g,'').replace(/  +/g, ' ')
// const sailingDuration = tableRows[0].querySelector('b').textContent.trim()

const RoutePageParser = (page: string) => {
  // console.log(`RoutePageParser:`, page)
  let parser = new DOMParser()
  const doc = parser.parseFromString(page, "text/html")
  // console.log(`RoutePageParser doc:`, doc)
  const parseTime = (fullTimeString: string): number => {
    // console.log(`parseTime(${fullTimeString})`)
    const [timeString, meridiem] = fullTimeString.split(' ')
    let [hours, minutes] = timeString.split(':').map(
      (x: string): number => parseInt(x)
    )
    if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
      // console.log('its pm')
      hours = hours + 12
    }

    const nowStr = new Date().toLocaleString(
      "en-US",
      { timeZone: "America/Vancouver" }
    )
    // console.log('whats anowstr', nowStr)
    const now = new Date(nowStr)
    // console.log('now:', now)
    const timeToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    )
    // console.log(`Today at ${hours} ${minutes}: `, timeToday)
    return timeToday.getTime()
  }

  const parsePastStatus = (statusString: string): PastStatus => {
    const statusArray = statusString.split(' ')
    // console.log(`arsing past status time, parseTime(${timeStr} ${meridiem})`)
    let status: string, timeStr: string, meridiem: string
    if (statusArray.length === 3) {
      [status, timeStr, meridiem] = statusArray
    } else {
      [timeStr, meridiem] = statusArray
      status = 'ETA'
    }
    const time = parseTime(`${timeStr} ${meridiem}`)
    return {
      status: status.slice(0, -1), // removes colon
      time: time
    }
  }

  const parseFutureStatus = (statusString: string): FutureStatus => {
    const [percentStr, _availableStr] = statusString.split(' ')
    return {
      percentAvailable: parseInt(percentStr.slice(0, -1))
    }
  }

  const parsePercent = (percentString: string): number | undefined => {
    if (percentString.toUpperCase() === 'FULL') {
      return 0
    }
    if (percentString && percentString.length > 2) {
      return parseInt(percentString.slice(0, -1))
    }
    return undefined
  }

  const departures = (): DeparturesList => {
    let departures: DeparturesList = {
      future: [],
      past: []
    }
    const departuresTable = doc.querySelector('.detail-departure-table')
    if (departuresTable) {
      const tableRows = departuresTable.querySelectorAll('tr')
      for (let i = 0; i < tableRows.length; i++) {
        // console.log(`RoutePageParser#departures  tableRow[${i}]`)
        if (i < 2) {
          // console.log('RoutePageParser#departures  skip row')
          continue
        }
        let tableRow = tableRows[i]
        if (!tableRow.classList.contains('toggle-div')) {
          // console.log(`RoutePageParser#departures  row should contain time and status`)
          // describes a departure
          const [timeElement, statusElement, togglerElement] = Array.from(
            tableRow.querySelectorAll('td')
          )

          const timeString = cleanString(timeElement.textContent)
          const statusString = cleanString(statusElement.textContent)

          if (togglerElement.classList.contains('toggle-arrow')) {
            // console.log('RoutePageParser#departures  row has further info')
            // a future departure
            const extraInfo = tableRows[i+1]
            // console.log('RoutePageParser#departures  further info should be here:', extraInfo)
            const ferryData = extraInfo.querySelector('.sailing-ferry-name')
            const deckSpaceData = extraInfo.querySelector('#deckSpace')
            let deckSpaceObject
            if (deckSpaceData) {
              const [
                totalSpace,
                standardSpace,
                mixedSpace
              ] = Array.from(deckSpaceData.querySelectorAll('.progress-bar'))
              // console.log('wtf is the deckspace [total, standard, mixed]:', totalSpace, standardSpace, mixedSpace )
              deckSpaceObject = {
                total: parsePercent(cleanString(totalSpace?.children[0].textContent)),
                standard: parsePercent(cleanString(standardSpace?.children[0].textContent)),
                mixed: parsePercent(cleanString(mixedSpace?.children[0].textContent))
              }
            } else {
              deckSpaceObject = {}
            }
            const futureDeparture: FutureDeparture = {
              time: parseTime(cleanString(timeElement.textContent)),
              status: parseFutureStatus(cleanString(statusElement.textContent)),
              ferry: {
                name: cleanString(ferryData?.textContent || null),
                url: ferryData?.getAttribute("href") || ''
              },
              deckSpace: deckSpaceObject
            }
            departures.future.push(futureDeparture)
          } else {
            // console.log('RoutePageParser#departures no toggle arrow, its a past departure')

            // a past departure
            departures.past.push(
              {
                time: parseTime(timeString),
                status: parsePastStatus(statusString)
              }
            )
          }
        }
      }
    } else {
      departures = {
        future: [],
        past: []
      }
    }
    return departures
  }
  return {
    departures: departures
  }
}
export default RoutePageParser