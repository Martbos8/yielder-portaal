// Repository layer — re-exports all repository functions
// Replaces the monolithic queries.ts with domain-specific repositories

export { getTickets, getTicketsPaginated, getTicketById, getRecentTickets, getOpenTicketCount, getSimilarTickets, getTicketStats } from "./ticket.repository";
export type { TicketResponseStats, PaginatedResult } from "./ticket.repository";
export { getHardwareAssets, getExpiredWarrantyHardware } from "./hardware.repository";
export { getAgreements, getExpiringAgreements } from "./agreement.repository";
export { getUserProfile, getUserCompanyId, getUserCompany, getContacts, getDashboardStats } from "./company.repository";
export { getNotifications, getUnreadNotificationCount } from "./notification.repository";
export { getLicenses } from "./license.repository";
export { getActiveProducts, getProductCategories, getProductDependencies, getClientProducts } from "./product.repository";
export { getSyncStatus } from "./sync.repository";
export { getDashboardTrends, getRecentActivity } from "./dashboard.repository";
export type { DashboardTrends, ActivityEntry } from "./dashboard.repository";

// Cached repository wrappers
export {
  getCachedActiveProducts,
  getCachedProductCategories,
  getCachedProductDependencies,
  getCachedClientProducts,
  getCachedUserCompany,
  getCachedUserCompanyId,
  getCachedDashboardStats,
  getCachedDashboardTrends,
  getCachedRecentActivity,
  getCachedRecommendations,
  invalidateProductCache,
  invalidateCompanyCache,
  invalidateDashboardCache,
  invalidateRecommendationCache,
  invalidateAllCaches,
} from "./cached";

