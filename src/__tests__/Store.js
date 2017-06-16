import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Store } from '../';
import {
    Animal,
    AnimalStore,
    AnimalStoreWithoutApi,
    AnimalStoreWithoutUrl,
    AnimalStoreWithUrlFunction,
    Breed,
    PersonStore,
} from './fixtures/Animal';
import { CustomerStore } from './fixtures/Customer';
import animalsWithPastOwnersData from './fixtures/animals-with-past-owners.json';
import animalsWithKindBreedData from './fixtures/animals-with-kind-breed.json';
import customersWithTownRestaurants from './fixtures/customers-with-town-restaurants.json';
import customersWithOldTowns from './fixtures/customers-with-old-towns.json';
import animalsData from './fixtures/animals.json';
import pagination1Data from './fixtures/pagination/1.json';
import pagination2Data from './fixtures/pagination/2.json';
import pagination3Data from './fixtures/pagination/3.json';
import pagination4Data from './fixtures/pagination/4.json';

const simpleData = [
    {
        id: 2,
        name: 'Monkey',
    },
    {
        id: 3,
        name: 'Boogie',
    },
    {
        id: 10,
        name: 'Jojo',
    },
];

test('Initialize store with valid data', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    expect(animalStore.length).toBe(3);
    expect(animalStore.models[0].id).toBe(2);
});

test('Chaining parse', () => {
    const animalStore = new AnimalStore().parse([]);

    expect(animalStore).toBeInstanceOf(AnimalStore);
});

test('Initialize store in constructor should throw error', () => {
    expect(() => {
        return new AnimalStore([]);
    }).toThrow(
        'Store only accepts an object with options. Chain `.parse(data)` to add models.'
    );
});

test('Initialize store with invalid option', () => {
    expect(() => {
        return new AnimalStore({ foo: 'bar' });
    }).toThrow('Unknown option passed to store: foo');
});

test('initialize() method should be called', () => {
    const initMock = jest.fn();
    class Zebra extends Store {
        initialize() {
            initMock();
        }
    }

    new Zebra();
    expect(initMock.mock.calls.length).toBe(1);
});

// TODO; see https://github.com/CodeYellowBV/mobx-spine/issues/6
xtest('Initialize store in constructor', () => {
    const animalStore = new AnimalStore(simpleData);
    expect(animalStore.length).toBe(3);
});

test('at model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.at(1);
    expect(model.id).toBe(3);
});

test('at model (negative)', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.at(-1);
    expect(model.id).toBe(10);
});

test('at model (non existent index)', () => {
    const animalStore = new AnimalStore().parse(simpleData);

    expect(() => {
        return animalStore.at(3);
    }).toThrow('Index 3 is out of bounds (max 2).');
    expect(() => {
        return animalStore.at(4);
    }).toThrow('Index 4 is out of bounds (max 2).');
});

test('Model -> Model relation', () => {
    const animalStore = new AnimalStore({
        relations: ['kind.breed'],
    });
    animalStore.parse(simpleData);

    const animal = animalStore.at(0);
    expect(animal.kind.breed).toBeInstanceOf(Breed);
});

test('Store -> Store relation', () => {
    const customerStore = new CustomerStore({
        relations: ['oldTowns.restaurants'],
    });

    customerStore.fromBackend({
        data: customersWithOldTowns.data,
        repos: customersWithOldTowns.with,
        relMapping: customersWithOldTowns.with_mapping,
    });

    expect(customerStore.at(0).oldTowns.map('id')).toEqual([1, 2]);
    expect(customerStore.at(0).oldTowns.at(0).restaurants.map('id')).toEqual([
        10,
        20,
    ]);
});

test('get specific model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.get(3);
    expect(model.id).toBe(3);
});

test('get specific model (loose)', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.get('3');
    expect(model.id).toBe(3);
});

test('map models', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    expect(animalStore.map('id')).toEqual([2, 3, 10]);
});

test('sortBy models', () => {
    const animalStore = new AnimalStore().parse(simpleData);

    expect(animalStore.sortBy('name').map(m => m.name)).toEqual([
        'Boogie',
        'Jojo',
        'Monkey',
    ]);
});

test('filter models', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const models = animalStore.filter(['id', 3]);
    expect(models.length).toBe(1);
});

test('find model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const animal = animalStore.find({ name: 'Jojo' });
    expect(animal.id).toBe(10);
});

test('each model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);
    const ids = [];

    animalStore.each(model => {
        ids.push(model.id);
    });
    expect(ids).toEqual([2, 3, 10]);
});

test('remove one model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.get(3);
    animalStore.remove(model);
    expect(animalStore.map('id')).toEqual([2, 10]);
});

test('remove multiple models', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    expect(animalStore.map('id')).toEqual([2, 3, 10]);
    const model1 = animalStore.get(3);
    const model2 = animalStore.get(10);
    animalStore.remove([model1, model2]);
    expect(animalStore.map('id')).toEqual([2]);
});

test('remove from model without id', () => {
    const animalStore = new AnimalStore();
    animalStore.parse([{ name: 'A' }, { name: 'B' }]);

    animalStore.at(1).delete();
    expect(animalStore.map('name')).toEqual(['A']);
});

test('remove one model by id', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    animalStore.removeById(3);
    expect(animalStore.map('id')).toEqual([2, 10]);
});

test('remove multiple models by id', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    animalStore.removeById([3, 10]);
    expect(animalStore.map('id')).toEqual([2]);
});

test('remove model by id with invalid number', () => {
    const animalStore = new AnimalStore();
    expect(() => {
        return animalStore.removeById(['q']);
    }).toThrow('Cannot remove a model by id that is not a number: ["q"]');
});

test('add one model', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const model = animalStore.add({
        id: 20,
    });
    expect(animalStore.map('id')).toEqual([2, 3, 10, 20]);
    expect(model).toBeInstanceOf(Animal);
});

test('add multiple models', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const models = animalStore.add([
        {
            id: 20,
        },
        {
            id: 21,
        },
    ]);
    expect(animalStore.map('id')).toEqual([2, 3, 10, 20, 21]);
    expect(models).toBeInstanceOf(Array);
    expect(models[0]).toBeInstanceOf(Animal);
});

test('add multiple models with same id', () => {
    const animalStore = new AnimalStore();
    expect(() => {
        return animalStore.add([
            {
                id: 20,
            },
            {
                id: 20,
            },
        ]);
    }).toThrow(
        'A model with the same primary key value "20" already exists in this store.'
    );
});

test('add one model with existing id', () => {
    const animalStore = new AnimalStore().parse(simpleData);
    expect(() => {
        return animalStore.add([
            {
                id: 3,
            },
        ]);
    }).toThrow(
        'A model with the same primary key value "3" already exists in this store.'
    );
});

test('add multiple models without id', () => {
    const animalStore = new AnimalStore().parse(simpleData);
    animalStore.add([
        {
            name: 'King',
        },
        {
            name: 'Alfred',
        },
    ]);
    expect(animalStore.length).toBe(5);
});

test('clear models', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    expect(animalStore.length).toBe(3);
    animalStore.clear();
    expect(animalStore.length).toBe(0);
});

test('virtualStore with basic properties', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const virtual = animalStore.virtualStore({
        filter: m => m.name.includes('e'),
    });
    expect(virtual.map('id')).toEqual([2, 3]);
    const newModel = animalStore.add({ id: 5, name: 'eeeee' });
    expect(virtual.map('id')).toEqual([2, 3, 5]);
    animalStore.remove(newModel);
    expect(virtual.map('id')).toEqual([2, 3]);
    animalStore.get(2).name = 'aaaaa';
    expect(virtual.map('id')).toEqual([3]);
});

test('virtualStore unsubscribe', () => {
    const animalStore = new AnimalStore().parse(simpleData);

    const virtual = animalStore.virtualStore({
        filter: m => m.name.includes('555'),
    });
    virtual.unsubscribeVirtualStore();
    animalStore.add({ id: 5, name: '555' });
    // Verify that the virtualStore is not updated anymore.
    expect(virtual.map('id')).toEqual([]);
});

test('backendResourceName defined as not static should throw error', () => {
    class Zebra extends Store {
        backendResourceName = 'blaat';
    }

    expect(() => {
        return new Zebra();
    }).toThrow(
        '`backendResourceName` should be a static property on the store.'
    );
});

test('One-level store relation', () => {
    const animalStore = new AnimalStore({
        relations: ['pastOwners'],
    });

    animalStore.fromBackend({
        data: animalsWithPastOwnersData.data,
        repos: animalsWithPastOwnersData.with,
        relMapping: animalsWithPastOwnersData.with_mapping,
    });

    expect(animalStore.at(0).pastOwners).toBeInstanceOf(PersonStore);
    expect(animalStore.get(2).pastOwners.map('id')).toEqual([2, 3]);
    expect(animalStore.get(3).pastOwners.map('id')).toEqual([1]);
});

test('toJS', () => {
    const animalStore = new AnimalStore();
    animalStore.parse([{ id: 2, name: 'Monkey' }]);
    expect(animalStore.toJS()).toEqual([{ id: 2, name: 'Monkey' }]);
});

test('Non-array given to parse() should throw an error', () => {
    expect(() => {
        const animalStore = new AnimalStore();
        return animalStore.parse(1);
    }).toThrow('Parameter supplied to `parse()` is not an array, got: 1');
});

test('fetch without api', () => {
    const animalStore = new AnimalStoreWithoutApi();
    expect(() => animalStore.fetch()).toThrow(
        'You are trying to perform a API request without an `api` property defined on the store.'
    );
});

test('fetch without url', () => {
    const animalStore = new AnimalStoreWithoutUrl();
    expect(() => animalStore.fetch()).toThrow(
        'You are trying to perform a API request without an `url` property defined on the store.'
    );
});

test('Comparator - manual sort on attribute', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);
    animalStore.comparator = 'name';
    animalStore.sort();

    expect(animalStore.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});

test('Comparator - manual sort with function', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);
    animalStore.comparator = (a, b) => {
        return b.id - a.id;
    };
    animalStore.sort();

    expect(animalStore.map('id')).toEqual([10, 3, 2]);
});

test('Comparator - initial automatic sort', () => {
    const animalStore = new AnimalStore({ comparator: 'name' });
    animalStore.parse(simpleData);

    expect(animalStore.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});

test('Comparator - after add', () => {
    const animalStore = new AnimalStore({ comparator: 'name' });
    animalStore.parse(simpleData);
    animalStore.add({ name: 'Cee' });

    expect(animalStore.map('name')).toEqual([
        'Boogie',
        'Cee',
        'Jojo',
        'Monkey',
    ]);
});

test('Sort with invalid parameter', () => {
    const animalStore = new AnimalStore();
    expect(() => animalStore.sort(() => null)).toThrow(
        'Expecting a plain object for options.'
    );
});

test('virtualStore with comparator', () => {
    const animalStore = new AnimalStore();
    animalStore.parse(simpleData);

    const virtual = animalStore.virtualStore({
        comparator: 'name',
    });
    expect(virtual.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});

describe('requests', () => {
    let mock;
    beforeEach(() => {
        mock = new MockAdapter(axios);
    });
    afterEach(() => {
        if (mock) {
            mock.restore();
            mock = null;
        }
    });

    test('fetch with basic properties', () => {
        const animalStore = new AnimalStore();
        mock.onAny().replyOnce(config => {
            expect(config.url).toBe('/api/animal/');
            expect(config.method).toBe('get');
            expect(config.params).toEqual({
                with: null,
                limit: 25,
                offset: null,
            });
            return [200, animalsData];
        });

        return animalStore.fetch().then(() => {
            expect(animalStore.length).toBe(2);
            expect(animalStore.map('id')).toEqual([2, 3]);
        });
    });

    test('fetch with url as function', () => {
        const animalStore = new AnimalStoreWithUrlFunction();
        mock.onAny().replyOnce(config => {
            expect(config.url).toBe('/api/animal/1/');
            return [200, animalsData];
        });

        return animalStore.fetch();
    });

    test('fetch with relations', () => {
        const animalStore = new AnimalStore({
            relations: ['kind.breed'],
        });
        mock.onAny().replyOnce(config => {
            expect(config.params).toEqual({
                with: 'kind.breed',
                limit: 25,
                offset: null,
            });
            return [200, animalsWithKindBreedData];
        });

        return animalStore.fetch().then(() => {
            expect(animalStore.at(0).id).toBe(1);
            expect(animalStore.at(0).kind.id).toBe(4);
            expect(animalStore.at(0).kind.breed.id).toBe(3);
        });
    });

    test('fetch with complex nested relations', () => {
        const customerStore = new CustomerStore({
            relations: ['town.restaurants.chef'],
        });
        mock.onAny().replyOnce(config => {
            expect(config.params).toEqual({
                with: 'town.restaurants.chef',
                limit: 25,
                offset: null,
            });
            return [200, customersWithTownRestaurants];
        });

        return customerStore.fetch().then(() => {
            expect(customerStore.at(0).id).toBe(1);
            expect(customerStore.at(0).town.name).toBe('Hardinxveld');
            expect(customerStore.at(0).town.restaurants.length).toBe(2);
            expect(customerStore.at(0).town.restaurants.get(1).name).toBe(
                'Fastfood'
            );
            expect(customerStore.at(0).town.restaurants.get(2).name).toBe(
                'Seafood'
            );
            expect(customerStore.at(0).town.restaurants.get(1).chef.name).toBe(
                'Snor'
            );
            expect(customerStore.at(0).town.restaurants.get(2).chef.name).toBe(
                'Baard'
            );
        });
    });

    test('isLoading', () => {
        const animalStore = new AnimalStore();
        expect(animalStore.isLoading).toBe(false);
        mock.onAny().replyOnce(() => {
            expect(animalStore.isLoading).toBe(true);
            return [200, animalsData];
        });

        return animalStore.fetch().then(() => {
            expect(animalStore.isLoading).toBe(false);
        });
    });
});

describe('Pagination', () => {
    let mock;
    beforeEach(() => {
        mock = new MockAdapter(axios);
    });
    afterEach(() => {
        if (mock) {
            mock.restore();
            mock = null;
        }
    });

    test('without limit', () => {
        const animalStore = new AnimalStore({
            limit: null,
        });

        expect(animalStore.totalPages).toBe(0);
    });

    test('set invalid limit', () => {
        const animalStore = new AnimalStore();

        expect(() => animalStore.setLimit('a')).toThrow(
            'Page limit should be a number or falsy value.'
        );

        expect(animalStore.totalPages).toBe(0);
    });

    test('with four pages on first page', () => {
        mock.onAny().replyOnce(config => {
            expect(config.params).toEqual({
                with: null,
                limit: 3,
                offset: null,
            });
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        expect(animalStore.totalPages).toBe(0);
        expect(animalStore.currentPage).toBe(1);
        expect(animalStore.hasNextPage).toBe(false);
        expect(animalStore.hasPreviousPage).toBe(false);

        return animalStore.fetch().then(() => {
            expect(animalStore.totalPages).toBe(4);
            expect(animalStore.currentPage).toBe(1);
            expect(animalStore.hasNextPage).toBe(true);
            expect(animalStore.hasPreviousPage).toBe(false);
        });
    });

    test('getNextPage - with four pages to second page', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore
            .fetch()
            .then(() => {
                mock.onAny().replyOnce(config => {
                    expect(config.params).toEqual({
                        with: null,
                        limit: 3,
                        offset: 3,
                    });
                    return [200, pagination2Data];
                });

                return animalStore.getNextPage();
            })
            .then(() => {
                expect(animalStore.map('id')).toEqual([4, 5, 6]);
                expect(animalStore.currentPage).toBe(2);
                expect(animalStore.hasPreviousPage).toBe(true);
                expect(animalStore.hasNextPage).toBe(true);
            });
    });

    test('getNextPage - with four pages to fourth page', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore
            .fetch()
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination2Data];
                });

                return animalStore.getNextPage();
            })
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination3Data];
                });

                return animalStore.getNextPage();
            })
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination4Data];
                });

                return animalStore.getNextPage();
            })
            .then(() => {
                expect(animalStore.currentPage).toBe(4);
                expect(animalStore.hasPreviousPage).toBe(true);
                expect(animalStore.hasNextPage).toBe(false);
            });
    });

    test('getPreviousPage', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore
            .fetch()
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination2Data];
                });

                return animalStore.getNextPage();
            })
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination1Data];
                });

                return animalStore.getPreviousPage();
            })
            .then(() => {
                expect(animalStore.map('id')).toEqual([1, 2, 3]);
                expect(animalStore.currentPage).toBe(1);
                expect(animalStore.hasPreviousPage).toBe(false);
            });
    });

    test('getPreviousPage - without page', () => {
        const animalStore = new AnimalStore();

        expect(() => animalStore.getPreviousPage()).toThrow(
            'There is no previous page.'
        );
    });

    test('getNextPage - without page', () => {
        const animalStore = new AnimalStore();

        expect(() => animalStore.getNextPage()).toThrow(
            'There is no next page.'
        );
    });

    test('setPage with fetch', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore
            .fetch()
            .then(() => {
                mock.onAny().replyOnce(() => {
                    return [200, pagination3Data];
                });

                return animalStore.setPage(3);
            })
            .then(() => {
                expect(animalStore.map('id')).toEqual([7, 8, 9]);
                expect(animalStore.currentPage).toBe(3);
                expect(animalStore.hasPreviousPage).toBe(true);
                expect(animalStore.hasNextPage).toBe(true);
            });
    });

    test('setPage with invalid page', () => {
        const animalStore = new AnimalStore();

        expect(() => animalStore.setPage('')).toThrow(
            'Page should be a number.'
        );
    });

    test('setPage with zero number', () => {
        const animalStore = new AnimalStore();

        expect(() => animalStore.setPage(0)).toThrow(
            'Page should be between 1 and 0.'
        );
    });

    test('setPage with not existent page', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore.fetch().then(() => {
            expect(() => animalStore.setPage(5)).toThrow(
                'Page should be between 1 and 4.'
            );
        });
    });

    test('setPage without fetch', () => {
        mock.onAny().replyOnce(() => {
            return [200, pagination1Data];
        });

        const animalStore = new AnimalStore({
            limit: 3,
        });

        return animalStore
            .fetch()
            .then(() => {
                return animalStore.setPage(3, { fetch: false });
            })
            .then(() => {
                expect(animalStore.map('id')).toEqual([1, 2, 3]);
            });
    });
});
