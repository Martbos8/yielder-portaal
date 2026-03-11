// Re-export all repository functions for backward compatibility.
// New code should import from @/lib/repositories directly.

export {
  getUserProfile,
  getUserCompanyId,
  getUserCompany,
  getContacts,
  getDashboardStats,
  getTickets,
  getTicketById,
  getRecentTickets,
  getOpenTicketCount,
  getHardwareAssets,
  getExpiredWarrantyHardware,
  getAgreements,
  getExpiringAgreements,
  getNotifications,
  getLicenses,
  getSyncStatus,
} from "./repositories";
