"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleArray = shuffleArray;
function shuffleArray(arr) {
    var _a;
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [copy[j], copy[i]], copy[i] = _a[0], copy[j] = _a[1];
    }
    return copy;
}
