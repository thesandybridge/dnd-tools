/**
 * Covert number to formatted D&D currency
 *
 * @param {number} goldPieces - an amount of Gold pieces
 * @returns {string} formatted string of currency
 */
function convertToDnDCurrency(goldPieces) {
  let totalCopper = Math.round(goldPieces * 100)
  let gp = Math.floor(totalCopper / 100)
  let sp = Math.floor((totalCopper % 100) / 10)
  let cp = totalCopper % 10

  let result = []
  if (gp > 0) {
    result.push(`${gp}GP`)
  }
  if (sp > 0) {
    result.push(`${sp}SP`)
  }
  if (cp > 0) {
    result.push(`${cp}CP`)
  }

  return result.join(' ')
}


/**
 * Formats a duration into a human-readable string.
 * Each time component (days, hours, minutes, seconds) is only included in the result if it is greater than zero.
 * The result is a comma-separated list of each component that is greater than zero, properly pluralized.
 *
 * @param {number} days - The number of days.
 * @param {number} hours - The number of hours.
 * @param {number} minutes - The number of minutes.
 * @param {number} seconds - The number of seconds.
 * @returns {string} A human-readable duration string.
 */
function formatDuration(days, hours, minutes, seconds) {
  let parts = []
  if (days > 0) days > 1 ? parts.push(`${days} Days`) : parts.push(`${days} Day`)
  if (hours > 0) parts.push(`${hours} hours`)
  if (minutes > 0) parts.push(`${minutes} minutes`)
  if (seconds > 0) parts.push(`${seconds} seconds`)
  return parts.join(", ")
}

const handleFocus = (e) => {
  if (e.target.value === '0') {
    e.target.value = ''
  }
}

const preventNonNumeric = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

function convertToLabel(symbol) {
  const symbols = {
    CP: "Copper",
    SP: "Silver",
    EP: "Electrum",
    GP: "Gold",
    PP: "Platinum",
  }
  return symbols[symbol] || "Unknown"
}

export {
  convertToDnDCurrency,
  formatDuration,
  handleFocus,
  preventNonNumeric,
  convertToLabel,
}

