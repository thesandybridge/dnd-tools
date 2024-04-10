function convertToDnDCurrency(goldPieces) {
    let totalCopper = Math.round(goldPieces * 100); // Convert all to copper first to avoid floating point issues
    let gp = Math.floor(totalCopper / 100); // Determine gold pieces
    let sp = Math.floor((totalCopper % 100) / 10); // Determine silver pieces
    let cp = totalCopper % 10; // Remaining copper pieces

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

