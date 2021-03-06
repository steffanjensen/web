// idea from https://dev.to/nestedsoftware/lazy-evaluation-in-javascript-with-generators-map-filter-and-reduce--36h5

class Lazy {
    static from (arr) {
        return new Lazy(makeGenerator(arr))
    }

    static of (...arr) {
        return new Lazy(makeGenerator(arr))
    }

    get index () {
      return this._index
    }

    constructor(iterable, callback) {
        this._index = 0
        this.iterable = iterable
        this.callback = callback
    }

    flatMap(callback) {
        return new LazyMap(this, callback).flat()
    }

    filter(callback) {
        return new LazyFilter(this, callback)
    }

    map(callback) {
        return new LazyMap(this, callback)
    }

    trycatch(callback) {
        return new LazyCatchError(this, callback)
    }

    next() {
        const item = this.iterable.next()

        this._index += 1

        return item
    }

    flat(depth = 1) {
        if (depth == 0) {
            return this
        } else {
            const flattened = new LazyFlat(this)
            return flattened.flat(depth - 1)
        }
    }

    take(n) {
        if (!isNaN(n)) {
            return new LazySlice(this, (_, index) => index <= n)
        } else {
            return this
        }
    }

    async reduce(callback, initial = []) {

        let accumulator = initial
        let index = 0

        while (true) {
            const item = await this.iterable.next()

            if (item.done) {
              return accumulator
            }

            accumulator = this.callback(accumulator, item.value, index)

            index += 1
        }

    }

    async unwrap({ accumulate = true, stopOnError = false } = {}) {
        const all = accumulate ? this.accumulated() : this

        while (true) {
            const results = await all.next()

            if (results.done) return results.value
        }
    }

    accumulated(initial = []) {
        const lazy = new LazyAccumulated(this)

        lazy.accumulator = initial

        return lazy
    }

    sleep(callback) {
        return this.peek(async () => {
            const sec = randomTimeout()
            await callback(sec)
            return sleep(sec * 1000)
        })
    }

    peek(callback) {
        return new LazyMap(this, async (value, index) => {
            await callback(value, index)
            return value
        })
    }

}

class LazyFilter extends Lazy {

    get index () {
      return this.iterable.index
    }

    async next() {
        while (true) {
            const item = await this.iterable.next()

            if (item.done) {
                return item
            }

            if (await this.callback(item.value, this.iterable.index)) {
                return item
            }
        }
    }
}

class LazySlice extends Lazy {

    get index () {
      return this.iterable.index
    }

    async next() {
        while (true) {
            const item = await this.iterable.next()

            if (item.done) {
                return item
            }

            if (await this.callback(item.value, this.iterable.index)) {
                return item
            } else {
                return { done: true, value: item.value }
            }
        }
    }
}

class LazyMap extends Lazy {

    get index () {
      return this.iterable.index
    }

    async next() {
        const item = await this.iterable.next()

        if (item.done) {
            return { value: null, done: true }
        }

        const mappedValue = await this.callback(item.value, this.iterable.index)

        return { value: mappedValue, done: false }
    }
}

class LazyFlat extends Lazy {

    get index() {
      return this._index
    }

    async next() {
        if (!this.generator) {
            const page = await this.iterable.next()

            if (page.done) {
                return page
            }

            this.generator = page.value

            // return { value: page.value, done: page.done }
        }

        const item = await this.generator.next()

        if (item.done) {
            const page = await this.iterable.next()

            if (page.done) {
                return page
            }

            this.generator = page.value

            return { value: page.value, done: page.done }
        }

        this._index += 1

        return item
    }
}

class LazyAccumulated extends Lazy {

    get index () {
      return this.iterable.index
    }

    accumulator = []

    async next() {
        let item

        try {
            item = await this.iterable.next()
        } catch (error) {
            item = {
              done: false,
              value: { status: 'error', error },
            }
        }

        if (!item.done)
            this.accumulator.push(item.value)

        return { value: this.accumulator, done: item.done }
    }
}

class LazyCatchError extends Lazy {

    get index () {
      return this.iterable.index
    }

    async next() {
        while (true) {
            try {
                const item = await this.iterable.next()

                return item
            } catch (error) {
                return this.callback(error, this.iterable.index)
            }
        }
    }
}
