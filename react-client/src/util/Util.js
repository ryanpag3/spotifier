import LocalStorage from './LocalStorage';

export default class Util {
    static getReactHeader() {
        return {
            user: LocalStorage.get('spotifier_user'),
            react : true
        };
    }
}