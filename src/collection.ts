'use strict'

export class Collection {
  private items: any[]

  constructor (items: any[] = []) {
    this.items = items
  }

  /**
   * Processes the collection pipeline and returns
   * all items in the collection.
   *
   * @returns {Array}
   */
  async all (): Promise<any[]> {
    return this.items
  }

  /**
   * Returns the average of all collection items.
   *
   * @returns {Number}
   * */
  async avg (): Promise<number> {
    return await this.sum() / this.size()
  }

  /**
   * Breaks the collection into multiple, smaller collections
   * of the given `size`.
   *
   * @param {Number} size
   *
   * @returns {Array}
   */
  chunk (size: number): any[] {
    const chunks = []

    while (this.size()) {
      chunks.push(
        this.items.splice(0, size)
      )
    }

    return chunks
  }

  /**
   * Collapse a collection of arrays into a single, flat collection.
   *
   * @returns {Array}
   */
  collapse (): any[] {
    return [].concat(...this.items)
  }

  /**
   * Removes all falsey values from the given `array`.
   * Falsey values are `null`, `undefined`, `''`,
   * `false`, `0`, `NaN`.
   *
   * @returns {Array}
   */
  async compact (): Promise<any[]> {
    return this.filter((item: any) => item)
  }

  /**
   * Creates a new collection containing the
   * concatenated items of the original
   * collection with the new `items`.
   *
   * @param {Array} items
   *
   * @returns {Array}
   */
  concat (items: any[]): any[] {
    return this.items.concat(...items)
  }

  /**
   * Counts the items in the collection. By default, it behaves like an alias
   * for the `size()` method counting each individual item. The `callback`
   * function allows you to count a subset of items in the collection.
   *
   * @param {Function} callback
   *
   * @returns {Number}
   */
  async count (callback?: Function): Promise<number> {
    if (!callback) {
      return this.size()
    }

    const filtered = await this.filter(callback)

    return filtered.length
  }

  /**
   * Removes all values from the collection that are present in the given array.
   *
   * @param {*} items
   *
   * @returns {CollectionProxy}
   */
  diff (items: any[]): any[] {
    return this.items.filter((item: any) => !items.includes(item))
  }

  /**
   * Asynchronous version of `Array#every()`, running the (async) testing
   * function in sequence. Returns `true` if all items in the collection
   * pass the check implemented by the `callback`, otherwise `false`.
   *
   * @param {Function} callback
   *
   * @returns {Boolean} Returns `true` if all items pass the predicate check, `false` otherwise.
   */
  async every (callback: Function): Promise<boolean> {
    const mapped = await this.map(callback)

    return mapped.every(value => value)
  }

  /**
   * Asynchronous version of Array#filter(), running the (async) testing
   * function in sequence. The `callback` should return `true`
   * if an item should be included in the resulting collection.
   *
   * @param {Function} callback
   *
   * @returns {Array}
   */
  async filter (callback: Function): Promise<any[]> {
    const mapped = await this.map(callback)

    return this.items.filter((_, i) => mapped[i])
  }

  /**
   * A variant of the `filter` method running the (async) testing
   * function only if the given `condition` is `true`.
   *
   * @param {Function} callback
   * @param {Boolean} condition
   *
   * @returns {Array}
   */
  async filterIf (callback: Function, condition: boolean): Promise<any[]> {
    return condition
      ? this.filter(callback)
      : this.items
  }

  /**
   * Asynchronous version of Array#find(), running the (async) testing
   * function in sequence. Returns the first item in the collection
   * satisfying the given `callback`, `undefined` otherwise.
   *
   * @param {Function} callback
   *
   * @returns {*} the found value
   */
  async find (callback: Function): Promise<any|undefined> {
    for (const [index, value] of this.items.entries()) {
      const result = await callback(value, index, this.items)

      if (result) {
        return this.items[index]
      }
    }
  }

  /**
   * Alias for "find".
   *
   * @param {Function} callback
   *
   * @returns {*} the found value
   */
  async first (callback: Function): Promise<any> {
    if (!callback) {
      return this.items[0]
    }

    if (typeof callback === 'function') {
      return this.find(callback)
    }

    throw new Error(`Collection.first() accepts only a callback function as an argument, received ${typeof callback}`)
  }

  /**
   * Asynchronous version of Array#flatMap(). It invokes the `callback`
   * on each collection item. The callback can modify and return the
   * item resulting in a new collection of modified items.
   * Ultimately, flatMap flattens the mapped results.
   *
   * @param {Function} callback
   *
   * @returns {Array}
   */
  async flatMap (callback: Function): Promise<any[]> {
    this.items = await this.map(callback)

    return this.collapse()
  }

  /**
   * Asynchrounous version of Array#forEach(), running the given
   * `callback` function on each `array` item in sequence.
   *
   * @param {Function} callback
   */
  async forEach (callback: Function): Promise<void> {
    await this.map(callback)
  }

  /**
   * Group the collection items into arrays using the given `key`.
   *
   * @param {String} key
   *
   * @returns {Object}
   */
  async groupBy (key: string): Promise<any> {
    if (key.includes('.')) {
      throw new Error('We do not support nested grouping yet. Please send a PR for that feature?')
    }

    return this.reduce((carry: any, item: any) => {
      const group = item[key] || ''

      if (carry[group] === undefined) {
        carry[group] = []
      }

      carry[group].push(item)

      return carry
    }, {})
  }

  /**
   * Determines whether the the collection contains the item
   * represented by `callback` or if the collection
   * satisfies the given `callback` testing function.
   *
   * @param {Function} callback
   *
   * @returns {Boolean}
   */
  async has (callback: Function): Promise<boolean> {
    const item = typeof callback === 'function'
      ? await this.find(callback)
      : await this.find((item: any) => item === callback)

    return !!item
  }

  /**
   * Returns `true` when the collection contains duplicate items, `false` otherwise.
   *
   * @returns {Boolean}
   */
  async hasDuplicates (): Promise<boolean> {
    return (new Set(this.items)).size !== this.size()
  }

  /**
   * Creates an array of unique values that are included in both given array.
   *
   * @param {Array} items
   *
   * @returns {Array}
   */
  intersect (items: any[]): any[] {
    return [...new Set(
      this.items.filter(value => items.includes(value))
    )]
  }

  /**
   * Returns `true` when the collection is empty, `false` otherwise.
   *
   * @returns {Boolean}
   */
  isEmpty (): boolean {
    return this.items.length === 0
  }

  /**
   * Returns `true` when the collection is not empty, `false` otherwise.
   *
   * @returns {Boolean}
   */
  isNotEmpty (): boolean {
    return this.items.length > 0
  }

  /**
   * Returns a new string by concatenating all of the elements in an array.
   *
   * @returns {String}
   */
  join (separator: string): string {
    return this.items.join(separator)
  }

  /**
   * Returns the last item in the collection that satisfies
   * the `callback` testing function, `undefined` otherwise.
   *
   * @param {Function} callback
   *
   * @returns {*} the found value
   */
  async last (callback: Function): Promise<any> {
    if (!callback) {
      return this.items[this.items.length - 1]
    }

    if (typeof callback === 'function') {
      const mapped = await this.filter(callback)

      return mapped[mapped.length - 1]
    }

    throw new Error(`Collection.last() accepts only a callback function as an argument, received ${typeof callback}`)
  }

  /**
   * Asynchronous version of Array#map(), running all transformations
   * in sequence. It runs the given `callback` on each item of
   * the `array` and returns an array of transformed items.
   *
   * @param {Function} callback
   *
   * @returns {Array}
   */
  async map (callback: Function): Promise<any[]> {
    const results = []

    for (const [index, value] of this.items.entries()) {
      results.push(
        await callback(value, index, this.items)
      )
    }

    return results
  }

  /**
   * Returns the max value in the collection.
   *
   * @returns {Number}
   */
  max (): number {
    return Math.max(...this.items)
  }

  /**
   * Returns median of the current collection.
   *
   * @param {}
   *
   * @returns {Number}
   */
  median (): number {
    this.sort((a: any, b: any) => a - b)

    const mid: number = Math.floor(this.size() / 2)

    return this.size() % 2 !== 0
      ? this.items[mid]
      : (this.items[mid] + this.items[(mid - 1)]) / 2 // eslint-disable-line
  }

  /**
   * Returns the min value in the collection.
   *
   * @returns {Number}
   */
  min (): number {
    return Math.min(...this.items)
  }

  /**
   * Retrieves all values for the given `keys`.
   *
   * @param {String|Array} keys
   *
   * @returns {Array}
   */
  async pluck (key: string|string[]): Promise<any[]> {
    const keys = ([] as any[]).concat(key)

    return keys.length === 1
      ? this.pluckOne(keys[0])
      : this.pluckMany(keys)
  }

  /**
   * Retrieves all values for a single `key`.
   *
   * @param {String} key
   *
   * @returns {Array}
   */
  async pluckOne (key: string): Promise<any[]> {
    const keySplitted: string[] = key.split('.')
    return this.map((item: any) => {
      return keySplitted.reduce((parent, prop) => parent?.[prop], item)
    })
  }

  /**
   * Retrieves all values as an array of objects where
   * each object contains the given `keys`.
   *
   * @param {Array} keys
   *
   * @returns {Array}
   */
  async pluckMany (keys: string[]): Promise<any[]> {
    return this.map((item: any) => {
      const result: any = {}

      keys.forEach(key => {
        const keySplitted: string[] = key.split('.')
        result[key] = keySplitted.reduce((parent, prop) => parent?.[prop], item)
      })

      return result
    })
  }

  /**
   * Removes and returns the last item from the collection.
   *
   * @param {}
   *
   * @returns {Number}
   */
  pop (): any {
    return this.items.pop()
  }

  /**
   * Add one or more items to the end of the colleciton.
   *
   * @param  {*} items
   *
   * @returns {Collection}
   */
  push (items: any[]): this {
    this.items.push(...items)

    return this
  }

  /**
   * Asynchronous version of Array#reduce(). It invokes the `reducer`
   * function sequentially on each `array` item. The reducer
   * transforms an accumulator value based on each item.
   *
   * @param {Function} reducer
   * @param {*} initial accumulator value
   *
   * @returns {*} resulting accumulator value
   */
  async reduce (reducer: Function, accumulator: any): Promise<any> {
    // eslint-disable-next-line
    for (const index in this.items) {
      accumulator = await reducer(accumulator, this.items[index], index, this.items)
    }

    return accumulator
  }

  /**
   * Asynchronous version of Array#reduceRight(). It invokes the `reducer`
   * function sequentially on each `array` item, from right-to-left. The
   * reducer transforms an accumulator value based on each item.
   *
   * @param {Function} reducer
   * @param {*} initial accumulator value
   *
   * @returns {*} resulting accumulator value
   */
  async reduceRight (reducer: Function, accumulator: any): Promise<any> {
    let index = this.items.length

    while (index--) {
      accumulator = await reducer(accumulator, this.items[index], index, this.items)
    }

    return accumulator
  }

  /**
   * Inverse of Array#filter(), **removing** all items satisfying the `callback`
   * testing function. Processes each item in sequence. The callback should
   * return `true` if an item should be removed from the resulting collection.
   *
   * @param {Function} callback
   *
   * @returns {Array}
   */
  async reject (callback: Function): Promise<any[]> {
    const mapped = await this.map(callback)

    return this.items.filter((_, i) => !mapped[i])
  }

  /**
  * Returns reversed version of original collection.
  *
  * @returns {Array}
  */
  reverse (): any[] {
    this.items.reverse()

    return this.items
  }

  /**
   * Removes and returns the first item from the collection.
   *
   * @returns {*}
   */
  shift (): any {
    return this.items.shift()
  }

  /**
   * Returns the number of items in the collection.
   *
   * @returns {Number}
   */
  size (): number {
    return this.items.length
  }

  /**
   * Returns a chunk of items beginning at the `start`
   * index without removing them from the collection.
   * You can `limit` the size of the slice.
   *
   * @param {Number} start
   * @param {Number} limit
   *
   * @returns {Array}
   */
  slice (options: any): any[] {
    const { start, limit } = options
    const chunk = this.items.slice(start)

    return chunk.slice(0, limit)
  }

  /**
  * Removes and returns a chunk of items beginning at the `start`
  * index from the collection. You can `limit` the size of the
  * slice and replace the removed items with `inserts`.
  *
  * @param {Number} start
  * @param {Number} limit
  * @param {*} inserts
  *
  * @returns {Array}
  */
  splice (options: any): any[] {
    const { start, limit, inserts } = options
    const flattend = Array.prototype.concat(...inserts)
    this.items.splice(start, limit || this.items.length, ...flattend)

    return this.items.slice(0)
  }

  /**
   * Asynchronous version of `Array#some()`, running the (async) testing function
   * in sequence. Returns `true` if at least one element in the collection
   * passes the check implemented by the `callback`, otherwise `false`.
   *
   * @param {Function} callback
   *
   * @returns {Boolean}
   */
  async some (callback: Function): Promise<boolean> {
    const mapped = await this.map(callback)

    return mapped.some(value => value)
  }

  /**
   * Returns a sorted list of all collection items, with an optional comparator.
   *
   * @param {Function} comparator
   *
   * @returns {Collection}
   */
  sort (comparator: (a: any, b: any) => number): any[] {
    return [...this.items.sort(comparator)]
  }

  /**
   * Returns the sum of all collection items.
   *
   * @returns {Number} resulting sum of collection items
   */
  async sum (): Promise<number> {
    return this.reduce((carry: number, item: number) => {
      return carry + item
    }, 0)
  }

  /**
   * Take and remove `limit` items from the
   * beginning or end of the collection.
   *
   * @param {Integer} limit
   *
   * @returns {Array}
   */
  takeAndRemove (limit: number): any[] {
    return limit < 0
      ? this.items.splice(0, this.size() + limit)
      : this.items.splice(limit)
  }

  /**
   * Tap into the chain, run the given `callback` and retreive the original value.
   *
   * @returns {Collection}
   */
  async tap (callback: Function): Promise<this> {
    await this.forEach(callback)

    return this
  }

  /**
   * Returns JSON representation of collection.
   *
   * @returns {String}
   */
  toJSON (): string {
    return JSON.stringify(this.items)
  }

  /**
   * Returns all the unique items in the collection.
   *
   * @param {String|Function}
   *
   * @returns {Array}
   */
  async unique (key?: string|Function): Promise<any[]> {
    if (key) {
      return this.uniqueBy(
        this.valueRetriever(key)
      )
    }

    return Array.from(
      new Set(this.items)
    )
  }

  /**
   * Returns all unique items in the collection identified by the given `selector`.
   *
   * @param {Function}
   *
   * @returns {Array}
   */
  async uniqueBy (selector: (item: any) => any): Promise<any[]> {
    const exists = new Set()

    return this.reject(async (item: any) => {
      const id = await selector(item)

      if (exists.has(id)) {
        return true
      }

      exists.add(id)
    })
  }

  /**
   * Create a value receiving callback.
   *
   * @param {*} value
   *
   * @returns {Function}
   */
  valueRetriever (value: Function|any): (item: any) => any {
    return typeof value === 'function'
      ? value
      : function (item: any) {
        return item[value]
      }
  }

  /**
   * Add one or more items to the beginning of the collection.
   *
   * @returns {Collection}
   */
  unshift (items: any[]): this {
    this.items.unshift(...items)

    return this
  }
}
