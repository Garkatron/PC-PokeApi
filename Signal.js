export default class Signal {
    constructor() {
        this._listeners = new Set();
    }

    connect(callback) {
        if (typeof callback === 'function') {
            this._listeners.add(callback);
        } else {
            throw new Error("El callback debe ser una función.");
        }
    }

    disconnect(callback) {
        this._listeners.delete(callback);
    }

    emit(...args) {
        for (const callback of this._listeners) {
            callback(...args);
        }
    }

    clear() {
        this._listeners.clear();
    }

    getListenerCount() {
        return this._listeners.size;
    }
}
