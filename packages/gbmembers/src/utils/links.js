import { bundle } from '@kineticdata/react';

export const originLink = queueItem =>
  `${bundle.spaceLocation()}/submissions/${queueItem.origin.id}?review`;
