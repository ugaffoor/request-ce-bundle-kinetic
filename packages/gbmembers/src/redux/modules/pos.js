import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  AUTO_CREATE_CARD: namespace('pos', 'AUTO_CREATE_CARD'),
  SET_CREATE_CARD: namespace('pos', 'SET_CREATE_CARD'),
  FETCH_POS_CARDS: namespace('pos', 'FETCH_POS_CARDS'),
  SET_POS_CARDS: namespace('pos', 'SET_POS_CARDS'),
  FETCH_POS_CATEGORIES: namespace('pos', 'FETCH_POS_CATEGORIES'),
  SET_POS_CATEGORIES: namespace('pos', 'SET_POS_CATEGORIES'),
  FETCH_POS_PRODUCTS: namespace('pos', 'FETCH_POS_PRODUCTS'),
  SET_POS_PRODUCTS: namespace('pos', 'SET_POS_PRODUCTS'),
  FETCH_POS_BARCODES: namespace('pos', 'FETCH_POS_BARCODES'),
  SET_POS_BARCODES: namespace('pos', 'SET_POS_BARCODES'),
  FETCH_POS_ITEMS: namespace('pos', 'FETCH_POS_ITEMS'),
  SET_POS_ITEMS: namespace('pos', 'SET_POS_ITEMS'),
  FETCH_POS_STOCK: namespace('pos', 'FETCH_POS_STOCK'),
  SAVE_POS_STOCK: namespace('pos', 'SAVE_POS_STOCK'),
  SAVE_POS_STOCK_SAVED: namespace('pos', 'SAVE_POS_STOCK_SAVED'),
  DECREMENT_POS_STOCK: namespace('pos', 'DECREMENT_POS_STOCK'),
  INCREMENT_POS_STOCK: namespace('pos', 'INCREMENT_POS_STOCK'),
  SET_POS_STOCK: namespace('pos', 'SET_POS_STOCK'),
  FETCH_POS_ORDERS: namespace('pos', 'FETCH_POS_ORDERS'),
  SET_POS_ORDERS: namespace('pos', 'SET_POS_ORDERS'),
  UPDATE_POS_ORDER: namespace('pos', 'UPDATE_POS_ORDER'),
  FETCH_POS_DISCOUNTS: namespace('pos', 'FETCH_POS_DISCOUNTS'),
  SET_POS_DISCOUNTS: namespace('pos', 'SET_POS_DISCOUNTS'),
  FETCH_POS_CHECKOUT: namespace('pos', 'FETCH_POS_CHECKOUT'),
  SET_POS_CHECKOUT: namespace('pos', 'SET_POS_CHECKOUT'),
  UPDATE_POS_CHECKOUT: namespace('pos', 'UPDATE_POS_CHECKOUT'),
  SAVE_POS_ORDER: namespace('pos', 'SAVE_POS_ORDER'),
  DELETE_POS_PURSCHASED_ITEM: namespace('pos', 'DELETE_POS_PURSCHASED_ITEM'),
  SAVE_POS_PURSCHASED_ITEM: namespace('pos', 'SAVE_POS_PURSCHASED_ITEM'),
  SET_DUMMY: namespace('pos', 'SET_DUMMY'),
};

export const actions = {
  autoCreateCard: withPayload(types.AUTO_CREATE_CARD),
  setCreateCard: withPayload(types.SET_CREATE_CARD),
  fetchPOSCards: withPayload(types.FETCH_POS_CARDS),
  setPOSCards: withPayload(types.SET_POS_CARDS),
  fetchPOSCategories: withPayload(types.FETCH_POS_CATEGORIES),
  setPOSCategories: withPayload(types.SET_POS_CATEGORIES),
  fetchPOSProducts: withPayload(types.FETCH_POS_PRODUCTS),
  setPOSProducts: withPayload(types.SET_POS_PRODUCTS),
  fetchPOSBarcodes: withPayload(types.FETCH_POS_BARCODES),
  setPOSBarcodes: withPayload(types.SET_POS_BARCODES),
  fetchPOSStock: withPayload(types.FETCH_POS_STOCK),
  setPOSStock: withPayload(types.SET_POS_STOCK),
  savePOSStock: withPayload(types.SAVE_POS_STOCK),
  setPOSStockSaved: withPayload(types.SAVE_POS_STOCK_SAVED),
  decrementPOSStock: withPayload(types.DECREMENT_POS_STOCK),
  incrementPOSStock: withPayload(types.INCREMENT_POS_STOCK),
  fetchPOSItems: withPayload(types.FETCH_POS_ITEMS),
  setPOSItems: withPayload(types.SET_POS_ITEMS),
  fetchPOSOrders: withPayload(types.FETCH_POS_ORDERS),
  setPOSOrders: withPayload(types.SET_POS_ORDERS),
  updatePOSOrder: withPayload(types.UPDATE_POS_ORDER),
  fetchPOSDiscounts: withPayload(types.FETCH_POS_DISCOUNTS),
  setPOSDiscounts: withPayload(types.SET_POS_DISCOUNTS),
  fetchPOSCheckout: withPayload(types.FETCH_POS_CHECKOUT),
  setPOSCheckout: withPayload(types.SET_POS_CHECKOUT),
  updatePOSCheckout: withPayload(types.UPDATE_POS_CHECKOUT),
  savePOSCheckout: withPayload(types.SAVE_POS_ORDER),
  setPOSSave: withPayload(types.SET_POS_SAVE),
  deletePOSPurchasedItem: withPayload(types.DELETE_POS_PURSCHASED_ITEM),
  savePOSSavePurchasedItem: withPayload(types.SAVE_POS_PURSCHASED_ITEM),
  setDummy: withPayload(types.SET_DUMMY),
};

export const State = Record({
  posAutoCardCreated: {},
  posAutoCreateCardProcessing: false,
  posCards: [],
  posCardsLoading: true,
  posCategories: [],
  posCategoriesLoading: true,
  posProducts: [],
  posProductsLoading: true,
  posBarcodes: [],
  posBarcodesLoading: true,
  posStock: [],
  posStockLoading: true,
  posItems: [],
  posItemsLoading: true,
  posOrders: [],
  posOrdersLoading: true,
  posDiscounts: [],
  posDiscountsLoading: true,
  posCheckout: {},
  posSaving: false,
  posStockSaving: false,
  posOrderUpdated: false,
  error: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.AUTO_CREATE_CARD:
      return state.set('posAutoCreateCardProcessing', true);
    case types.SET_CREATE_CARD:
      return state.set('posAutoCreateCardProcessing', false);
    case types.FETCH_POS_CARDS:
      return state.set('posCardsLoading', true);
    case types.SET_POS_CARDS: {
      return state.set('posCardsLoading', false).set('posCards', payload);
    }
    case types.FETCH_POS_CATEGORIES:
      return state.set('posCategoriesLoading', true);
    case types.SET_POS_CATEGORIES: {
      return state
        .set('posCategoriesLoading', false)
        .set('posCategories', payload);
    }
    case types.FETCH_POS_PRODUCTS:
      return state.set('posProductsLoading', true);
    case types.SET_POS_PRODUCTS: {
      return state.set('posProductsLoading', false).set('posProducts', payload);
    }
    case types.FETCH_POS_BARCODES:
      return state.set('posBarcodesLoading', true);
    case types.SET_POS_BARCODES: {
      return state.set('posBarcodesLoading', false).set('posBarcodes', payload);
    }
    case types.FETCH_POS_STOCK:
      return state.set('posStockLoading', true);
    case types.SET_POS_STOCK: {
      return state.set('posStockLoading', false).set('posStock', payload);
    }
    case types.FETCH_POS_ITEMS:
      return state.set('posItemsLoading', true);
    case types.SET_POS_ITEMS: {
      return state.set('posItemsLoading', false).set('posItems', payload);
    }
    case types.FETCH_POS_ORDERS:
      return state.set('posOrdersLoading', true);
    case types.SET_POS_ORDERS: {
      return state.set('posOrdersLoading', false).set('posOrders', payload);
    }
    case types.UPDATE_POS_ORDER: {
      return state.set('posOrderUpdated', true);
    }
    case types.FETCH_POS_DISCOUNTS:
      return state.set('posDiscountsLoading', true);
    case types.SET_POS_DISCOUNTS: {
      return state
        .set('posDiscountsLoading', false)
        .set('posDiscounts', payload);
    }
    case types.FETCH_POS_CHECKOUT:
      return state.set('posCheckoutLoading', true);
    case types.SET_POS_CHECKOUT: {
      return state.set('posCheckoutLoading', false).set('posCheckout', payload);
    }
    case types.SET_POS_SAVE: {
      return state.set('posSaving', false).set('posSave', payload);
    }
    case types.SAVE_POS_STOCK: {
      return state.set('posStockSaving', true);
    }
    case types.SAVE_POS_STOCK_SAVED: {
      var products = payload.products;
      for (var i = 0; i < products.length; i++) {
        if (products[i].stock === undefined) products[i].stock = [];
        if (products[i]['id'] === payload.stock.values['Product ID']) {
          var idx = products[i].stock.findIndex(
            item => item.id === payload.stock.id,
          );
          if (idx === -1) {
            products[i].stock[products[i].stock.length] = payload.stock;
          } else {
            products[i].stock[idx] = payload.stock;
          }
        }
      }

      return state.set('posStockSaving', false).set('posProducts', products);
    }
    default:
      return state;
  }
};
