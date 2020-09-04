import React from 'react';

export const CatalogSearch = props => (
  <form onSubmit={props.submitHandler(props)} className="search-box__form">
    <input
      type="text"
      placeholder="How can we help you?"
      value={props.searchTerm}
      autoFocus
      onChange={event => props.catalogSearchInput(event.target.value)}
    />
    <span className="fa fa-search" />
  </form>
);
