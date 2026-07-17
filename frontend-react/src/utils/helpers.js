/**
 * Tạo class name từ danh sách điều kiện.
 * Loại bỏ falsy values.
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string}
 */
export function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Nhóm array theo key.
 * @param {Array} arr
 * @param {Function|string} keyFn
 * @returns {Object}
 */
export function groupBy(arr, keyFn) {
  const fn = typeof keyFn === 'function' ? keyFn : (item) => item[keyFn];
  return arr.reduce((acc, item) => {
    const key = fn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Delay execution (promise-based sleep).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lấy giá trị nested từ object theo path string.
 * @param {Object} obj
 * @param {string} path - e.g. 'user.profile.name'
 * @param {*} defaultValue
 * @returns {*}
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
}
