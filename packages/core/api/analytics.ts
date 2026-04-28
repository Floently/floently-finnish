import { apiGet } from './client';
export function fetchAnalyticsEvents() { return apiGet('/analytics/events'); }
