function convertToDnDCurrency(goldPieces) {
    let totalCopper = Math.round(goldPieces * 100);
    let gp = Math.floor(totalCopper / 100);
    let sp = Math.floor((totalCopper % 100) / 10);
    let cp = totalCopper % 10;

    let result = [];
    if (gp > 0) {
        result.push(`${gp}GP`);
    }
    if (sp > 0) {
        result.push(`${sp}SP`);
    }
    if (cp > 0) {
        result.push(`${cp}CP`);
    }

    return result.join(' ');
}

function formatDuration(days, hours, minutes, seconds) {
    let parts = []
    if (days > 0) days > 1 ? parts.push(`${days} Days`) : parts.push(`${days} Day`)
    if (hours > 0) parts.push(`${hours} hours`)
    if (minutes > 0) parts.push(`${minutes} minutes`)
    if (seconds > 0) parts.push(`${seconds} seconds`)
    return parts.join(", ")
}

export {convertToDnDCurrency, formatDuration};

