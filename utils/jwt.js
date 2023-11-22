function expiration() {
    const timestamp = Math.floor(Date.now() / 1000);
    const res = timestamp + (3 * 60 * 60);
    return res;
}

const claim = {
    exp: expiration
}

module.exports = claim;