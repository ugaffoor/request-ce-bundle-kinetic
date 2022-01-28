import { select, all, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import $ from 'jquery';
import moment from 'moment';

import { types, actions } from '../modules/pos';
import axios from 'axios';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

export const getAppSettings = state => state.member.app;
const getProfileCardsUrl = '/getProfileCards';

const util = require('util');

export function* fetchPOSCards(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    profileId: action.payload.profileId,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getProfileCardsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get POS Cards',
        );
      } else {
        action.payload.setPOSCards(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}
export function* fetchPOSCategories(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-categories',
      search,
    });
    yield put(actions.setPOSCategories(submissions));
  } catch (error) {
    console.log('Error in fetchPOSCategories: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSProducts(action) {
  try {
    const SEARCH_PRODUCT = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();
    const SEARCH_STOCK = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const productSubmissions = yield all({
      submissions: call(CoreAPI.searchSubmissions, {
        datastore: true,
        form: 'pos-product',
        search: SEARCH_PRODUCT,
      }),
    });

    const stocksSubmissions = yield all({
      submissions: call(CoreAPI.searchSubmissions, {
        datastore: true,
        form: 'pos-stock',
        search: SEARCH_STOCK,
      }),
    });

    var products = productSubmissions.submissions.submissions;
    var stocks = stocksSubmissions.submissions.submissions;
    for (var i = 0; i < products.length; i++) {
      if (products[i].stock === undefined) products[i].stock = [];
      for (var x = 0; x < stocks.length; x++) {
        if (
          products[i]['id'] === stocks[x].values['Product ID'] &&
          stocks[x].values['Quantity'] > 0
        ) {
          products[i].stock[products[i].stock.length] = stocks[x];
        }
      }
    }
    for (i = 0; i < products.length; i++) {
      if (products[i].values['Product Type'] === 'Package') {
        if (products[i].packageStock === undefined)
          products[i].packageStock = [];
        for (
          var k = 0;
          k < products[i].values['Package Products'].length;
          k++
        ) {
          for (x = 0; x < products.length; x++) {
            if (
              products[i].values['Package Products'][k] === products[x]['id']
            ) {
              products[i].packageStock[products[i].packageStock.length] =
                products[x];
            }
          }
        }
      }
    }

    console.log(products);
    yield put(actions.setPOSProducts(products));
    yield put(actions.setPOSStock(stocksSubmissions.submissions.submissions));
  } catch (error) {
    console.log('Error in fetchPOSProducts: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSBarcodes(action) {
  try {
    let allSubmissions = [];

    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['values'])
      .limit(1000)
      .build();

    const { submissions, nextPageToken } = yield call(
      CoreAPI.searchSubmissions,
      {
        datastore: true,
        form: 'pos-barcodes',
        search,
      },
    );
    allSubmissions = allSubmissions.concat(submissions);
    if (nextPageToken) {
      const search2 = new CoreAPI.SubmissionSearch(true)
        .includes(['values'])
        .limit(1000)
        .pageToken(nextPageToken)
        .build();

      const [submissions2] = yield all([
        call(CoreAPI.searchSubmissions, {
          datastore: true,
          form: 'pos-barcodes',
          search: search2,
        }),
      ]);
      allSubmissions = allSubmissions.concat(submissions2.submissions);
    }
    yield put(actions.setPOSBarcodes(allSubmissions));
  } catch (error) {
    console.log('Error in fetchPOSBarcodes: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSStock(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-stock',
      search,
    });
    yield put(actions.setPOSProducts(submissions));
  } catch (error) {
    console.log('Error in fetchPOSStock: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSItems(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('submittedAt')
      .gteq(
        'submittedAt',
        action.payload.dateFrom.format('YYYY-MM-DDT00:00:00.000Z'),
      )
      .lteq(
        'submittedAt',
        action.payload.dateTo.format('YYYY-MM-DDT23:59:59.000Z'),
      )
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-purchased-item',
      search,
    });
    yield put(actions.setPOSItems(submissions));
  } catch (error) {
    console.log('Error in fetchPOSItems: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSOrders(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Date time processed]')
      .gteq(
        'values[Date time processed]',
        action.payload.dateFrom.format('YYYY-MM-DDT00:00:00Z'),
      )
      .lteq(
        'values[Date time processed]',
        action.payload.dateTo.format('YYYY-MM-DDT23:59:00Z'),
      )
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-order',
      search,
    });
    yield put(actions.setPOSOrders(submissions));
  } catch (error) {
    console.log('Error in fetchPOSOrders: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSDiscounts(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-discounts',
      search,
    });
    yield put(actions.setPOSDiscounts(submissions));
  } catch (error) {
    console.log('Error in fetchPOSDiscounts: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSCheckout(action) {
  try {
    const SEARCH = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[User Name]')
      .eq('values[User Name]', action.payload.username)
      .build();

    let checkout = {};
    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-checkout',
      search: SEARCH,
    });
    if (submissions.length === 0) {
      checkout['User Name'] = action.payload.username;
      checkout['Checkout Items'] = {};

      const { submission } = yield call(CoreAPI.createSubmission, {
        formSlug: 'pos-checkout',
        values: checkout,
        datastore: true,
      });
      checkout['id'] = submission['id'];
      console.log('create POS Checkout');
    } else {
      checkout['id'] = submissions[0]['id'];
      checkout['User Name'] = action.payload.username;
      checkout['Checkout Items'] = JSON.parse(
        submissions[0].values['Checkout Items'],
      );
    }
    yield put(actions.setPOSCheckout(checkout));
  } catch (error) {
    console.log('Error in fetchPOSCheckout: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* updatePOSCheckout(action) {
  try {
    let values = {};
    values['Checkout Items'] = action.payload['Checkout Items'];
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload['id'],
      values: values,
      datastore: true,
    });

    console.log('updatePOSCheckout');

    yield put(actions.setPOSCheckout(action.payload));
    if (action.payload.posProducts !== undefined) {
      yield put(actions.setPOSProducts(action.payload.posProducts));
    }
  } catch (error) {
    console.log('Error in updatePOSCheckout: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* savePOSCheckout(action) {
  try {
    let values = {};
    values['Status'] = 'Ordered';
    values['Person Type'] = action.payload['personType'];
    values['Person ID'] = action.payload['personID'];
    values['Person Name'] =
      action.payload['firstName'] + ' ' + action.payload['lastName'];
    values['Payment Type'] = action.payload['paymentType'];
    values['Card Number'] =
      '...' +
      action.payload['number'].substring(action.payload['number'].length - 4);
    values['Date time processed'] = moment(action.payload['datetime']).format(
      'YYYY-MM-DDTHH:MM:SSZ',
    );
    values['Auth Code'] = action.payload['auth_code'];
    values['SubTotal'] = action.payload['subtotal'];
    values['Discount'] = action.payload['discount'];
    values['Sales Tax'] = action.payload['salestax'];
    values['Total'] = action.payload['total'];
    values['Transaction ID'] = action.payload['transaction_id'];
    values['POS Checkout JSON'] = action.payload['posCheckout'];

    const { submission } = yield call(CoreAPI.createSubmission, {
      values: values,
      formSlug: 'pos-order',
      datastore: true,
    });

    console.log('savePOSCheckout');

    yield put(actions.setPOSSave(action.payload));
  } catch (error) {
    console.log('Error in updatePOSCheckout: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* savePOSSavePurchasedItem(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      values: action.payload.values,
      formSlug: 'pos-purchased-item',
      datastore: true,
    });

    console.log('savePOSSavePurchasedItem');
    //yield put(actions.setPOSSave(action.payload));
  } catch (error) {
    console.log('Error in savePOSSavePurchasedItem: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* savePOSStock(action) {
  try {
    const SEARCH = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Product ID],values[Colour],values[Size]')
      .eq('values[Product ID]', action.payload.product.id)
      .eq('values[Colour]', action.payload.product.values['Colour'])
      .eq('values[Size]', action.payload.size)
      .build();
    let stock = [];
    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-stock',
      search: SEARCH,
    });
    if (submissions.length === 0) {
      let values = {};
      values['Product ID'] = action.payload.product.id;
      values['Product Name'] = action.payload.product.values['Name'];
      values['SKU'] = action.payload.product.values['SKU'];
      values['Colour'] = action.payload.product.values['Colour'];
      values['Size Options'] = action.payload.product.values['Sizes'];
      values['Quantity'] = action.payload.quantity;
      values['Size'] = action.payload.size;

      const { submission } = yield call(CoreAPI.createSubmission, {
        values: values,
        formSlug: 'pos-stock',
        datastore: true,
        include: 'details,values',
      });
      stock = submission;
    } else {
      let values = {};
      if (action.payload.addStock) {
        values['Quantity'] =
          parseInt(submissions[0].values['Quantity']) + action.payload.quantity;
      } else {
        values['Quantity'] = action.payload.quantity;
      }

      const { submission } = yield call(CoreAPI.updateSubmission, {
        id: submissions[0].id,
        values: values,
        datastore: true,
        include: 'details,values',
      });
      stock = submission;
    }

    console.log('setPOSStockSaved');
    yield put(
      actions.setPOSStockSaved({
        products: action.payload.products,
        stock: stock,
      }),
    );
  } catch (error) {
    console.log('Error in savePOSStock: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* decrementPOSStock(action) {
  try {
    const SEARCH = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Product ID],values[Size]')
      .eq('values[Product ID]', action.payload.productID)
      .eq('values[Size]', action.payload.size)
      .build();
    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'pos-stock',
      search: SEARCH,
    });
    if (submissions.length > 0) {
      let values = {};
      values['Quantity'] =
        parseInt(submissions[0].values['Quantity']) - action.payload.quantity;

      const { submission } = yield call(CoreAPI.updateSubmission, {
        id: submissions[0].id,
        values: values,
        datastore: true,
        include: 'details,values',
      });

      console.log('decrementPOSStock');
    }
  } catch (error) {
    console.log('Error in savePOSStock: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchPOS() {
  console.log('watchPOS');
  yield takeEvery(types.FETCH_POS_CARDS, fetchPOSCards);
  yield takeEvery(types.FETCH_POS_CATEGORIES, fetchPOSCategories);
  yield takeEvery(types.FETCH_POS_PRODUCTS, fetchPOSProducts);
  yield takeEvery(types.FETCH_POS_BARCODES, fetchPOSBarcodes);
  yield takeEvery(types.FETCH_POS_STOCK, fetchPOSStock);
  yield takeEvery(types.FETCH_POS_ITEMS, fetchPOSItems);
  yield takeEvery(types.FETCH_POS_ORDERS, fetchPOSOrders);
  yield takeEvery(types.FETCH_POS_DISCOUNTS, fetchPOSDiscounts);
  yield takeEvery(types.FETCH_POS_CHECKOUT, fetchPOSCheckout);
  yield takeEvery(types.UPDATE_POS_CHECKOUT, updatePOSCheckout);
  yield takeEvery(types.SAVE_POS_ORDER, savePOSCheckout);
  yield takeEvery(types.SAVE_POS_STOCK, savePOSStock);
  yield takeEvery(types.DECREMENT_POS_STOCK, decrementPOSStock);
  yield takeEvery(types.SAVE_POS_PURSCHASED_ITEM, savePOSSavePurchasedItem);
}
