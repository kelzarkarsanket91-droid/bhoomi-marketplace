import { Router } from 'express';
import {
  sendOtp,
  verifyOtpAndLogin,
  register,
  switchRole,
  refreshToken,
  getMe,
} from '../controllers/auth.controller.js';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  getFavorites,
} from '../controllers/property.controller.js';
import {
  createInquiry,
  getInquiries,
  updateInquiryStatus,
} from '../controllers/inquiry.controller.js';
import {
  getDeals,
  updateDealStage,
  submitKycForDeal,
  viewDecryptedKyc,
} from '../controllers/deal.controller.js';
import {
  getDashboardOverview,
  getContactsDirectory,
  exportContactsCsv,
} from '../controllers/dashboard.controller.js';
import {
  computeLoanMetrics,
  computePropertyTaxes,
  getLenderQuotes,
  checkAffordability,
} from '../controllers/finance.controller.js';
import { sendChatMessage, getChatHistory } from '../controllers/chat.controller.js';
import { exportUserData, requestDataDeletion } from '../controllers/compliance.controller.js';
import { authenticate, optionalAuthenticate, requireRoles } from '../middleware/auth.middleware.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Bhoomi Real Estate Marketplace API',
    version: '1.0.0',
    region: 'Vidarbha (Nagpur/Wardha)',
  });
});

// Auth Routes
apiRouter.post('/auth/send-otp', sendOtp);
apiRouter.post('/auth/verify-otp', verifyOtpAndLogin);
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/refresh-token', refreshToken);
apiRouter.post('/auth/switch-role', authenticate, switchRole);
apiRouter.get('/auth/me', authenticate, getMe);

// Properties Routes
apiRouter.get('/properties', optionalAuthenticate, getProperties);
apiRouter.get('/properties/favorites/me', authenticate, getFavorites);
apiRouter.get('/properties/:id', optionalAuthenticate, getPropertyById);
apiRouter.post('/properties', authenticate, createProperty);
apiRouter.put('/properties/:id', authenticate, updateProperty);
apiRouter.delete('/properties/:id', authenticate, deleteProperty);
apiRouter.post('/properties/:id/favorite', authenticate, toggleFavorite);

// Inquiries Routes
apiRouter.post('/inquiries', optionalAuthenticate, createInquiry);
apiRouter.get('/inquiries', authenticate, getInquiries);
apiRouter.patch('/inquiries/:id/status', authenticate, updateInquiryStatus);

// Deals & KYC Routes
apiRouter.get('/deals', authenticate, getDeals);
apiRouter.patch('/deals/:id/stage', authenticate, updateDealStage);
apiRouter.post('/deals/:id/kyc', authenticate, submitKycForDeal);
apiRouter.get('/deals/kyc/:documentId/decrypt', authenticate, requireRoles(['ADMIN']), viewDecryptedKyc);

// Dashboard Routes (Agent/Owner)
apiRouter.get('/dashboard/overview', authenticate, requireRoles(['ADMIN', 'BROKER']), getDashboardOverview);
apiRouter.get('/dashboard/contacts', authenticate, requireRoles(['ADMIN', 'BROKER']), getContactsDirectory);
apiRouter.get('/dashboard/export/contacts.csv', authenticate, requireRoles(['ADMIN', 'BROKER']), exportContactsCsv);

// Finance Engine Routes
apiRouter.post('/finance/calculate', computeLoanMetrics);
apiRouter.post('/finance/taxes', computePropertyTaxes);
apiRouter.get('/finance/lenders', getLenderQuotes);
apiRouter.post('/finance/affordability', checkAffordability);

// AI Chatbot Routes
apiRouter.post('/chat/message', optionalAuthenticate, sendChatMessage);
apiRouter.get('/chat/history/:sessionId', getChatHistory);

// DPDP Compliance Routes
apiRouter.get('/compliance/export', authenticate, exportUserData);
apiRouter.post('/compliance/delete-request', authenticate, requestDataDeletion);

export default apiRouter;
