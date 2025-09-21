import { select, all, call, put, takeEvery } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  updateSubmission,
  createSubmission,
  deleteSubmission,
} from '@kineticdata/react';
import $ from 'jquery';
import moment from 'moment';
import { getAttributeValue } from '../../utils';

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
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const SEARCH_PRODUCT = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();
    const SEARCH_STOCK = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, nextPageToken } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'pos-product',
      search: SEARCH_PRODUCT,
    });
    var nextPageTokenValue = nextPageToken;
    var allSubmissions = [];
    allSubmissions = allSubmissions.concat(submissions);

    while (nextPageTokenValue) {
      let search2 = new SubmissionSearch(true)
        .includes(['values'])
        .limit(1000)
        .pageToken(nextPageTokenValue)
        .build();

      const [submissions2, nextPageToken] = yield all([
        call(searchSubmissions, {
          get: true,
          datastore: true,
          form: 'pos-product',
          search: search2,
        }),
      ]);
      allSubmissions = allSubmissions.concat(submissions2.submissions);
      nextPageTokenValue = submissions2.nextPageToken;
    }

    var products = allSubmissions;
    const stocksSubmissions = yield all({
      submissions: call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'pos-stock',
        search: SEARCH_STOCK,
      }),
    });

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
    let nextPageTokenValue;

    const search = new SubmissionSearch(true)
      .includes(['values'])
      .limit(1000)
      .build();

    const { submissions, nextPageToken } = yield call(searchSubmissions, {
      datastore: true,
      form: 'pos-barcodes',
      search,
    });
    nextPageTokenValue = nextPageToken;
    allSubmissions = allSubmissions.concat(submissions);

    while (nextPageTokenValue) {
      let search2 = new SubmissionSearch(true)
        .includes(['values'])
        .limit(1000)
        .pageToken(nextPageTokenValue)
        .build();

      const [submissions2, nextPageToken] = yield all([
        call(searchSubmissions, {
          get: true,
          datastore: true,
          form: 'pos-barcodes',
          search: search2,
        }),
      ]);
      allSubmissions = allSubmissions.concat(submissions2.submissions);
      nextPageTokenValue = submissions2.nextPageToken;
    }
    yield put(actions.setPOSBarcodes(allSubmissions));
  } catch (error) {
    console.log('Error in fetchPOSBarcodes: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSStock(action) {
  try {
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch(true)
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

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Date time processed]')
      .gteq(
        'values[Date time processed]',
        action.payload.dateFrom.format(
          'YYYY-MM-DDT00:00:00' + action.payload.timezoneOffset,
        ),
      )
      .lteq(
        'values[Date time processed]',
        action.payload.dateTo.format(
          'YYYY-MM-DDT23:59:00' + action.payload.timezoneOffset,
        ),
      )
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
export function* fetchPOSOrdersPI(action) {
  try {
    const search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Date time processed]')
      .gteq(
        'values[Date time processed]',
        action.payload.dateFrom.format(
          'YYYY-MM-DDT00:00:00' + action.payload.timezoneOffset,
        ),
      )
      .lteq(
        'values[Date time processed]',
        action.payload.dateTo.format(
          'YYYY-MM-DDT23:59:00' + action.payload.timezoneOffset,
        ),
      )
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'pos-order',
      search,
    });
    yield put(actions.setPOSOrdersPI(submissions));
  } catch (error) {
    console.log('Error in fetchPOSOrdersPI: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchPOSDiscounts(action) {
  try {
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const SEARCH = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[User Name]')
      .eq('values[User Name]', action.payload.username)
      .build();

    let checkout = {};
    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'pos-checkout',
      search: SEARCH,
    });
    if (submissions.length === 0) {
      checkout['User Name'] = action.payload.username;
      checkout['Checkout Items'] = {};

      const { submission } = yield call(createSubmission, {
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
    const { submission } = yield call(updateSubmission, {
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

export function* updatePOSOrder(action) {
  try {
    const { submission } = yield call(updateSubmission, {
      id: action.payload.id,
      values: action.payload.values,
      datastore: true,
    });
    console.log('updatePOSOrder');
    yield put(
      errorActions.addSuccess('Order update successfully', 'Update POS Order'),
    );
  } catch (error) {
    console.log('Error in updatePOSOrder: ' + util.inspect(error));
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
      'YYYY-MM-DDTHH:mm:SSZ',
    );
    values['Auth Code'] = action.payload['auth_code'];
    values['SubTotal'] = action.payload['subtotal'];
    values['Discount'] = action.payload['discount'];
    values['Sales Tax'] = action.payload['salestax'];
    values['Sales Tax 2'] = action.payload['salestax2'];
    values['Total'] = action.payload['total'];
    values['Transaction ID'] = action.payload['transaction_id'];
    values['POS Checkout JSON'] = action.payload['posCheckout'];

    const { submission } = yield call(createSubmission, {
      values: values,
      formSlug: 'pos-order',
      datastore: true,
    });

    console.log('savePOSCheckout');

    yield put(
      actions.setPOSSave({ id: submission.id, payload: action.payload }),
    );
  } catch (error) {
    console.log('Error in updatePOSCheckout: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* savePOSSavePurchasedItem(action) {
  try {
    const { submission } = yield call(createSubmission, {
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
    const SEARCH = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Product ID],values[Colour],values[Size]')
      .eq('values[Product ID]', action.payload.product.id)
      .eq('values[Colour]', action.payload.product.values['Colour'])
      .eq('values[Size]', action.payload.size)
      .build();
    let stock = [];
    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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

      const { submission } = yield call(createSubmission, {
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

      const { submission } = yield call(updateSubmission, {
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
    const SEARCH = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Product ID],values[Size]')
      .eq('values[Product ID]', action.payload.productID)
      .eq('values[Size]', action.payload.size)
      .build();
    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'pos-stock',
      search: SEARCH,
    });
    if (submissions.length > 0) {
      let values = {};
      values['Quantity'] =
        parseInt(submissions[0].values['Quantity']) - action.payload.quantity;

      const { submission } = yield call(updateSubmission, {
        id: submissions[0].id,
        values: values,
        datastore: true,
        include: 'details,values',
      });

      console.log('decrementPOSStock');
    }
  } catch (error) {
    console.log('Error in decrementPOSStock: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* incrementPOSStock(action) {
  try {
    const SEARCH = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Product ID],values[Size]')
      .eq('values[Product ID]', action.payload.productID)
      .eq('values[Size]', action.payload.size)
      .build();
    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'pos-stock',
      search: SEARCH,
    });
    if (submissions.length > 0) {
      let values = {};
      values['Quantity'] =
        parseInt(submissions[0].values['Quantity']) + action.payload.quantity;

      const { submission } = yield call(updateSubmission, {
        id: submissions[0].id,
        values: values,
        datastore: true,
        include: 'details,values',
      });

      console.log('incrementPOSStock');
    }
  } catch (error) {
    console.log('Error in incrementPOSStock: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* deletePOSPurchasedItem(action) {
  try {
    const { submission } = yield call(deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    yield put(
      errorActions.addSuccess(
        'POS Purchased Item deleted successfully',
        'Delete POS Purchased Item',
      ),
    );
  } catch (error) {
    console.log('Error in deletePOSPurchasedItem: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* autoCreateCard(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    transactionID: action.payload.transactionID,
    name:
      action.payload.member.values['First Name'] +
      ' ' +
      action.payload.member.values['Last Name'],
    address: action.payload.member.values['Address'],
    city: action.payload.member.values['Suburb'],
    province: action.payload.member.values['State'],
    country: getAttributeValue(
      'School Country Code',
      '',
      appSettings.kapp,
      appSettings.space,
    )[0],
    postalCode: action.payload.member.values['Postcode'],
    email: action.payload.member.values['Email'],
  };

  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + '/createProfileCard', args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Auto Create Card',
        );
      } else {
        var data = JSON.parse(result.data.data);
        action.payload.setCreateCard();
        action.payload.autoCreateCardCompleted(
          data.profileId,
          action.payload.member,
        );
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}
export function* clearPOSCards(action) {
  try {
  } catch (error) {
    console.log('Error in clearPOSCards: ' + util.inspect(error));
  }
}

export function* watchPOS() {
  console.log('watchPOS');
  yield takeEvery(types.AUTO_CREATE_CARD, autoCreateCard);
  yield takeEvery(types.CLEAR_POS_CARDS, clearPOSCards);
  yield takeEvery(types.FETCH_POS_CARDS, fetchPOSCards);
  yield takeEvery(types.FETCH_POS_CATEGORIES, fetchPOSCategories);
  yield takeEvery(types.FETCH_POS_PRODUCTS, fetchPOSProducts);
  yield takeEvery(types.FETCH_POS_BARCODES, fetchPOSBarcodes);
  yield takeEvery(types.FETCH_POS_STOCK, fetchPOSStock);
  yield takeEvery(types.FETCH_POS_ITEMS, fetchPOSItems);
  yield takeEvery(types.FETCH_POS_ORDERS, fetchPOSOrders);
  yield takeEvery(types.FETCH_POS_ORDERS_PI, fetchPOSOrdersPI);
  yield takeEvery(types.FETCH_POS_DISCOUNTS, fetchPOSDiscounts);
  yield takeEvery(types.FETCH_POS_CHECKOUT, fetchPOSCheckout);
  yield takeEvery(types.UPDATE_POS_CHECKOUT, updatePOSCheckout);
  yield takeEvery(types.SAVE_POS_ORDER, savePOSCheckout);
  yield takeEvery(types.SAVE_POS_STOCK, savePOSStock);
  yield takeEvery(types.UPDATE_POS_ORDER, updatePOSOrder);
  console.log('watchPOS2');
  yield takeEvery(types.DECREMENT_POS_STOCK, decrementPOSStock);
  yield takeEvery(types.INCREMENT_POS_STOCK, incrementPOSStock);
  yield takeEvery(types.SAVE_POS_PURSCHASED_ITEM, savePOSSavePurchasedItem);
  yield takeEvery(types.DELETE_POS_PURSCHASED_ITEM, deletePOSPurchasedItem);
}
