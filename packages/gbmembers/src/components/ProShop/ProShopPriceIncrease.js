import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { updateSubmission } from '@kineticdata/react';
import moment from 'moment';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  posProducts: state.member.pos.posProducts,
  posStock: state.member.pos.posStock,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
});

const mapDispatchToProps = {};

export class ProShopPriceIncrease extends Component {
  constructor(props) {
    super(props);

    const currency = getAttributeValue(props.space, 'Currency') || 'USD';
    this.currencySymbol = getCurrency(currency)['symbol'];

    this.state = {
      increaseType: 'percentage',
      increaseValue: '',
      selectedProducts: {},
      applying: false,
      progressCurrent: 0,
      progressTotal: 0,
      appliedCount: 0,
      errorCount: 0,
      showCompletePopup: false,
      filterCategory: '',
      filterName: '',
      inStockOnly: false,
      historyPopup: null, // { productId, history[] }
    };
  }

  getProductCategories(p) {
    const raw = p.values['Categories'];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getPriceHistory(p) {
    const raw = p.values['Price Increases'];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getCategories() {
    const cats = new Set();
    (this.props.posProducts || []).forEach(p => {
      this.getProductCategories(p).forEach(c => {
        if (c && c !== 'All') cats.add(c);
      });
    });
    return [...cats].sort();
  }

  getFilteredProducts() {
    const { filterCategory, filterName, inStockOnly } = this.state;
    const posStock = this.props.posStock || [];
    return (this.props.posProducts || [])
      .filter(p => {
        if (p.values['Status'] === 'Inactive') return false;
        if (
          filterCategory &&
          !this.getProductCategories(p).includes(filterCategory)
        )
          return false;
        if (
          filterName &&
          !(p.values['Name'] || '')
            .toLowerCase()
            .includes(filterName.toLowerCase())
        )
          return false;
        if (inStockOnly) {
          const stock = posStock.find(s => s.values['Product ID'] === p.id);
          if (!stock) return false;
        }
        return true;
      })
      .sort((a, b) =>
        (a.values['Name'] || '').localeCompare(b.values['Name'] || ''),
      );
  }

  calcNewPrice(currentPrice) {
    const { increaseType, increaseValue } = this.state;
    const val = parseFloat(increaseValue);
    if (!increaseValue || isNaN(val) || val <= 0) return null;
    const price = parseFloat(currentPrice) || 0;
    if (increaseType === 'percentage') {
      return Math.round(price * (1 + val / 100) * 100) / 100;
    }
    return Math.round((price + val) * 100) / 100;
  }

  toggleAll(products, checked) {
    const next = { ...this.state.selectedProducts };
    products.forEach(p => {
      next[p.id] = checked;
    });
    this.setState({ selectedProducts: next });
  }

  toggleProduct(id, checked) {
    this.setState(prev => ({
      selectedProducts: { ...prev.selectedProducts, [id]: checked },
    }));
  }

  selectedCount(products) {
    return products.filter(p => this.state.selectedProducts[p.id]).length;
  }

  async applyIncrease() {
    const { increaseType, increaseValue } = this.state;
    const products = this.getFilteredProducts().filter(
      p => this.state.selectedProducts[p.id],
    );
    if (products.length === 0) return;

    const submitter =
      (this.props.profile && this.props.profile.displayName) || '';
    const datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    const increaseApplied =
      increaseType === 'percentage'
        ? `${increaseValue}%`
        : `${this.currencySymbol}${parseFloat(increaseValue).toFixed(2)}`;

    this.setState({
      applying: true,
      progressCurrent: 0,
      progressTotal: products.length,
      appliedCount: 0,
      errorCount: 0,
      showCompletePopup: false,
    });

    let appliedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      this.setState({ progressCurrent: i + 1 });

      const fromPrice = parseFloat(product.values['Price'] || 0);
      const newPrice = this.calcNewPrice(product.values['Price']);
      if (newPrice === null) continue;

      const existingHistory = this.getPriceHistory(product);
      const newEntry = {
        Submitter: submitter,
        Datetime: datetime,
        fromPrice,
        toPrice: newPrice,
        increaseApplied,
      };
      const updatedHistory = [...existingHistory, newEntry];

      try {
        await updateSubmission({
          id: product.id,
          values: {
            Price: String(newPrice),
            'Price Increases': JSON.stringify(updatedHistory),
          },
          datastore: true,
        });
        product.values['Price'] = String(newPrice);
        product.values['Price Increases'] = JSON.stringify(updatedHistory);
        appliedCount++;
      } catch (e) {
        console.error('Failed to update product', product.id, e);
        errorCount++;
      }
    }

    this.setState({
      applying: false,
      appliedCount,
      errorCount,
      showCompletePopup: true,
      increaseValue: '',
      selectedProducts: {},
    });
  }

  render() {
    const {
      increaseType,
      increaseValue,
      selectedProducts,
      applying,
      progressCurrent,
      progressTotal,
      appliedCount,
      errorCount,
      showCompletePopup,
      filterCategory,
      filterName,
      inStockOnly,
      historyPopup,
    } = this.state;

    const cs = this.currencySymbol;
    const categories = this.getCategories();
    const products = this.getFilteredProducts();
    const selected = this.selectedCount(products);
    const hasValidIncrease =
      increaseValue &&
      !isNaN(parseFloat(increaseValue)) &&
      parseFloat(increaseValue) > 0;
    const allSelected =
      products.length > 0 && products.every(p => selectedProducts[p.id]);

    return (
      <div className="proShopPriceIncrease">
        <h5 style={{ marginBottom: '12px' }}>Product Price Increase</h5>

        <div className="piSection">
          <div className="piFieldRow">
            <label>Increase Type</label>
            <div className="piRadioGroup">
              <label>
                <input
                  type="radio"
                  value="percentage"
                  checked={increaseType === 'percentage'}
                  onChange={() => this.setState({ increaseType: 'percentage' })}
                />
                Percentage (%)
              </label>
              <label>
                <input
                  type="radio"
                  value="fixed"
                  checked={increaseType === 'fixed'}
                  onChange={() => this.setState({ increaseType: 'fixed' })}
                />
                Fixed Amount ({cs})
              </label>
            </div>
          </div>

          <div className="piFieldRow">
            <label>
              Increase Amount{' '}
              <span style={{ color: '#888', fontWeight: 'normal' }}>
                {increaseType === 'percentage' ? '(%)' : `(${cs})`}
              </span>
            </label>
            <input
              type="number"
              className="form-control"
              style={{ maxWidth: '140px' }}
              min="0"
              step={increaseType === 'percentage' ? '0.1' : '0.01'}
              value={increaseValue}
              onChange={e =>
                this.setState({ increaseValue: e.target.value, done: false })
              }
              placeholder={
                increaseType === 'percentage' ? 'e.g. 5' : 'e.g. 2.50'
              }
            />
          </div>
        </div>

        <div className="piSection">
          <div className="piFilterBar">
            <input
              type="text"
              className="form-control"
              placeholder="Filter by name..."
              style={{ maxWidth: '200px' }}
              value={filterName}
              onChange={e => this.setState({ filterName: e.target.value })}
            />
            {categories.length > 0 && (
              <select
                className="form-control"
                style={{ maxWidth: '180px' }}
                value={filterCategory}
                onChange={e =>
                  this.setState({ filterCategory: e.target.value })
                }
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
            <label className="piStockLabel">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => this.setState({ inStockOnly: e.target.checked })}
              />
              Stock Only
            </label>
          </div>

          <div className="piProductList">
            <div className="piProductHeader">
              <span className="piColCheck">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => this.toggleAll(products, e.target.checked)}
                  disabled={products.length === 0}
                />
              </span>
              <span className="piColName">Product</span>
              <span className="piColCategory">Category</span>
              <span className="piColPrice">Current Price</span>
              <span className="piColNew">New Price</span>
            </div>

            {products.length === 0 && (
              <div className="piEmpty">No active products found.</div>
            )}

            {products.map(p => {
              const newPrice = hasValidIncrease
                ? this.calcNewPrice(p.values['Price'])
                : null;
              const isSelected = !!selectedProducts[p.id];
              const history = this.getPriceHistory(p);
              const hasHistory = history.length > 0;

              return (
                <div
                  key={p.id}
                  className={
                    'piProductRow' +
                    (isSelected ? ' piSelected' : '') +
                    (hasHistory ? ' piHasIncrease' : '')
                  }
                  onClick={() => this.toggleProduct(p.id, !isSelected)}
                >
                  <span className="piColCheck">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        e.stopPropagation();
                        this.toggleProduct(p.id, e.target.checked);
                      }}
                    />
                  </span>
                  <span className="piColName">
                    <span className="piProductNameRow">
                      <span className="piProductName">{p.values['Name']}</span>
                      {hasHistory && (
                        <button
                          type="button"
                          className="piHistoryBtn"
                          title={`${history.length} price increase${
                            history.length !== 1 ? 's' : ''
                          } recorded`}
                          onClick={e => {
                            e.stopPropagation();
                            this.setState({
                              historyPopup: {
                                productId: p.id,
                                name: p.values['Name'],
                                history,
                              },
                            });
                          }}
                        >
                          📈
                        </button>
                      )}
                    </span>
                    {p.values['Colour'] && (
                      <span className="piProductColour">
                        {p.values['Colour']}
                      </span>
                    )}
                    {p.values['SKU'] && (
                      <span className="piProductSku">{p.values['SKU']}</span>
                    )}
                  </span>
                  <span className="piColCategory">
                    {this.getProductCategories(p)
                      .filter(c => c !== 'All')
                      .join(', ') || '—'}
                  </span>
                  <span className="piColPrice">
                    {cs}
                    {parseFloat(p.values['Price'] || 0).toFixed(2)}
                  </span>
                  <span
                    className={
                      'piColNew' +
                      (newPrice !== null && isSelected
                        ? ' piNewPriceHighlight'
                        : '')
                    }
                  >
                    {newPrice !== null && isSelected
                      ? `${cs}${newPrice.toFixed(2)}`
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="piFooter">
            <span className="piSelectedCount">
              {selected} of {products.length} product
              {products.length !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              className="btn btn-success"
              disabled={!hasValidIncrease || selected === 0 || applying}
              onClick={() => this.applyIncrease()}
            >
              {applying
                ? `Updating ${progressCurrent} of ${progressTotal}...`
                : `Apply Increase to ${selected} Product${
                    selected !== 1 ? 's' : ''
                  }`}
            </button>
          </div>

          {applying &&
            progressTotal > 0 && (
              <div className="piProgressBar">
                <div
                  className="piProgressFill"
                  style={{
                    width: `${Math.round(
                      (progressCurrent / progressTotal) * 100,
                    )}%`,
                  }}
                />
                <span className="piProgressLabel">
                  {progressCurrent} / {progressTotal}
                </span>
              </div>
            )}
        </div>

        {showCompletePopup && (
          <div
            className="piHistoryOverlay"
            onClick={() => this.setState({ showCompletePopup: false })}
          >
            <div
              className="piHistoryModal piCompleteModal"
              onClick={e => e.stopPropagation()}
            >
              <div className="piHistoryHeader">
                <span>Price Increase Complete</span>
                <button
                  type="button"
                  className="piHistoryClose"
                  onClick={() => this.setState({ showCompletePopup: false })}
                >
                  ✕
                </button>
              </div>
              <div className="piCompleteBody">
                {appliedCount > 0 && (
                  <p className="piCompleteSuccess">
                    ✓ {appliedCount} product{appliedCount !== 1 ? 's' : ''}{' '}
                    updated successfully.
                  </p>
                )}
                {errorCount > 0 && (
                  <p className="piCompleteError">
                    ✕ {errorCount} product{errorCount !== 1 ? 's' : ''} failed
                    to update.
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => this.setState({ showCompletePopup: false })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {historyPopup && (
          <div
            className="piHistoryOverlay"
            onClick={() => this.setState({ historyPopup: null })}
          >
            <div className="piHistoryModal" onClick={e => e.stopPropagation()}>
              <div className="piHistoryHeader">
                <span>Price History — {historyPopup.name}</span>
                <button
                  type="button"
                  className="piHistoryClose"
                  onClick={() => this.setState({ historyPopup: null })}
                >
                  ✕
                </button>
              </div>
              <table className="piHistoryTable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Submitter</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Increase</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historyPopup.history].reverse().map((entry, i) => (
                    <tr key={i}>
                      <td>
                        {entry.Datetime
                          ? moment(
                              entry.Datetime,
                              'YYYY-MM-DD HH:mm:ss',
                            ).format('L hh:mm A')
                          : ''}
                      </td>
                      <td>{entry.Submitter}</td>
                      <td>
                        {cs}
                        {parseFloat(entry.fromPrice || 0).toFixed(2)}
                      </td>
                      <td>
                        {cs}
                        {parseFloat(entry.toPrice || 0).toFixed(2)}
                      </td>
                      <td>{entry.increaseApplied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
);
export const ProShopPriceIncreaseContainer = enhance(ProShopPriceIncrease);
