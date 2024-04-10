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

export {convertToDnDCurrency};

