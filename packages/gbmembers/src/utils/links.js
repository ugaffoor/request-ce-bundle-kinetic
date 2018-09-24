import { bundle } from 'react-kinetic-core';

export const originLink = queueItem =>
  `${bundle.spaceLocation()}/submissions/${queueItem.origin.id}?review`;
