'use strict'

const Sinon = require('sinon')
const Lab = require('@hapi/lab')
const Collect = require('../dist')
const { expect } = require('@hapi/code')

const { describe, it } = (exports.lab = Lab.script())

const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Chained Collection ->', () => {
  it('returns an empty array when used without data', async () => {
    expect(
      await Collect().all()
    ).to.equal([])
  })

  it('wraps the initial data in an array if not already array', async () => {
    expect(
      await Collect('Marcus').all()
    ).to.equal(['Marcus'])
  })

  it('ensures an empty array when passing an empty value', async () => {
    expect(
      await Collect().all()
    ).to.equal([])

    expect(
      await Collect(null).all()
    ).to.equal([])
  })

  it('processes a collection pipeline', async () => {
    const result = await Collect([1, 2, 3])
      .map(async item => item * 2)
      .filter(async item => item > 2)

    expect(result).to.equal([4, 6])
  })

  it('chunk', async () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]

    expect(
      await Collect(input)
        .chunk(3)
        .all()
    ).to.equal([[1, 2, 3], [4, 5, 6], [7, 8]])
    expect(input).to.equal([1, 2, 3, 4, 5, 6, 7, 8])

    expect(
      await Collect([1, 2, 3, 4, 5, 6, 7, 8])
        .map(item => item * 10)
        .filter(item => item > 50)
        .chunk(2)
        .all()
    ).to.equal([[60, 70], [80]])
  })

  it('clone', async () => {
    const collection = Collect([1, 2, 3])
    const shallow = collection.clone()
    expect(collection === shallow).to.be.false()
    expect(collection[0] === shallow[0]).to.be.true()

    const objects = Collect([{ name: 'Marcus' }])
    const clone = collection.clone()
    expect(objects === clone).to.be.false()
    expect(objects[0] === clone[0]).to.be.true()
  })

  it('collapse', async () => {
    expect(
      await Collect([[1], [{}, 'Marcus', true], [22]])
        .collapse()
        .all()
    ).to.equal([1, {}, 'Marcus', true, 22])
  })

  it('flatten', async () => {
    expect(
      await Collect([1, 2, [3, 4]]).flatten()
    ).to.equal([1, 2, 3, 4])
  })

  it('compact', async () => {
    expect(
      await Collect([0, null, undefined, 1, false, 2, '', 3, NaN])
        .compact()
        .all()
    ).to.equal([1, 2, 3])
  })

  it('map', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3])
        .map(async item => {
          await pause(10)

          return item * 10
        })
        .all()
    ).to.equal([10, 20, 30])

    const elapsed = Date.now() - start
    expect(elapsed >= 30).to.be.true() // map should run in sequence
  })

  it('flatMap', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3])
        .flatMap(async item => {
          await pause(10)

          return [item, item]
        })
        .all()
    ).to.equal([1, 1, 2, 2, 3, 3])

    const elapsed = Date.now() - start
    expect(elapsed >= 30).to.be.true() // map should run in sequence
  })

  it('filter', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).filter(async (item) => {
        await pause(10)

        return item > 1
      }).all()
    ).to.equal([2, 3])

    const elapsed = Date.now() - start
    expect(elapsed).to.be.within(29, 100)
  })

  it('filterIf', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).filterIf(2 > 1, async (item) => {
        await pause(5)

        return item > 1
      }).all()
    ).to.equal([2, 3])

    const elapsed = Date.now() - start
    expect(elapsed).to.be.within(14, 50)

    expect(
      await Collect([1, 2, 3]).filterIf(1 > 7, async (item) => {
        return item > 1
      }).all()
    ).to.equal([1, 2, 3])
  })

  it('reject', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3, 4, 5])
        .reject(async (item) => {
          await pause(10)

          return item % 2 === 1 // remove all odds
        })
        .all()
    ).to.equal([2, 4])

    const elapsed = Date.now() - start
    expect(elapsed >= 50).to.be.true()
  })

  it('reduce', async () => {
    expect(
      await Collect([1, 2, 3]).reduce(async (carry, item) => {
        await pause(10)

        return carry + item
      }, 0)
    ).to.equal(6)

    expect(
      await Collect(['one', 'two', 'three']).reduce(async (carry, item) => {
        return `${carry}---${item}`
      }, 'hey')
    ).to.equal('hey---one---two---three')
  })

  it('reduceRight', async () => {
    expect(
      await Collect([1, 2, 3, 4, 5]).reduceRight(async (carry, item) => {
        await pause(10)

        return `${carry}${item}`
      }, '')
    ).to.equal('54321')

    expect(
      await Collect([1, 2, 3, 4, 5]).reduceRight(async (carry, item) => {
        await pause(10)

        return carry.concat(item)
      }, [])
    ).to.equal([5, 4, 3, 2, 1])
  })

  it('find', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).find(item => item === 2)
    ).to.equal(2)

    const elapsed = Date.now() - start
    expect(elapsed < 100).to.be.true()

    expect(
      await Collect([1, 2, 3]).find(item => item === 10)
    ).to.be.undefined()
  })

  it('every', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).every(item => item === 2)
    ).to.be.false()

    const elapsed = Date.now() - start
    expect(elapsed < 100).to.be.true()

    expect(
      await Collect([1, 2, 3]).every(item => item < 10)
    ).to.be.true()
  })

  it('size', async () => {
    expect(
      await Collect([1, 2, 3]).size()
    ).to.equal(3)

    expect(
      await Collect([]).size()
    ).to.equal(0)
  })

  it('max', async () => {
    expect(
      await Collect([10, 20, 2, 1]).max()
    ).to.equal(20)

    expect(
      await Collect([55, 5, 10]).max()
    ).to.equal(55)

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .max()
    ).to.equal(6)
  })

  it('diff', async () => {
    const items = [1, 2, 3]
    const collection = Collect([1, 2, 3])

    expect(
      await collection.diff([2, 3, 4, 5]).all()
    ).to.equal([1])
    expect(
      await collection.all()
    ).to.equal(items)

    expect(
      await Collect([1, 2, 3]).diff([1, 3, 5, 7]).all()
    ).to.equal([2])

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .diff([1, 3, 5, 7])
        .all()
    ).to.equal([2, 4, 6])
  })

  it('slice', async () => {
    const collection1 = Collect([1, 2, 3, 4, 5, 6])
    const chunk1 = await collection1.slice(3).all()
    expect(await collection1.all()).to.equal([1, 2, 3, 4, 5, 6])
    expect(chunk1).to.equal([4, 5, 6])

    const collection2 = Collect([1, 2, 3, 4, 5, 6])
    const chunk2 = await collection2.slice(3, 2).all()
    expect(await collection2.all()).to.equal([1, 2, 3, 4, 5, 6])
    expect(chunk2).to.equal([4, 5])
  })

  it('splice', async () => {
    const collection1 = Collect([1, 2, 3, 4, 5])
    const chunk1 = collection1.splice(2)
    expect(await collection1.all()).to.equal([1, 2])
    expect(await chunk1.all()).to.equal([3, 4, 5])

    // splice with start and limit
    const collection2 = Collect([1, 2, 3, 4, 5])
    const chunk2 = collection2.splice(2, 2)
    expect(await collection2.all()).to.equal([1, 2, 5])
    expect(await chunk2.all()).to.equal([3, 4])

    // inserts items
    const collection3 = Collect([1, 2, 3, 4, 5])
    const chunk3 = collection3.splice(2, 2, 8, 9)
    expect(await collection3.all()).to.equal([1, 2, 8, 9, 5])
    expect(await chunk3.all()).to.equal([3, 4])

    // inserts items from an array
    const collection4 = Collect([1, 2, 3, 4, 5])
    const chunk4 = collection4.splice(2, 2, [10, 11])
    expect(await collection4.all()).to.equal([1, 2, 10, 11, 5])
    expect(await chunk4.all()).to.equal([3, 4])

    // takes more items than available
    const collection5 = Collect([1, 2, 3, 4, 5])
    const chunk5 = collection5.splice(2, 10)
    expect(await collection5.all()).to.equal([1, 2])
    expect(await chunk5.all()).to.equal([3, 4, 5])

    // keeps order of collection pipeline
    const collection6 = Collect([1, 2, 3, 4, 5]).map(item => item * 10).filter(item => item > 10)
    const chunk6 = collection6.splice(0, 1)
    expect(await collection6.all()).to.equal([30, 40, 50])
    expect(await chunk6.all()).to.equal([20])
  })

  it('some', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).some(item => item > 5)
    ).to.be.false()

    const elapsed = Date.now() - start
    expect(elapsed < 100).to.be.true()

    expect(
      await Collect([1, 2, 3]).some(item => item < 10)
    ).to.be.true()
  })

  it('any', async () => {
    const start = Date.now()

    expect(
      await Collect([1, 2, 3]).any(item => item > 5)
    ).to.be.false()

    const elapsed = Date.now() - start
    expect(elapsed < 100).to.be.true()

    expect(
      await Collect([1, 2, 3]).any(item => item < 10)
    ).to.be.true()
  })

  it('sum', async () => {
    expect(
      await Collect([1, 2, 3]).sum()
    ).to.equal(6)

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .intersect([4, 6])
        .sum()
    ).to.equal(10)
  })

  it('forEach', async () => {
    const start = Date.now()

    await Collect([1, 2, 3, 4])
      .forEach(async () => {
        await pause(10)
      })

    const elapsed = Date.now() - start
    expect(elapsed).to.be.within(39, 70)

    const callback = Sinon.spy()

    await Collect([1, 2, 3]).forEach(callback)

    expect(callback.called).to.be.true()
    expect(callback.calledWith(1)).to.be.true()
    expect(callback.calledWith(2)).to.be.true()
    expect(callback.calledWith(3)).to.be.true()
    expect(callback.calledWith(4)).to.be.false()
  })

  it('intersect', async () => {
    const items = [1, 2, 3, 3]
    const collection = Collect(items)
    const intersect = collection.intersect([2, 3, 4, 5])
    expect(await intersect.all()).to.equal([2, 3])
    expect(await collection.all()).to.equal(items)

    expect(
      await collection
        .map(item => item * 2)
        .intersect([4, 5, 6])
        .all()
    ).to.equal([4, 6])
  })

  it('isEmpty', async () => {
    expect(await Collect().isEmpty()).to.be.true()
    expect(await Collect(null).isEmpty()).to.be.true()
    expect(await Collect(undefined).isEmpty()).to.be.true()

    expect(await Collect([1, 2, 3]).isEmpty()).to.be.false()
  })

  it('isNotEmpty', async () => {
    expect(await Collect().isNotEmpty()).to.be.false()
    expect(await Collect(null).isNotEmpty()).to.be.false()
    expect(await Collect(undefined).isNotEmpty()).to.be.false()

    expect(await Collect([1, 2, 3]).isNotEmpty()).to.be.true()
  })

  it('join', async () => {
    expect(await Collect([1, 2, 3]).join()).to.equal('1,2,3')
    expect(await Collect([1, 2, 3]).join('')).to.equal('123')
    expect(await Collect([1, 2, 3]).join('-')).to.equal('1-2-3')

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .join('-.-')
    ).to.equal('2-.-4-.-6')
  })

  it('take', async () => {
    const items = [1, 2, 3, 4, 5, 6]
    const collection = Collect(items)

    const firstTwo = collection.take(2)
    expect(await collection.all()).to.equal(items)
    expect(await firstTwo.all()).to.equal([1, 2])

    const lastTwo = collection.take(-2)
    expect(await collection.all()).to.equal(items)
    expect(await lastTwo.all()).to.equal([5, 6])

    const pipeline = Collect([1, 2, 3, 4, 5, 6])
      .map(item => item * 10)
      .filter(item => item > 20)
    const all = pipeline.take(30)
    expect(await pipeline.all()).to.equal([30, 40, 50, 60])
    expect(await all.all()).to.equal([30, 40, 50, 60])
  })

  it('takeAndRemove', async () => {
    const collection = Collect([1, 2, 3, 4, 5, 6])
    const firstTwo = collection.takeAndRemove(2)
    expect(await collection.all()).to.equal([3, 4, 5, 6])
    expect(await firstTwo.all()).to.equal([1, 2])

    const collection2 = Collect([1, 2, 3, 4, 5, 6])
    const lastTwo = collection2.takeAndRemove(-2)
    expect(await lastTwo.all()).to.equal([5, 6])
    expect(await collection2.all()).to.equal([1, 2, 3, 4])

    const pipeline = Collect([1, 2, 3, 4, 5, 6])
      .map(item => item * 10)
      .filter(item => item > 20)
    const all = pipeline.takeAndRemove(30)
    expect(await pipeline.all()).to.equal([])
    expect(await all.all()).to.equal([30, 40, 50, 60])
  })

  it('toJSON', async () => {
    expect(
      await Collect([11, 22, 33, 44, 55, 66]).toJSON()
    ).to.be.equal('[11,22,33,44,55,66]')

    expect(
      await Collect([{ test: 'value1', test2: 2 }]).toJSON()
    ).to.be.equal('[{"test":"value1","test2":2}]')
  })

  it('unique', async () => {
    const items = [1, 2, 2, 1, 3, 4, 4]
    const collection = Collect(items)
    const unique = collection.unique()

    expect(await unique.all()).to.equal([1, 2, 3, 4])
    expect(await collection.all()).to.equal(items)

    const users = [
      { name: 'Marcus' },
      { name: 'Marcus' },
      { name: 'Supercharge' }
    ]

    // with key
    const collectionWithKey = Collect(users).unique('name')

    expect(await collectionWithKey.all()).to.equal([
      { name: 'Marcus' },
      { name: 'Supercharge' }
    ])
    expect(await collectionWithKey.all()).to.equal(users)

    // with function
    expect(
      await Collect(users).unique(async item => {
        return item.name
      })
    ).to.equal([
      { name: 'Marcus' },
      { name: 'Supercharge' }
    ])
  })

  it('uniqueBy', async () => {
    const items = [
      { name: 'Marcus' },
      { name: 'Supercharge' },
      { name: 'Marcus' }
    ]

    expect(
      await Collect(items).uniqueBy(async item => {
        return item.name
      })
    ).to.equal([
      { name: 'Marcus' },
      { name: 'Supercharge' }
    ])
  })

  it('union', async () => {
    const items = [1, 2, 3]
    const collection = Collect(items)
    const union = collection.union([2, 3, 4, 5])

    expect(await collection.all()).to.equal(items)
    expect(await union.all()).to.equal([1, 2, 3, 4, 5])

    expect(
      await collection
        .map(item => item * 2)
        .union([10, 20])
        .all()).to.equal([2, 4, 6, 10, 20])
  })

  it('push', async () => {
    expect(
      await Collect([1, 2, 3])
        .push(4)
        .all()
    ).to.equal([1, 2, 3, 4])

    expect(
      await Collect([1, 2, 3])
        .push(4, 5, 6)
        .all()
    ).to.equal([1, 2, 3, 4, 5, 6])

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .filter(item => item > 5)
        .push(10, 20, 30)
        .all()
    ).to.equal([6, 10, 20, 30])
  })

  it('pop', async () => {
    expect(
      await Collect([1, 2, 3]).pop()
    ).to.equal(3)

    const collection = Collect([])
    const undef = await collection.pop()
    expect(undef).to.equal(undefined)
    expect(await collection.all()).to.equal([])

    const pipeline = Collect([1, 2, 3, 4, 5]).map(item => item * 2).filter(item => item > 5)
    const ten = await pipeline.pop()
    expect(ten).to.equal(10)
    expect(await pipeline.all()).to.equal([6, 8])
  })

  it('shift', async () => {
    const collection = Collect([1, 2, 3])
    const one = await collection.shift()
    expect(one).to.equal(1)
    expect(await collection.all()).to.equal([2, 3])

    const pipeline = Collect([1, 2, 3, 4, 5]).map(item => item * 2).filter(item => item > 5)
    const six = await pipeline.shift()
    expect(six).to.equal(6)
    expect(await pipeline.all()).to.equal([8, 10])
  })

  it('concat', async () => {
    const collection = Collect([1, 2, 3])
    const concat = collection.concat([4, 5])
    expect(await collection.all()).to.equal([1, 2, 3])
    expect(await concat.all()).to.equal([1, 2, 3, 4, 5])

    const collection1 = Collect([1, 2, 3])
    const concat1 = collection1.concat(4, 5)
    expect(await collection1.all()).to.equal([1, 2, 3])
    expect(await concat1.all()).to.equal([1, 2, 3, 4, 5])

    const pipeline = Collect([1, 2, 3]).map(item => item * 2).filter(item => item > 5)
    const pipedConcat = pipeline.concat([10, 20])
    expect(await pipeline.all()).to.equal([6])
    expect(await pipedConcat.all()).to.equal([6, 10, 20])

    expect(await Collect().concat([1, 2]).all()).to.equal([1, 2])
  })

  it('sort', async () => {
    const collection = Collect([3, 2, 1])
    const sorted = collection.sort()
    expect(await collection.all()).to.equal([3, 2, 1])
    expect(await sorted.all()).to.equal([1, 2, 3])

    expect(
      await collection
        .map(item => item * 2)
        .sort()
        .all()
    ).to.equal([2, 4, 6])

    const collection1 = Collect([1, 2, 3])
    const sorted1 = collection1.sort((a, b) => b - a)
    expect(await collection1.all()).to.equal([1, 2, 3])
    expect(await sorted1.all()).to.equal([3, 2, 1])
  })

  it('unshift', async () => {
    expect(
      await Collect([1, 2, 3])
        .unshift(4, 5)
        .all()
    ).to.equal([4, 5, 1, 2, 3])

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .filter(item => item > 5)
        .unshift(10, 20, 30)
        .all()
    ).to.equal([10, 20, 30, 6])
  })

  it('min', async () => {
    expect(
      await Collect([10, 2, 3, 4]).min()
    ).to.equal(2)

    expect(
      await Collect([10, '2', 3, 4]).min()
    ).to.equal(2)

    expect(
      await Collect([10, 2, -1, 4]).min()
    ).to.equal(-1)

    expect(
      await Collect([10, 2, -1, 4])
        .map(item => item * 2)
        .min()
    ).to.equal(-2)
  })

  it('first', async () => {
    expect(
      await Collect([1, 2, 3]).first()
    ).to.equal(1)

    await expect(
      Collect([1, 2, 3]).first(1)
    ).to.reject(Error) // only callback functions are allowed

    expect(
      await Collect([
        { id: 1, name: '1' },
        { id: 2, name: '2' },
        { id: 1, name: '3' }
      ]).first(item => {
        return item.id === 1
      })
    ).to.equal({ id: 1, name: '1' })

    expect(
      await Collect([{ id: 1, name: '1' }]).first(item => {
        return item.name === 'Marcus'
      })
    ).to.equal(undefined)

    expect(
      await Collect([1, 2, 3]).has(item => item === 4)
    ).to.equal(false)
  })

  it('has', async () => {
    expect(
      await Collect([1, 2, 3]).has(item => item === 2)
    ).to.equal(true)

    expect(
      await Collect([1, 2, 3]).has(3)
    ).to.equal(true)

    expect(
      await Collect([1, 2, 3]).has(item => item === 4)
    ).to.equal(false)
  })

  it('throws', async () => {
    const fn = () => { throw new Error() }

    await expect(
      Collect([1, 2, 3]).forEach(fn)
    ).to.reject()
  })

  it('reverse', async () => {
    expect(
      await Collect([1, 2, 3]).reverse().all()
    ).to.equal([3, 2, 1])

    expect(
      await Collect([1]).reverse().all()
    ).to.equal([1])

    expect(
      await Collect([]).reverse().all()
    ).to.equal([])

    expect(
      await Collect([1, 2, 3, 2, 1]).reverse().all()
    ).to.equal([1, 2, 3, 2, 1])

    const items = [1, 2, 3]
    const collection = Collect(items)

    expect(
      await collection.reverse().all()
    ).to.equal([3, 2, 1])
    expect(
      await collection.all()
    ).to.equal([1, 2, 3])
  })

  it('avg', async () => {
    expect(
      await Collect([1, 2, 3]).avg()
    ).to.equal(2)

    expect(
      await Collect([4, 1]).avg()
    ).to.equal(2.5)

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .avg()
    ).to.equal(4)
  })

  it('median', async () => {
    expect(
      await Collect([1, 2, 3]).median()
    ).to.equal(2)

    expect(
      await Collect([1, 3, 2]).median()
    ).to.equal(2)

    expect(
      await Collect([1, 2]).median()
    ).to.equal(1.5)

    expect(
      await Collect([1, 4, 12, 2, 3, 47])
        .map(item => item * 2) // 2, 8, 24, 4, 6, 94
        .median() // 2, 4, 6, 8, 24, 94
    ).to.equal(7)
  })

  it('last', async () => {
    expect(
      await Collect([1, 2, 3]).last()
    ).to.equal(3)

    await expect(
      Collect([1, 2, 3]).last(1)
    ).to.reject(Error) // only callback functions are allowed

    expect(
      await Collect([
        { id: 1, name: '1' },
        { id: 2, name: '2' },
        { id: 1, name: '3' }
      ]).last(item => {
        return item.id === 1
      })
    ).to.equal({ id: 1, name: '3' })

    expect(
      await Collect([{ id: 1, name: '1' }]).last(item => {
        return item.name === 'Marcus'
      })
    ).to.equal(undefined)

    const items = [1, 2, 3]
    expect(
      await Collect(items)
        .map(item => item * 10)
        .last()
    ).to.equal(30)
    expect(items).to.equal([1, 2, 3])
  })

  it('tap', async () => {
    expect(
      await Collect([1, 2, 3])
        .tap(value => {
          return value * 10
        })
        .all()
    ).to.equal([1, 2, 3])

    expect(
      await Collect([1, 2, 3])
        .map(value => value * 2)
        .tap(value => value * 10)
        .filter(value => value > 4)
        .all()
    ).to.equal([6])
  })

  it('hasDuplicates', async () => {
    expect(
      await Collect([1, 1, 2]).hasDuplicates()
    ).to.be.true()

    expect(
      await Collect([1, 2]).hasDuplicates()
    ).to.be.false()

    expect(
      await Collect([1, 1, 2])
        .map(value => value * 2)
        .hasDuplicates()
    ).to.be.true()
  })

  it('groupBy', async () => {
    const products = [
      { name: 'Macbook', price: 2500 },
      { name: 'Macbook', price: 3000 },
      { name: 'iPhone', price: 1000 }
    ]
    expect(
      await Collect(products).groupBy('name')
    ).to.equal({
      Macbook: [
        { name: 'Macbook', price: 2500 },
        { name: 'Macbook', price: 3000 }
      ],
      iPhone: [
        { name: 'iPhone', price: 1000 }
      ]
    })

    expect(
      await Collect([]).groupBy('name')
    ).to.equal({})

    expect(
      await Collect(products).groupBy('nonExistentKey')
    ).to.equal({ '': products })

    await expect(
      Collect(products).groupBy('name.price')
    ).to.reject()
  })

  it('pluck', async () => {
    const users = [
      { id: 1, name: 'Marcus', email: 'marcus@test.com', data: {
        colors: ['red', 'green', 'blue'], stars: 5,
        links: {
          in: [1, 2]
        }
      } },
      { id: 2, name: 'Norman', email: 'norman@test.com', data: {
        colors: ['yellow', 'purple', 'black'], stars: 4, 
        links: {
          in: [3]
        }
      } },
      { id: 3, name: 'Christian', email: 'christian@test.com', data: {
        colors: ['orange', 'cyan', 'magenta'], stars: 3,
        links: {
          in: [4, 5]
        }
      } }
    ]

    expect(
      await Collect(users).pluck('name').all()
    ).to.equal(['Marcus', 'Norman', 'Christian'])

    expect(
      await Collect(users).pluck(['name', 'email']).all()
    ).to.equal([
      { name: 'Marcus', email: 'marcus@test.com' },
      { name: 'Norman', email: 'norman@test.com' },
      { name: 'Christian', email: 'christian@test.com' }
    ])

    expect(
      await Collect(users).pluck('data.colors').all()
    ).to.equal(['red', 'green', 'blue', 'yellow', 'purple', 'black', 'orange', 'cyan', 'magenta'])

    expect(
      await Collect(users).pluck('data.stars').all()
    ).to.equal([5, 4, 3])

    expect(
      await Collect(users).pluck(['name', 'data.colors', 'data.stars', 'data.links.in']).all()
    ).to.equal([
      { name: 'Marcus', 'data.colors': ['red', 'green', 'blue'], 'data.stars': 5, 'data.links.in': [1, 2] },
      { name: 'Norman', 'data.colors': ['yellow', 'purple', 'black'], 'data.stars': 4, 'data.links.in': [3] },
      { name: 'Christian', 'data.colors': ['orange', 'cyan', 'magenta'], 'data.stars': 3, 'data.links.in': [4, 5] }
    ])
  })
  

  it('then', async () => {
    expect(
      await Collect([1, 2, 3]).map(item => item * 2)
    ).to.equal([2, 4, 6])

    expect(
      await Collect([1, 2, 3])
        .map(item => item * 2)
        .union([1, 3, 5])
        .filter(item => item > 0)
        .sort((a, b) => a - b)
    ).to.equal([1, 2, 3, 4, 5, 6])

    expect(
      await Collect([1, 2, 3]).every(item => item > 5)
    ).to.be.false()

    await expect(
      Collect([1, 2, 3]).map(() => {
        throw new Error('failed')
      })
    ).to.reject('failed')
  })

  it('count', async () => {
    expect(
      await Collect([1, 2, 3]).count()
    ).to.equal(3)

    expect(
      await Collect([1, 2, 3, 4]).count(item => {
        return item > 2
      })
    ).to.equal(2)

    await expect(
      Collect([1, 2, 3]).count('non-function')
    ).to.reject()
  })
})
