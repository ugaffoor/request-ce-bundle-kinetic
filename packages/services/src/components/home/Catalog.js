import React, { Fragment } from 'react';
import { KappLink as Link, PageTitle } from 'common';
import { CategoryCard } from '../shared/CategoryCard';
import { ServiceCard } from '../shared/ServiceCard';

export const Catalog = ({
  kapp,
  forms,
  submissions,
  homePageMode,
  homePageItems,
  fetchSubmissions,
}) => {
  return (
    <Fragment>
      <PageTitle parts={[]} />
      <div className="page-container page-container--services-home">
        <div className="page-panel page-panel--transparent page-panel--two-thirds page-panel--services">
          <div className="page-title">
            <div className="page-title__wrapper">
              <h3 className="text-lowercase">{kapp.name} /</h3>
              <h1>{homePageMode}</h1>
            </div>
          </div>
          <div className="cards__wrapper cards__wrapper--categories">
            {homePageItems.map(item =>
              homePageMode === 'Categories' ? (
                <CategoryCard
                  key={item.slug}
                  category={item}
                  path={`/categories/${item.slug}`}
                />
              ) : (
                <ServiceCard
                  key={item.slug}
                  form={item}
                  path={`/forms/${item.slug}`}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};
