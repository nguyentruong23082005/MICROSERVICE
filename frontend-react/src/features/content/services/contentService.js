import { get } from '../../../api/client.js';

const PREFIX = '/catalog';

export const getContentPages = () => get(`${PREFIX}/content-pages`);

export const getContentPage = (slug) =>
  get(`${PREFIX}/content-pages/${encodeURIComponent(slug)}`);
